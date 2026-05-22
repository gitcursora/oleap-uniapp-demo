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

const sdk = read('uni_modules/oleap-ble-sdk/index.js')
const runtime = read('utils/demo-runtime.js')
const indexPage = read('pages/index/index.vue')
const recordPage = read('pages/record/record.vue')
const devicePage = read('pages/device/device.vue')
const flashPage = read('pages/flash/flash.vue')
read('docs/phase-3-demo-acceptance-report.md')

for (const text of [
  'loadNativeAdapter',
  "import('./utssdk/app-android/index.uts')",
  "import('./utssdk/app-ios/index.uts')",
  'nativeCall',
  'nativeSubscribe',
  'nativeCallSync',
  'useNativeMode',
  'native_adapter_load_failed',
  'native_adapter_not_initialized'
]) {
  mustContain(sdk, text, 'SDK native facade bridge')
}

for (const text of [
  'DEMO_MOCK_STORAGE_KEY',
  'getDemoMockMode',
  'setDemoMockMode',
  'formatSdkError'
]) {
  mustContain(runtime, text, 'demo runtime helper')
}

for (const [file, source] of [
  ['pages/index/index.vue', indexPage],
  ['pages/device/device.vue', devicePage],
  ['pages/record/record.vue', recordPage],
  ['pages/flash/flash.vue', flashPage]
]) {
  mustContain(source, 'getDemoMockMode', `${file} uses shared runtime mode`)
  mustContain(source, 'formatSdkError', `${file} formats SDK errors`)
}

for (const text of [
  'setRuntimeMode(true)',
  'setRuntimeMode(false)',
  'setDemoMockMode',
  'initializeSdk',
  'installSubscriptions',
  'disposeSubscriptions'
]) {
  mustContain(indexPage, text, 'home runtime mode controls')
}

for (const text of [
  'sceneOptions',
  'formatOptions',
  "OleapBle.startRecording({ scene: this.scene })",
  "OleapBle.stopRecording({ format: this.format })",
  'decodePercent',
  'badFrames',
  'lostFrames',
  'outOfOrderFrames',
  'copyPath',
  'goTranscript',
  'onDecodeProgress',
  'onError',
  'shouldClearActiveAfterStopError'
]) {
  mustContain(recordPage, text, 'recording demo workflow')
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
