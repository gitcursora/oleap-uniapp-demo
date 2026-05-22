import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

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
  'uni_modules/oleap-ble-sdk/test-fixtures/recording/start_meeting.hex',
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
}

const sdk = await import(pathToFileURL(resolve(root, 'uni_modules/oleap-ble-sdk/index.js')).href)
const { OleapBle } = sdk

await OleapBle.init({ mock: true, logLevel: 'debug' })
await OleapBle.requestPermissions()
const bluetooth = await OleapBle.getBluetoothState()
if (!bluetooth.enabled) {
  fail('Mock bluetooth state should be enabled')
}

const found = []
const offFound = OleapBle.onDeviceFound((device) => found.push(device))
await OleapBle.startScan({ timeoutMs: 500 })
await new Promise((resolvePromise) => setTimeout(resolvePromise, 650))
offFound()
if (found.length === 0) {
  fail('Mock scan did not emit devices')
}

await OleapBle.connect({ deviceId: found[0].deviceId })
const battery = await OleapBle.getBattery()
if (battery <= 0) {
  fail('Mock battery should be positive')
}

const progress = []
const offProgress = OleapBle.onRecordingProgress((event) => progress.push(event))
await OleapBle.startRecording({ scene: 'meeting' })
await new Promise((resolvePromise) => setTimeout(resolvePromise, 450))
const recordResult = await OleapBle.stopRecording({ format: 'wav' })
offProgress()
if (!recordResult.filePath.endsWith('.wav')) {
  fail('Mock recording should return wav file path')
}
if (progress.length === 0) {
  fail('Mock recording did not emit progress')
}

const flashFiles = await OleapBle.listFlashRecordings()
if (flashFiles.length === 0) {
  fail('Mock flash list should not be empty')
}
const flashResult = await OleapBle.downloadFlashRecording({ fileId: flashFiles[0].fileId, format: 'wav' })
if (!flashResult.filePath.endsWith('.wav')) {
  fail('Mock flash download should return wav file path')
}

const diagnostics = OleapBle.getDiagnostics()
if (!diagnostics.events.length) {
  fail('Diagnostics should contain events')
}

await OleapBle.disconnect()

console.log('Phase 0 check passed')
