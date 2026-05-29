import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const root = resolve(new URL('..', import.meta.url).pathname)

function fail(message) {
  throw new Error(message)
}

function read(path) {
  const fullPath = resolve(root, path)
  if (!existsSync(fullPath)) {
    fail(`Missing required file: ${path}`)
  }
  return readFileSync(fullPath, 'utf8')
}

function mustContain(source, pattern, label) {
  if (!source.includes(pattern)) {
    fail(`Missing ${label}: ${pattern}`)
  }
}

function mustNotContain(source, pattern, label) {
  if (source.includes(pattern)) {
    fail(`Unexpected ${label}: ${pattern}`)
  }
}

const sdk = read('uni_modules/oleap-ble-sdk/index.js')
const runtime = read('utils/demo-runtime.js')
const pageRuntime = read('utils/oleap-page-runtime.js')
const indexPage = read('pages/index/index.vue')
const recordPage = read('pages/record/record.vue')
const devicePage = read('pages/device/device.vue')
const flashPage = read('pages/flash/flash.vue')
read('docs/phase-3-demo-acceptance-report.md')

for (const text of [
  'loadNativeAdapter',
  "import * as appNativeAdapter from '@/uni_modules/oleap-ble-sdk'",
  'getPreloadedNativeAdapter',
  'nativeCall',
  'nativeSubscribe',
  "typeof unsubscribe === 'function' ? unsubscribe : () => {}",
  'nativeCallSync',
  'ensureBlePermission',
  'native_adapter_load_failed',
  'native_adapter_not_initialized'
]) {
  mustContain(sdk, text, 'SDK native facade bridge')
}

for (const text of [
  'DEMO_LAST_DEVICE_ID_STORAGE_KEY',
  'getDemoLastDeviceId',
  'setDemoLastDeviceId',
  'formatSdkError'
]) {
  mustContain(runtime, text, 'demo runtime helper')
}

for (const text of [
  'mockDevices',
  'mockFlashFiles',
  'useNativeMode',
  'state.mock',
  'MOCK-SN',
  'mock://'
]) {
  mustNotContain(sdk, text, 'SDK mock branch')
}

mustNotContain(runtime, 'DEMO_MOCK_STORAGE_KEY', 'mock runtime storage')

for (const text of [
  'ensureOleapReady',
  'formatOleapError',
  'runOleapAction',
  'registerOleapDisposers',
  'disposeOleapDisposers',
  'refreshOleapDiagnostics',
  'copyOleapDiagnostics',
  'shortTime',
  'stringifyDetails'
]) {
  mustContain(pageRuntime, text, 'page runtime helper')
}

for (const [file, source] of [
  ['pages/index/index.vue', indexPage],
  ['pages/device/device.vue', devicePage],
  ['pages/record/record.vue', recordPage],
  ['pages/flash/flash.vue', flashPage]
]) {
  mustContain(source, 'runOleapAction', `${file} uses page runtime action wrapper`)
  mustContain(source, 'ensureOleapReady', `${file} uses page runtime SDK readiness`)
  mustContain(source, 'registerOleapDisposers', `${file} registers page runtime disposers`)
  mustContain(source, 'disposeOleapDisposers', `${file} disposes page runtime subscriptions`)
  mustNotContain(source, 'formatSdkError', `${file} local SDK error formatter`)
  mustNotContain(source, 'async safeRun(action)', `${file} local safeRun`)
  mustNotContain(source, "OleapBle.init({ logLevel: 'debug' })", `${file} local init`)
  mustNotContain(source, 'disposeSubscriptions()', `${file} local subscription disposer`)
  mustNotContain(source, 'getDemoMockMode', `${file} mock runtime getter`)
  mustNotContain(source, 'setDemoMockMode', `${file} mock runtime setter`)
}

for (const text of [
  'initializeSdk',
  'installSubscriptions',
  'bootstrapKnownDevices',
  'runAction',
  'OleapBle.listKnownDevices',
  'setDemoLastDeviceId',
  'getDemoLastDeviceId',
  'connectedDeviceId',
  'connectedDeviceName',
  'isConnectedDevice',
  'connected-card',
  'connected-device',
  'connected-text',
  'permissionGranted: false',
  'bluetoothReady',
  'refreshBluetoothState',
  "key: bluetoothOff ? 'refreshBluetooth' : 'permission'",
  "return this.bluetooth.permissionGranted === true ? '可用' : '待授权'",
  'const granted = result?.permissionGranted === true || result?.bluetooth === true',
  'this.bluetooth = await OleapBle.getBluetoothState().catch(() => this.bluetooth)'
]) {
  mustContain(indexPage, text, 'home native controls')
}

for (const text of [
  'sceneOptions',
  'formatOptions',
  'OleapBle.startRecording({',
  'scene: this.scene',
  'enableRealtimeStream: enableRealtimeStream',
  "OleapBle.stopRecording({ format: this.format })",
  'decodePercent',
  'badFrames',
  'lostFrames',
  'outOfOrderFrames',
  'copyPath',
  'goTranscript',
  'onDecodeProgress',
  'onError',
  'formatOleapError',
  'shouldClearActiveAfterStopError',
  'refreshDiagnostics',
  'copyDiagnostics',
  'copyOleapDiagnostics',
  'recordChannelLabel',
  'recentDiagnostics',
  'refreshOleapDiagnostics'
]) {
  mustContain(recordPage, text, 'recording demo workflow')
}

for (const text of [
  'refreshDiagnostics',
  'copyDiagnostics',
  'copyOleapDiagnostics',
  'controlDiagnosticLabel',
  'recordingDiagnosticLabel',
  'recentDiagnostics',
  'channelLabel',
  'connectedDeviceId',
  'OleapBle.onDpReport',
  'OleapBle.onShortcutKey',
  'uni.showToast',
  'refreshOleapDiagnostics'
]) {
  mustContain(devicePage, text, 'device diagnostics workflow')
}

const runtimeModule = await import(pathToFileURL(resolve(root, 'utils/demo-runtime.js')).href)
const formatted = runtimeModule.formatSdkError({
  code: 'opus_decoder_frame_layout_unsupported',
  message: 'OPUS 帧布局暂不支持',
  details: {
    error: 'expected 84 bytes'
  }
})
if (!formatted.includes('[opus_decoder_frame_layout_unsupported]') || !formatted.includes('expected 84 bytes')) {
  fail('formatSdkError should include code and detail message')
}

console.log('P3 demo workflow check passed')
