import { existsSync, readFileSync, statSync } from 'node:fs'
import { resolve } from 'node:path'

const root = resolve(new URL('..', import.meta.url).pathname)
const androidIndex = readFileSync(
  resolve(root, 'uni_modules/oleap-ble-sdk/utssdk/app-android/index.uts'),
  'utf8'
)
const androidBuildGradle = readFileSync(
  resolve(root, 'uni_modules/oleap-ble-sdk/utssdk/app-android/build.gradle'),
  'utf8'
)
const androidConfig = readFileSync(
  resolve(root, 'uni_modules/oleap-ble-sdk/utssdk/app-android/config.json'),
  'utf8'
)

function fail(message) {
  throw new Error(message)
}

function assert(condition, message) {
  if (!condition) {
    fail(message)
  }
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

function mustMatch(source, pattern, label) {
  if (!pattern.test(source)) {
    fail(`Missing ${label}: ${pattern}`)
  }
}

const reportPath = resolve(root, 'docs/phase-3-android-recording-acceptance-report.md')
if (!existsSync(reportPath)) {
  fail('Missing Phase 3 Android recording acceptance report')
}
const decoderAarPath = resolve(root, 'uni_modules/oleap-ble-sdk/utssdk/app-android/libs/oleap-release.aar')
if (!existsSync(decoderAarPath)) {
  fail('Missing Android decoder AAR')
}
if (statSync(decoderAarPath).size < 1024 * 1024) {
  fail('Android decoder AAR looks too small')
}

const requiredRecordingStrings = [
  '0.1.0-p4-flash',
  'RECORDING_COMMAND_STOP',
  'RECORDING_COMMAND_PERSONAL',
  'RECORDING_RESPONSE_START',
  'RECORDING_RESPONSE_STOP',
  'RECORDING_DECODER_FRAME_LEN',
  'DEFAULT_RECORDING_COMMAND_TIMEOUT_MS',
  'buildRecordingCommand',
  'recordingSceneCommandOf',
  'requestedRecordingFormatOf',
  'splitRecordingFrames',
  'parseRecordingResponse',
  'recordingBitrateOf',
  'recordingChannelsOf',
  'recordingFrameTimeMs',
  'createRecordingSession',
  'openRecordingSessionFiles',
  'appendBytesToOutputStream',
  'closeRecordingSessionStreams',
  'updateRecordingIndexStats',
  'handleRecordingStartResponse',
  'handleRecordingStopResponse',
  'handleRecordingFrames',
  'recording_start_enqueued',
  'recording_session_started',
  'recording_frames_received',
  'recording_session_stopped',
  'OpusDecoder',
  'decodeRecordingSession',
  'decodeRecordingFramesToWav',
  'decodeRecordingFramesToMp3',
  'recordingDecodedOutputPath',
  'ensureRecordingDecodeLayout',
  'wavHeaderBytes',
  'rewriteWavHeader',
  'decoder.decode',
  'decodeOpusToMp3',
  'recording_decode_completed',
  'opus_decode_failed',
  'opus_decode_empty_output',
  'opus_decode_corruption_threshold',
  'FileOutputStream',
  'FileInputStream',
  'RandomAccessFile',
  'oleap-recordings',
  'onRecordingProgress',
  'onDecodeProgress'
]

for (const text of requiredRecordingStrings) {
  mustContain(androidIndex, text, 'Android recording protocol implementation')
}

mustMatch(androidIndex, /handleRecordNotify[\s\S]+parseRecordingResponse[\s\S]+handleRecordingFrames/, 'record notify dispatches to recording parser')
mustMatch(androidIndex, /writeRecordBytes\(command,\s*false\)/, 'recording command writes use record channel')
mustContain(androidIndex, 'return rejectWith<any>(readyError)', 'recording API validates readiness')
mustContain(androidIndex, 'recordingCommandTimeoutId', 'recording command timeout state')
mustNotContain(androidIndex, 'recording_not_ready', 'recording_not_ready placeholder')
mustNotContain(androidIndex, 'opus_decode_unsupported', 'unsupported decoder placeholder')
mustContain(androidBuildGradle, "implementation files('libs/oleap-release.aar')", 'Android decoder AAR dependency')
mustContain(androidConfig, '"minSdkVersion": 24', 'Android decoder minSdk guard')

const fixtures = {
  startPersonal: readHexFixture('recording/start_personal.hex'),
  stopRecording: readHexFixture('recording/stop_recording.hex'),
  startResponse: readHexFixture('recording/start_response_success.hex'),
  stopResponse: readHexFixture('recording/stop_response_app.hex'),
  singleFrame: readHexFixture('recording/opus_notify_single_frame.hex'),
  twoFrames: readHexFixture('recording/opus_notify_two_frames.hex')
}

assertBytesEqual(buildRecordingCommand(0x0181, [0]), fixtures.startPersonal, 'start personal command mismatch')
assertBytesEqual(buildRecordingCommand(0x0081, [1]), fixtures.stopRecording, 'stop recording command mismatch')

const start = decodeRecordingResponse(fixtures.startResponse)
assert(start.kind === 'start', 'start fixture must decode as start response')
assert(start.startReason === 0, 'start fixture startReason must be success')
assert(start.recordChannel === 1, 'start fixture recordChannel must be 1')
assert(start.packetLength === 80, 'start fixture packetLength must be 80')

const stop = decodeRecordingResponse(fixtures.stopResponse)
assert(stop.kind === 'stop', 'stop fixture must decode as stop response')
assert(stop.stopReason === 1, 'stop fixture stopReason must be app stop')
assert(stop.stopReasonScene === 1, 'stop fixture scene must be personal')

const single = splitFrames(fixtures.singleFrame)
assert(single.frames.length === 1, 'single OPUS notify must contain one frame')
assert(single.badFrames === 0, 'single OPUS notify must not report bad frames')
assert(single.frames[0].frameLen === 4, 'single frame length mismatch')
assert(single.frames[0].dataIndex === 1, 'single frame index mismatch')
assert(single.frames[0].bitrate === 32000, 'single frame bitrate mismatch')
assert(single.frames[0].channels === 1, 'single frame channels mismatch')
assertBytesEqual(single.frames[0].payload, [0xf8, 0xff, 0xfe, 0xfd], 'single frame payload mismatch')

const multiple = splitFrames(fixtures.twoFrames)
assert(multiple.frames.length === 2, 'multi OPUS notify must contain two frames')
assert(multiple.badFrames === 0, 'multi OPUS notify must not report bad frames')
assert(multiple.frames[0].dataIndex === 1, 'multi frame first index mismatch')
assert(multiple.frames[1].dataIndex === 2, 'multi frame second index mismatch')
assertBytesEqual(multiple.frames[1].payload, [0xf7, 0xff, 0xfe, 0xfc], 'multi frame payload mismatch')

const wavHeader = buildWavHeader(1280, 16000, 1, 16)
assertBytesEqual(wavHeader.slice(0, 4), [0x52, 0x49, 0x46, 0x46], 'wav RIFF header mismatch')
assertBytesEqual(wavHeader.slice(8, 12), [0x57, 0x41, 0x56, 0x45], 'wav WAVE header mismatch')
assert(readUint32Le(wavHeader, 4) === 1316, 'wav RIFF size must be little-endian')
assert(readUint32Le(wavHeader, 24) === 16000, 'wav sample rate mismatch')
assert(readUint32Le(wavHeader, 40) === 1280, 'wav PCM data size must be little-endian')

console.log('P3 Android recording/decode check passed')

function readHexFixture(relativePath) {
  const fullPath = resolve(root, 'uni_modules/oleap-ble-sdk/test-fixtures', relativePath)
  const text = readFileSync(fullPath, 'utf8')
  return text
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => Number.parseInt(part, 16))
}

function assertBytesEqual(actual, expected, message) {
  assert(actual.length === expected.length, `${message}: length ${actual.length} !== ${expected.length}`)
  for (let index = 0; index < expected.length; index++) {
    assert(actual[index] === expected[index], `${message}: byte ${index} ${actual[index]} !== ${expected[index]}`)
  }
}

function readUint16Le(bytes, offset) {
  return bytes[offset] | (bytes[offset + 1] << 8)
}

function readUint16Be(bytes, offset) {
  return (bytes[offset] << 8) | bytes[offset + 1]
}

function readUint32Le(bytes, offset) {
  return (
    bytes[offset] +
    bytes[offset + 1] * 256 +
    bytes[offset + 2] * 65536 +
    bytes[offset + 3] * 16777216
  ) >>> 0
}

function buildRecordingCommand(command, payload) {
  return [
    (command >> 8) & 0xff,
    command & 0xff,
    payload.length & 0xff,
    (payload.length >> 8) & 0xff,
    ...payload.map((byte) => byte & 0xff)
  ]
}

function decodeRecordingResponse(bytes) {
  const command = readUint16Be(bytes, 0)
  const declaredLength = readUint16Le(bytes, 2)
  assert(bytes.length >= 4 + declaredLength, 'recording response length mismatch')
  if (command === 0x1280) {
    assert(declaredLength >= 4, 'start response too short')
    return {
      kind: 'start',
      startReason: bytes[4],
      recordChannel: bytes[5],
      packetLength: readUint16Le(bytes, 6)
    }
  }
  if (command === 0x0080) {
    assert(declaredLength >= 2, 'stop response too short')
    return {
      kind: 'stop',
      stopReason: bytes[4],
      stopReasonScene: bytes[5]
    }
  }
  return { kind: 'frames' }
}

function bitrateOf(config) {
  const key = (config >> 4) & 0x0f
  if (key === 1) return 24000
  if (key === 2) return 16000
  return 32000
}

function channelsOf(config) {
  const channels = config & 0x0f
  return channels === 0 ? 1 : channels
}

function splitFrames(bytes) {
  const frames = []
  let offset = 0
  let badFrames = 0
  while (offset < bytes.length) {
    if (bytes.length - offset < 4) {
      badFrames += 1
      break
    }
    const frameLen = bytes[offset]
    if (frameLen <= 0) {
      badFrames += 1
      break
    }
    const end = offset + 4 + frameLen
    if (end > bytes.length) {
      badFrames += 1
      break
    }
    const opusConfig = bytes[offset + 1]
    const bitrate = bitrateOf(opusConfig)
    frames.push({
      frameLen,
      opusConfig,
      dataIndex: readUint16Le(bytes, offset + 2),
      bitrate,
      channels: channelsOf(opusConfig),
      frameTimeMs: Math.max(1, Math.floor(frameLen * 8000 / bitrate)),
      payload: bytes.slice(offset + 4, end)
    })
    offset = end
  }
  return { frames, badFrames }
}

function writeAscii(bytes, offset, text) {
  for (let index = 0; index < text.length; index++) {
    bytes[offset + index] = text.charCodeAt(index) & 0xff
  }
}

function writeUint16Le(bytes, offset, value) {
  bytes[offset] = value & 0xff
  bytes[offset + 1] = (value >> 8) & 0xff
}

function writeUint32Le(bytes, offset, value) {
  bytes[offset] = value & 0xff
  bytes[offset + 1] = Math.floor(value / 256) & 0xff
  bytes[offset + 2] = Math.floor(value / 65536) & 0xff
  bytes[offset + 3] = Math.floor(value / 16777216) & 0xff
}

function buildWavHeader(pcmSize, sampleRate, channels, bitsPerSample) {
  const header = new Array(44).fill(0)
  const byteRate = sampleRate * channels * Math.floor(bitsPerSample / 8)
  const blockAlign = channels * Math.floor(bitsPerSample / 8)
  writeAscii(header, 0, 'RIFF')
  writeUint32Le(header, 4, 36 + pcmSize)
  writeAscii(header, 8, 'WAVE')
  writeAscii(header, 12, 'fmt ')
  writeUint32Le(header, 16, 16)
  writeUint16Le(header, 20, 1)
  writeUint16Le(header, 22, channels)
  writeUint32Le(header, 24, sampleRate)
  writeUint32Le(header, 28, byteRate)
  writeUint16Le(header, 32, blockAlign)
  writeUint16Le(header, 34, bitsPerSample)
  writeAscii(header, 36, 'data')
  writeUint32Le(header, 40, pcmSize)
  return header
}
