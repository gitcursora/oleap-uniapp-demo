import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const root = resolve(new URL('..', import.meta.url).pathname)

const requiredFiles = [
  'App.vue',
  'main.js',
  'manifest.json',
  'pages.json',
  'README.md',
  'docs/oleap-uniapp-sdk-api.md',
  'docs/oleap-uniapp-sdk-test-plan.md',
  'docs/phase-0-acceptance-report.md',
  'utils/oleap-page-runtime.js',
  'uni_modules/oleap-ble-sdk/package.json',
  'uni_modules/oleap-ble-sdk/index.js',
  'uni_modules/oleap-ble-sdk/utssdk/interface.uts',
  'uni_modules/oleap-ble-sdk/utssdk/unierror.uts',
  'uni_modules/oleap-ble-sdk/utssdk/app-android/index.uts',
  'uni_modules/oleap-ble-sdk/utssdk/app-android/AndroidManifest.xml',
  'uni_modules/oleap-ble-sdk/utssdk/app-ios/index.uts',
  'uni_modules/oleap-ble-sdk/utssdk/app-ios/info.plist',
  'pages/index/index.vue',
  'pages/device/device.vue',
  'pages/record/record.vue',
  'pages/flash/flash.vue',
  'pages/transcript/transcript.vue'
]

const fixtureFiles = [
  'uni_modules/oleap-ble-sdk/test-fixtures/control/query_battery.hex',
  'uni_modules/oleap-ble-sdk/test-fixtures/control/write_eq_high_bass.hex',
  'uni_modules/oleap-ble-sdk/test-fixtures/control/report_battery.hex',
  'uni_modules/oleap-ble-sdk/test-fixtures/control/report_shortcut_key.hex',
  'uni_modules/oleap-ble-sdk/test-fixtures/recording/start_personal.hex',
  'uni_modules/oleap-ble-sdk/test-fixtures/recording/stop_recording.hex',
  'uni_modules/oleap-ble-sdk/test-fixtures/recording/start_response_success.hex',
  'uni_modules/oleap-ble-sdk/test-fixtures/recording/stop_response_app.hex',
  'uni_modules/oleap-ble-sdk/test-fixtures/recording/opus_notify_single_frame.hex',
  'uni_modules/oleap-ble-sdk/test-fixtures/recording/opus_notify_two_frames.hex',
  'uni_modules/oleap-ble-sdk/test-fixtures/flash/get_file_count.hex',
  'uni_modules/oleap-ble-sdk/test-fixtures/flash/file_info_response.hex',
  'uni_modules/oleap-ble-sdk/test-fixtures/flash/download_chunk_response.hex',
  'uni_modules/oleap-ble-sdk/test-fixtures/flash/delete_response_success.hex'
]

function fail(message) {
  throw new Error(message)
}

function assertFile(path) {
  const absolute = resolve(root, path)
  if (!existsSync(absolute)) {
    fail(`Missing required file: ${path}`)
  }
}

function read(path) {
  return readFileSync(resolve(root, path), 'utf8')
}

function mustContain(source, text, label) {
  if (!source.includes(text)) {
    fail(`Missing ${label}: ${text}`)
  }
}

function mustNotContain(source, text, label) {
  if (source.includes(text)) {
    fail(`Unexpected ${label}: ${text}`)
  }
}

function assertHexFixture(path) {
  const text = read(path).trim()
  if (!text) {
    fail(`Empty fixture: ${path}`)
  }
  if (!/^([0-9a-fA-F]{2})(\s+[0-9a-fA-F]{2})*$/.test(text)) {
    fail(`Invalid hex fixture format: ${path}`)
  }
}

for (const file of requiredFiles) {
  assertFile(file)
}

for (const file of fixtureFiles) {
  assertFile(file)
  assertHexFixture(file)
}

const pagesJson = JSON.parse(read('pages.json'))
for (const page of pagesJson.pages) {
  assertFile(`${page.path}.vue`)
}

const manifest = JSON.parse(read('manifest.json'))
const mainJs = read('main.js')
if (mainJs.includes('createSSRApp') && manifest.vueVersion !== '3') {
  fail('Vue3 entry requires manifest.json vueVersion to be "3"')
}

const sdk = read('uni_modules/oleap-ble-sdk/index.js')
for (const text of [
  "import * as appNativeAdapter from '@/uni_modules/oleap-ble-sdk'",
  'loadNativeAdapter',
  'nativeCall',
  'nativeSubscribe',
  'onShortcutKey',
  'ensureBlePermission',
  'native_adapter_missing',
  'native_adapter_not_initialized'
]) {
  mustContain(sdk, text, 'native-only SDK facade')
}

for (const text of [
  'mockDevices',
  'mockFlashFiles',
  'useNativeMode',
  'MOCK-SN',
  'mock://',
  'state.mock'
]) {
  mustNotContain(sdk, text, 'mock SDK branch')
}

const pageFiles = [
  'pages/index/index.vue',
  'pages/device/device.vue',
  'pages/record/record.vue',
  'pages/flash/flash.vue'
]
for (const file of pageFiles) {
  const text = read(file)
  if (!text.includes("from '@/uni_modules/oleap-ble-sdk/index.js'")) {
    fail(`Page does not import SDK facade: ${file}`)
  }
  if (!text.includes('onUnload()')) {
    fail(`Page does not clean subscriptions in onUnload: ${file}`)
  }
  mustNotContain(text, 'getDemoMockMode', `${file} mock runtime helper`)
  mustNotContain(text, 'setDemoMockMode', `${file} mock runtime setter`)
  mustNotContain(text, 'setRuntimeMode', `${file} runtime mode switch`)
}

const homePage = read('pages/index/index.vue')
for (const text of [
  'bootstrapKnownDevices',
  'OleapBle.listKnownDevices',
  'connectedDeviceId',
  'connectedDeviceName',
  'isConnectedDevice',
  'connected-card',
  'connected-device',
  'connected-text',
  'permissionGranted: false',
  'bluetoothReady',
  'refreshBluetoothState'
]) {
  mustContain(homePage, text, 'native home workflow')
}

const runtime = read('utils/demo-runtime.js')
mustContain(runtime, 'DEMO_LAST_DEVICE_ID_STORAGE_KEY', 'last device persistence')
mustNotContain(runtime, 'DEMO_MOCK_STORAGE_KEY', 'mock mode persistence')

const pageRuntime = read('utils/oleap-page-runtime.js')
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

console.log('Phase 0 native-only check passed')
