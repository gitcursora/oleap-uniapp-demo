// #ifdef APP
import * as appNativeAdapter from '@/uni_modules/oleap-ble-sdk'
// #endif

const SDK_VERSION = '0.1.0-native'
const DIAGNOSTIC_LIMIT = 500

const state = {
  initialized: false,
  logLevel: 'info',
  diagnostics: []
}

let nativeAdapter = null

function nowIso() {
  return new Date().toISOString()
}

function makeError(code, message, area = 'sdk', recoverable = true, details = {}) {
  return {
    code,
    message,
    area,
    recoverable,
    details
  }
}

function pushDiagnostic(event, details = {}) {
  state.diagnostics.push({
    timestamp: nowIso(),
    event,
    details
  })
  if (state.diagnostics.length > DIAGNOSTIC_LIMIT) {
    state.diagnostics.splice(0, state.diagnostics.length - DIAGNOSTIC_LIMIT)
  }
}

function normalizeNativeAdapter(module) {
  return module?.OleapBle || module?.default || module
}

function getPreloadedNativeAdapter() {
  let module = null
  // #ifdef APP
  module = appNativeAdapter
  // #endif
  return normalizeNativeAdapter(module)
}

async function loadNativeAdapter() {
  if (nativeAdapter) {
    return nativeAdapter
  }

  let adapter = null
  try {
    adapter = getPreloadedNativeAdapter()
  } catch (error) {
    throw makeError(
      'native_adapter_load_failed',
      '无法加载 native UTS adapter，请确认在 HBuilderX App 运行环境中编译',
      'sdk',
      false,
      { error: error?.message || `${error}` }
    )
  }

  if (!adapter || typeof adapter.init !== 'function') {
    throw makeError(
      'native_adapter_missing',
      '当前运行环境未提供 oleap-ble-sdk native adapter',
      'sdk',
      false
    )
  }

  nativeAdapter = adapter
  return adapter
}

async function nativeCall(name, args = []) {
  const adapter = await loadNativeAdapter()
  const method = adapter?.[name]
  if (typeof method !== 'function') {
    throw makeError('native_api_missing', `native adapter 缺少 ${name} 方法`, 'sdk', false, { name })
  }
  return method(...args)
}

function nativeCallSync(name, args = [], fallback = null) {
  const adapter = nativeAdapter
  if (!adapter) {
    return fallback
  }
  const method = adapter?.[name]
  if (typeof method !== 'function') {
    return fallback
  }
  return method(...args)
}

function nativeSubscribe(name, callback) {
  if (typeof callback !== 'function') {
    throw makeError('invalid_callback', `${name} requires a callback`, 'sdk', false)
  }
  const adapter = nativeAdapter
  if (!adapter) {
    throw makeError(
      'native_adapter_not_initialized',
      `请先 await OleapBle.init() 后再调用 ${name}`,
      'sdk',
      true,
      { name }
    )
  }
  const method = adapter?.[name]
  if (typeof method !== 'function') {
    throw makeError('native_api_missing', `native adapter 缺少 ${name} 方法`, 'sdk', false, { name })
  }
  const unsubscribe = method(callback)
  return typeof unsubscribe === 'function' ? unsubscribe : () => {}
}

function getRuntimePlus() {
  if (typeof plus !== 'undefined') {
    return plus
  }
  if (typeof globalThis !== 'undefined' && globalThis?.plus) {
    return globalThis.plus
  }
  return null
}

function buildCompatPermissionList(bluetoothState = null) {
  const androidSdk = Number(bluetoothState?.androidSdk || 0)
  if (androidSdk >= 31) {
    return [
      'android.permission.BLUETOOTH_SCAN',
      'android.permission.BLUETOOTH_CONNECT'
    ]
  }
  return ['android.permission.ACCESS_FINE_LOCATION']
}

function requestAppPermissionsCompat(permissions) {
  const runtimePlus = getRuntimePlus()
  if (!runtimePlus?.android?.requestPermissions) {
    return Promise.reject(
      makeError('plus_permission_unavailable', '当前运行环境不可直接调用 plus.android.requestPermissions', 'permission', true)
    )
  }
  return new Promise((resolve, reject) => {
    try {
      runtimePlus.android.requestPermissions(
        permissions,
        (result) => {
          const deniedPresent = Array.isArray(result?.deniedPresent) ? result.deniedPresent : []
          const deniedAlways = Array.isArray(result?.deniedAlways) ? result.deniedAlways : []
          resolve({
            granted: deniedPresent.length === 0 && deniedAlways.length === 0,
            permissions,
            deniedPresent,
            deniedAlways
          })
        },
        (error) => {
          reject(
            makeError('permission_request_failed', 'Android 权限请求失败', 'permission', true, {
              permissions,
              error: error?.message || `${error}`
            })
          )
        }
      )
    } catch (error) {
      reject(
        makeError('permission_request_failed', 'Android 权限请求失败', 'permission', true, {
          permissions,
          error: error?.message || `${error}`
        })
      )
    }
  })
}

async function ensureBlePermission() {
  const bluetoothState = await nativeCall('getBluetoothState').catch(() => null)
  if (bluetoothState?.permissionGranted === true) {
    return bluetoothState
  }
  if (Number(bluetoothState?.androidSdk || 0) >= 31 && Number(bluetoothState?.targetSdk || 0) < 31) {
    throw makeError(
      'target_sdk_too_low',
      '当前自定义基座 targetSdkVersion 低于 31，Android 12+ 无法授予 BLUETOOTH_SCAN 权限，请重新打包基座',
      'permission',
      false,
      {
        androidSdk: bluetoothState?.androidSdk,
        targetSdk: bluetoothState?.targetSdk
      }
    )
  }

  const permissions = buildCompatPermissionList(bluetoothState)
  try {
    const compatResult = await requestAppPermissionsCompat(permissions)
    const refreshedState = await nativeCall('getBluetoothState').catch(() => bluetoothState)
    const granted = compatResult.granted === true || refreshedState?.permissionGranted === true
    pushDiagnostic('permission_result', {
      granted,
      permissions,
      mode: refreshedState?.permissionMode || bluetoothState?.permissionMode || 'unknown'
    })
    return {
      ...(refreshedState || bluetoothState || {}),
      bluetooth: granted,
      permissionGranted: granted,
      requestedPermissions: permissions
    }
  } catch (compatError) {
    return nativeCall('requestPermissions').catch(() => {
      throw compatError
    })
  }
}

function normalizeConnectionState(connection) {
  return {
    connected: Boolean(connection?.connected),
    device: connection?.device || null,
    channels: connection?.channels || null,
    generation: connection?.generation
  }
}

export const OleapBle = {
  async init(options = {}) {
    state.logLevel = options.logLevel || 'info'
    const result = await nativeCall('init', [options])
    state.initialized = true
    pushDiagnostic('sdk_init', {
      version: SDK_VERSION,
      native: true,
      logLevel: state.logLevel
    })
    return result
  },

  async requestPermissions() {
    return ensureBlePermission()
  },

  async getBluetoothState() {
    return nativeCall('getBluetoothState')
  },

  async listKnownDevices() {
    return nativeCall('listKnownDevices')
  },

  async startScan(options = {}) {
    await ensureBlePermission()
    return nativeCall('startScan', [options])
  },

  async stopScan() {
    return nativeCall('stopScan')
  },

  async connect(options = {}) {
    await ensureBlePermission()
    const { deviceId, name } = options || {}
    return nativeCall('connect', [{ deviceId, name }])
  },

  async disconnect() {
    return nativeCall('disconnect')
  },

  getConnectionState() {
    return normalizeConnectionState(nativeCallSync('getConnectionState', [], {
      connected: false,
      device: null
    }))
  },

  async getBattery() {
    return nativeCall('getBattery')
  },

  async getSn() {
    return nativeCall('getSn')
  },

  async getDeviceName() {
    return nativeCall('getDeviceName')
  },

  async getFirmwareVersion() {
    return nativeCall('getFirmwareVersion')
  },

  async getHardwareVersion() {
    return nativeCall('getHardwareVersion')
  },

  async getEqMode() {
    return nativeCall('getEqMode')
  },

  async setEqMode({ mode }) {
    return nativeCall('setEqMode', [{ mode }])
  },

  async getRecordState() {
    return nativeCall('getRecordState')
  },

  async getFlashCapacity() {
    return nativeCall('getFlashCapacity')
  },

  async syncAppTime() {
    return nativeCall('syncAppTime')
  },

  async startRecording(options = {}) {
    return nativeCall('startRecording', [options])
  },

  async stopRecording(options = {}) {
    return nativeCall('stopRecording', [options])
  },

  async listFlashRecordings() {
    return nativeCall('listFlashRecordings')
  },

  async downloadFlashRecording({ fileId, format = 'wav', deleteAfterSuccess = false } = {}) {
    return nativeCall('downloadFlashRecording', [{ fileId, format, deleteAfterSuccess }])
  },

  async stopFlashDownload() {
    return nativeCall('stopFlashDownload')
  },

  onDeviceFound(callback) {
    return nativeSubscribe('onDeviceFound', callback)
  },

  onConnectionChanged(callback) {
    return nativeSubscribe('onConnectionChanged', callback)
  },

  onDpReport(callback) {
    return nativeSubscribe('onDpReport', callback)
  },

  onShortcutKey(callback) {
    return nativeSubscribe('onShortcutKey', callback)
  },

  onRecordingProgress(callback) {
    return nativeSubscribe('onRecordingProgress', callback)
  },

  onDecodeProgress(callback) {
    return nativeSubscribe('onDecodeProgress', callback)
  },

  onWaveformData(callback) {
    return nativeSubscribe('onWaveformData', callback)
  },

  onRealtimePcmData(callback, perFrame = false) {
    if (typeof callback !== 'function') {
      throw makeError('invalid_callback', 'onRealtimePcmData requires a callback', 'sdk', false)
    }
    const adapter = nativeAdapter
    if (!adapter) {
      throw makeError('native_adapter_not_initialized', '请先 await OleapBle.init() 后再调用 onRealtimePcmData', 'sdk', true, { name: 'onRealtimePcmData' })
    }
    const method = adapter?.onRealtimePcmData
    if (typeof method !== 'function') {
      throw makeError('native_api_missing', 'native adapter 缺少 onRealtimePcmData 方法', 'sdk', false, { name: 'onRealtimePcmData' })
    }
    const unsubscribe = method(callback, perFrame)
    return typeof unsubscribe === 'function' ? unsubscribe : () => {}
  },

  onError(callback) {
    return nativeSubscribe('onError', callback)
  },

  getDiagnostics() {
    const nativeDiagnostics = nativeCallSync('getDiagnostics', [], null)
    if (nativeDiagnostics != null) {
      return nativeDiagnostics
    }
    return {
      version: SDK_VERSION,
      native: true,
      events: state.diagnostics.slice()
    }
  },

  clearDiagnostics() {
    state.diagnostics = []
    return nativeCallSync('clearDiagnostics', [], undefined)
  },

  async getActiveBtDevice() {
    return nativeCall('getActiveBtDevice')
  }
}

export const init = OleapBle.init.bind(OleapBle)
export const requestPermissions = OleapBle.requestPermissions.bind(OleapBle)
export const getBluetoothState = OleapBle.getBluetoothState.bind(OleapBle)
export const listKnownDevices = OleapBle.listKnownDevices.bind(OleapBle)
export const startScan = OleapBle.startScan.bind(OleapBle)
export const stopScan = OleapBle.stopScan.bind(OleapBle)
export const connect = OleapBle.connect.bind(OleapBle)
export const disconnect = OleapBle.disconnect.bind(OleapBle)
export const getConnectionState = OleapBle.getConnectionState.bind(OleapBle)
export const getBattery = OleapBle.getBattery.bind(OleapBle)
export const getSn = OleapBle.getSn.bind(OleapBle)
export const getDeviceName = OleapBle.getDeviceName.bind(OleapBle)
export const getFirmwareVersion = OleapBle.getFirmwareVersion.bind(OleapBle)
export const getHardwareVersion = OleapBle.getHardwareVersion.bind(OleapBle)
export const getEqMode = OleapBle.getEqMode.bind(OleapBle)
export const setEqMode = OleapBle.setEqMode.bind(OleapBle)
export const getRecordState = OleapBle.getRecordState.bind(OleapBle)
export const getFlashCapacity = OleapBle.getFlashCapacity.bind(OleapBle)
export const syncAppTime = OleapBle.syncAppTime.bind(OleapBle)
export const startRecording = OleapBle.startRecording.bind(OleapBle)
export const stopRecording = OleapBle.stopRecording.bind(OleapBle)
export const listFlashRecordings = OleapBle.listFlashRecordings.bind(OleapBle)
export const downloadFlashRecording = OleapBle.downloadFlashRecording.bind(OleapBle)
export const stopFlashDownload = OleapBle.stopFlashDownload.bind(OleapBle)
export const onDeviceFound = OleapBle.onDeviceFound.bind(OleapBle)
export const onConnectionChanged = OleapBle.onConnectionChanged.bind(OleapBle)
export const onDpReport = OleapBle.onDpReport.bind(OleapBle)
export const onShortcutKey = OleapBle.onShortcutKey.bind(OleapBle)
export const onRecordingProgress = OleapBle.onRecordingProgress.bind(OleapBle)
export const onDecodeProgress = OleapBle.onDecodeProgress.bind(OleapBle)
export const onWaveformData = OleapBle.onWaveformData.bind(OleapBle)
export const onRealtimePcmData = OleapBle.onRealtimePcmData.bind(OleapBle)
export const onError = OleapBle.onError.bind(OleapBle)
export const getDiagnostics = OleapBle.getDiagnostics.bind(OleapBle)
export const clearDiagnostics = OleapBle.clearDiagnostics.bind(OleapBle)
export const getActiveBtDevice = OleapBle.getActiveBtDevice.bind(OleapBle)

export default OleapBle
