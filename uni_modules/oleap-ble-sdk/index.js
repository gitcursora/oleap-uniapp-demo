// #ifdef APP
import * as appNativeAdapter from '@/uni_modules/oleap-ble-sdk'
// #endif

const SDK_VERSION = '0.1.0-phase0'
const FRAME_TIME_MS = 20
const SAMPLE_RATE = 16000
const DEFAULT_CHANNELS = 1
const DIAGNOSTIC_LIMIT = 500

const listeners = {
  deviceFound: new Set(),
  connectionChanged: new Set(),
  dpReport: new Set(),
  recordingProgress: new Set(),
  decodeProgress: new Set(),
  error: new Set()
}

const state = {
  initialized: false,
  mock: true,
  logLevel: 'info',
  scanning: false,
  connectedDevice: null,
  eqMode: 1,
  recording: null,
  flashDownloading: false,
  diagnostics: []
}

let nativeAdapter = null

const mockDevices = [
  {
    deviceId: 'mock-oleap-archer-a1',
    name: 'Oleap Archer A1',
    rssi: -48,
    manufacturerDataHex: '1E:00:02:25:EA:01'
  },
  {
    deviceId: 'mock-oleap-pilot-p200b',
    name: 'Oleap PILOT P200b',
    rssi: -56,
    manufacturerDataHex: '1E:00:02:25:EA:02'
  }
]

const mockFlashFiles = [
  {
    fileId: 1001,
    fileLength: 38400,
    recordType: 1,
    channels: 1,
    sampleRate: SAMPLE_RATE,
    bitRate: 16000,
    recordTime: '2026-05-22T09:00:00+08:00'
  },
  {
    fileId: 1002,
    fileLength: 76800,
    recordType: 4,
    channels: 1,
    sampleRate: SAMPLE_RATE,
    bitRate: 16000,
    recordTime: '2026-05-22T09:12:00+08:00'
  }
]

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function nowIso() {
  return new Date().toISOString()
}

function makeError(code, message, area = 'bluetooth', recoverable = true, details = {}) {
  return {
    code,
    message,
    area,
    recoverable,
    details
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

function useNativeMode() {
  return state.mock === false
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
  if (!nativeAdapter) {
    return fallback
  }
  const method = nativeAdapter?.[name]
  if (typeof method !== 'function') {
    return fallback
  }
  return method(...args)
}

function nativeSubscribe(name, callback) {
  if (typeof callback !== 'function') {
    throw makeError('invalid_callback', `${name} requires a callback`, 'sdk', false)
  }
  if (!nativeAdapter) {
    throw makeError(
      'native_adapter_not_initialized',
      `请先 await OleapBle.init({ mock: false }) 后再调用 ${name}`,
      'sdk',
      true,
      { name }
    )
  }
  const method = nativeAdapter?.[name]
  if (typeof method !== 'function') {
    throw makeError('native_api_missing', `native adapter 缺少 ${name} 方法`, 'sdk', false, { name })
  }
  return method(callback)
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

function emit(name, payload) {
  const callbacks = listeners[name]
  if (!callbacks) return
  callbacks.forEach((callback) => {
    try {
      callback(payload)
    } catch (error) {
      console.warn(`[oleap-ble-sdk] listener ${name} failed`, error)
    }
  })
}

function subscribe(name, callback) {
  if (typeof callback !== 'function') {
    throw makeError('invalid_callback', `on${name} requires a callback`, 'sdk', false)
  }
  listeners[name].add(callback)
  return () => listeners[name].delete(callback)
}

function ensureInitialized() {
  if (!state.initialized) {
    throw makeError('sdk_not_initialized', '请先调用 OleapBle.init()', 'sdk', true)
  }
}

function ensureConnected() {
  ensureInitialized()
  if (!state.connectedDevice) {
    throw makeError('device_not_connected', '尚未连接 Oleap 设备', 'connection', true)
  }
}

function reportError(error) {
  pushDiagnostic('error', error)
  emit('error', error)
  throw error
}

function reportDp(dpId, name, value) {
  const report = {
    dpId,
    name,
    value,
    timestamp: nowIso()
  }
  pushDiagnostic('dp_report', report)
  emit('dpReport', report)
  return report
}

function clearRecordingTimer() {
  if (state.recording?.timer) {
    clearInterval(state.recording.timer)
  }
}

export const OleapBle = {
  async init(options = {}) {
    state.mock = options.mock !== false
    state.logLevel = options.logLevel || 'info'
    if (useNativeMode()) {
      const result = await nativeCall('init', [options])
      state.initialized = true
      return result
    }

    state.initialized = true
    pushDiagnostic('sdk_init', {
      version: SDK_VERSION,
      mock: state.mock,
      logLevel: state.logLevel
    })
  },

  async requestPermissions() {
    if (useNativeMode()) {
      return nativeCall('requestPermissions')
    }
    ensureInitialized()
    pushDiagnostic('permission_result', {
      bluetooth: true,
      permissionGranted: true,
      mock: state.mock
    })
    return {
      bluetooth: true,
      location: true,
      permissionGranted: true,
      mock: state.mock
    }
  },

  async getBluetoothState() {
    if (useNativeMode()) {
      return nativeCall('getBluetoothState')
    }
    ensureInitialized()
    return {
      supported: true,
      enabled: true,
      permissionGranted: true,
      mock: state.mock
    }
  },

  async startScan(options = {}) {
    if (useNativeMode()) {
      const bluetooth = await this.getBluetoothState().catch(() => null)
      if (bluetooth == null || bluetooth.permissionGranted !== true) {
        await this.requestPermissions()
      }
      return nativeCall('startScan', [options])
    }
    ensureInitialized()
    if (state.scanning) {
      return
    }
    state.scanning = true
    pushDiagnostic('scan_start', options)

    mockDevices.forEach((device, index) => {
      setTimeout(() => {
        if (!state.scanning) return
        emit('deviceFound', device)
      }, 120 + index * 180)
    })

    const timeoutMs = options.timeoutMs || 3000
    setTimeout(() => {
      if (state.scanning) {
        this.stopScan()
      }
    }, timeoutMs)
  },

  async stopScan() {
    if (useNativeMode()) {
      return nativeCall('stopScan')
    }
    ensureInitialized()
    if (!state.scanning) {
      return
    }
    state.scanning = false
    pushDiagnostic('scan_stop')
  },

  async connect({ deviceId } = {}) {
    if (useNativeMode()) {
      return nativeCall('connect', [{ deviceId }])
    }
    ensureInitialized()
    const device = mockDevices.find((item) => item.deviceId === deviceId) || mockDevices[0]
    await this.stopScan()
    await sleep(250)
    state.connectedDevice = {
      ...device,
      connectedAt: nowIso()
    }
    const event = {
      connected: true,
      device: state.connectedDevice
    }
    pushDiagnostic('connected', event)
    emit('connectionChanged', event)
    reportDp(0x03, 'batteryPercentage', 86)
    reportDp(0x80, 'sn', 'MOCK-SN-20260522')
    reportDp(0x81, 'eqMode', {
      modeCount: 4,
      currentMode: state.eqMode
    })
    return state.connectedDevice
  },

  async disconnect() {
    if (useNativeMode()) {
      return nativeCall('disconnect')
    }
    ensureInitialized()
    clearRecordingTimer()
    state.recording = null
    const previous = state.connectedDevice
    state.connectedDevice = null
    state.flashDownloading = false
    const event = {
      connected: false,
      device: previous
    }
    pushDiagnostic('disconnected', {
      deviceId: previous?.deviceId || null
    })
    emit('connectionChanged', event)
  },

  getConnectionState() {
    if (useNativeMode()) {
      return nativeCallSync('getConnectionState', [], {
        connected: false,
        device: null
      })
    }
    ensureInitialized()
    return {
      connected: Boolean(state.connectedDevice),
      device: state.connectedDevice
    }
  },

  async getBattery() {
    if (useNativeMode()) {
      return nativeCall('getBattery')
    }
    ensureConnected()
    return 86
  },

  async getSn() {
    if (useNativeMode()) {
      return nativeCall('getSn')
    }
    ensureConnected()
    return 'MOCK-SN-20260522'
  },

  async getDeviceName() {
    if (useNativeMode()) {
      return nativeCall('getDeviceName')
    }
    ensureConnected()
    return state.connectedDevice.name
  },

  async getFirmwareVersion() {
    if (useNativeMode()) {
      return nativeCall('getFirmwareVersion')
    }
    ensureConnected()
    return '2.0.18'
  },

  async getHardwareVersion() {
    if (useNativeMode()) {
      return nativeCall('getHardwareVersion')
    }
    ensureConnected()
    return '1.0.0'
  },

  async getEqMode() {
    if (useNativeMode()) {
      return nativeCall('getEqMode')
    }
    ensureConnected()
    return {
      modeCount: 4,
      currentMode: state.eqMode,
      raw: [1, 4, state.eqMode]
    }
  },

  async setEqMode({ mode }) {
    if (useNativeMode()) {
      return nativeCall('setEqMode', [{ mode }])
    }
    ensureConnected()
    if (!Number.isInteger(mode) || mode < 0 || mode > 255) {
      return reportError(makeError('invalid_eq_mode', 'EQ 模式必须是 0-255 的整数', 'control', false, { mode }))
    }
    state.eqMode = mode
    return reportDp(0x81, 'eqMode', {
      modeCount: 4,
      currentMode: mode
    }).value
  },

  async getRecordState() {
    if (useNativeMode()) {
      return nativeCall('getRecordState')
    }
    ensureConnected()
    const frameCount = state.recording?.frameCount || 0
    return {
      state: state.recording ? 1 : 0,
      recordedFrameCount: frameCount,
      durationMs: frameCount * FRAME_TIME_MS
    }
  },

  async getFlashCapacity() {
    if (useNativeMode()) {
      return nativeCall('getFlashCapacity')
    }
    ensureConnected()
    return {
      totalBlocks: 256,
      freeBlocks: 192,
      totalBytes: 256 * 32 * 1024,
      freeBytes: 192 * 32 * 1024
    }
  },

  async syncAppTime() {
    if (useNativeMode()) {
      return nativeCall('syncAppTime')
    }
    ensureConnected()
    pushDiagnostic('sync_app_time', {
      time: nowIso()
    })
  },

  async startRecording(options = {}) {
    if (useNativeMode()) {
      return nativeCall('startRecording', [options])
    }
    ensureConnected()
    if (state.flashDownloading) {
      return reportError(makeError('flash_download_active', 'Flash 下载中，不能开始实时录音', 'recording', true))
    }
    if (state.recording) {
      return reportError(makeError('record_already_active', '录音已在进行中', 'recording', true))
    }

    const sessionId = `mock-${Date.now()}`
    state.recording = {
      sessionId,
      scene: options.scene || 'meeting',
      startedAt: Date.now(),
      frameCount: 0,
      lostFrames: 0,
      outOfOrderFrames: 0,
      timer: null
    }

    state.recording.timer = setInterval(() => {
      if (!state.recording) return
      state.recording.frameCount += 10
      const durationMs = state.recording.frameCount * FRAME_TIME_MS
      emit('recordingProgress', {
        sessionId,
        durationMs,
        frameCount: state.recording.frameCount,
        lostFrames: state.recording.lostFrames,
        outOfOrderFrames: state.recording.outOfOrderFrames
      })
    }, 200)

    pushDiagnostic('record_start', {
      sessionId,
      scene: state.recording.scene
    })

    return {
      sessionId,
      scene: state.recording.scene
    }
  },

  async stopRecording(options = {}) {
    if (useNativeMode()) {
      return nativeCall('stopRecording', [options])
    }
    ensureConnected()
    if (!state.recording) {
      return reportError(makeError('record_not_active', '当前没有进行中的录音', 'recording', true))
    }

    const session = state.recording
    clearRecordingTimer()
    state.recording = null

    emit('decodeProgress', {
      sessionId: session.sessionId,
      phase: 'preparing',
      progress: 0
    })
    await sleep(120)
    emit('decodeProgress', {
      sessionId: session.sessionId,
      phase: 'decoding',
      progress: 0.6
    })
    await sleep(160)
    emit('decodeProgress', {
      sessionId: session.sessionId,
      phase: 'finalizing',
      progress: 1
    })

    const durationMs = session.frameCount * FRAME_TIME_MS
    const result = {
      filePath: `mock://recordings/${session.sessionId}.wav`,
      format: options.format || 'wav',
      durationMs,
      sampleRate: SAMPLE_RATE,
      channels: DEFAULT_CHANNELS,
      frameCount: session.frameCount,
      lostFrames: session.lostFrames,
      outOfOrderFrames: session.outOfOrderFrames,
      size: Math.max(44, Math.floor(durationMs * SAMPLE_RATE * DEFAULT_CHANNELS * 2 / 1000) + 44)
    }
    pushDiagnostic('record_stop', result)
    return result
  },

  async listFlashRecordings() {
    if (useNativeMode()) {
      return nativeCall('listFlashRecordings')
    }
    ensureConnected()
    pushDiagnostic('flash_list', {
      count: mockFlashFiles.length
    })
    return mockFlashFiles.map((file) => ({ ...file }))
  },

  async downloadFlashRecording({ fileId, format = 'wav', deleteAfterSuccess = false } = {}) {
    if (useNativeMode()) {
      return nativeCall('downloadFlashRecording', [{ fileId, format, deleteAfterSuccess }])
    }
    ensureConnected()
    if (state.recording) {
      return reportError(makeError('record_active', '实时录音中，不能下载 Flash 文件', 'flash', true))
    }
    const file = mockFlashFiles.find((item) => item.fileId === fileId) || mockFlashFiles[0]
    if (!file) {
      return reportError(makeError('flash_file_missing', '没有可下载的 Flash 文件', 'flash', true, { fileId }))
    }
    if (deleteAfterSuccess && file.fileId !== mockFlashFiles[0].fileId) {
      return reportError(makeError('flash_delete_order_violation', '只能安全删除队首 Flash 文件', 'flash', false, { fileId }))
    }

    state.flashDownloading = true
    const sessionId = `mock-flash-${file.fileId}-${Date.now()}`
    pushDiagnostic('flash_download_start', {
      sessionId,
      fileId: file.fileId
    })

    for (let progress = 0; progress <= 100; progress += 25) {
      if (!state.flashDownloading) {
        return reportError(makeError('flash_download_interrupted', 'Flash 下载已中断', 'flash', true, { fileId: file.fileId }))
      }
      emit('recordingProgress', {
        sessionId,
        flash: true,
        progress,
        fileId: file.fileId
      })
      await sleep(120)
    }

    state.flashDownloading = false
    const durationMs = Math.max(1000, Math.floor(file.fileLength / 40) * FRAME_TIME_MS)
    const result = {
      filePath: `mock://recordings/flash-${file.fileId}.${format}`,
      format,
      durationMs,
      sampleRate: file.sampleRate,
      channels: file.channels,
      frameCount: Math.floor(durationMs / FRAME_TIME_MS),
      lostFrames: 0,
      outOfOrderFrames: 0,
      size: Math.floor(durationMs * file.sampleRate * file.channels * 2 / 1000) + 44,
      source: 'flash',
      fileId: file.fileId
    }
    if (deleteAfterSuccess && mockFlashFiles[0]?.fileId === file.fileId) {
      mockFlashFiles.shift()
    }
    pushDiagnostic('flash_download_completed', result)
    return result
  },

  async stopFlashDownload() {
    if (useNativeMode()) {
      return nativeCall('stopFlashDownload')
    }
    ensureInitialized()
    state.flashDownloading = false
    pushDiagnostic('flash_download_stop')
  },

  onDeviceFound(callback) {
    if (useNativeMode()) {
      return nativeSubscribe('onDeviceFound', callback)
    }
    return subscribe('deviceFound', callback)
  },

  onConnectionChanged(callback) {
    if (useNativeMode()) {
      return nativeSubscribe('onConnectionChanged', callback)
    }
    return subscribe('connectionChanged', callback)
  },

  onDpReport(callback) {
    if (useNativeMode()) {
      return nativeSubscribe('onDpReport', callback)
    }
    return subscribe('dpReport', callback)
  },

  onRecordingProgress(callback) {
    if (useNativeMode()) {
      return nativeSubscribe('onRecordingProgress', callback)
    }
    return subscribe('recordingProgress', callback)
  },

  onDecodeProgress(callback) {
    if (useNativeMode()) {
      return nativeSubscribe('onDecodeProgress', callback)
    }
    return subscribe('decodeProgress', callback)
  },

  onError(callback) {
    if (useNativeMode()) {
      return nativeSubscribe('onError', callback)
    }
    return subscribe('error', callback)
  },

  getDiagnostics() {
    if (useNativeMode()) {
      return nativeCallSync('getDiagnostics', [], {
        version: SDK_VERSION,
        mock: false,
        events: []
      })
    }
    return {
      version: SDK_VERSION,
      mock: state.mock,
      connected: Boolean(state.connectedDevice),
      events: state.diagnostics.slice()
    }
  },

  clearDiagnostics() {
    if (useNativeMode()) {
      return nativeCallSync('clearDiagnostics', [], undefined)
    }
    state.diagnostics = []
  }
}

export const init = OleapBle.init.bind(OleapBle)
export const requestPermissions = OleapBle.requestPermissions.bind(OleapBle)
export const getBluetoothState = OleapBle.getBluetoothState.bind(OleapBle)
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
export const onRecordingProgress = OleapBle.onRecordingProgress.bind(OleapBle)
export const onDecodeProgress = OleapBle.onDecodeProgress.bind(OleapBle)
export const onError = OleapBle.onError.bind(OleapBle)
export const getDiagnostics = OleapBle.getDiagnostics.bind(OleapBle)
export const clearDiagnostics = OleapBle.clearDiagnostics.bind(OleapBle)

export default OleapBle
