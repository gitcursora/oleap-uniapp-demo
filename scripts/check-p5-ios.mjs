import { existsSync, readFileSync, statSync } from 'node:fs'
import { resolve } from 'node:path'

const root = resolve(new URL('..', import.meta.url).pathname)
const iosIndex = read('uni_modules/oleap-ble-sdk/utssdk/app-ios/index.uts')
const iosConfig = read('uni_modules/oleap-ble-sdk/utssdk/app-ios/config.json')
const iosPlist = read('uni_modules/oleap-ble-sdk/utssdk/app-ios/info.plist')
read('docs/phase-5-ios-host-acceptance-report.md')
read('docs/phase-5-ios-recording-acceptance-report.md')
const opusFrameworkBinary = 'uni_modules/oleap-ble-sdk/utssdk/app-ios/Frameworks/OpusDecoder.framework/OpusDecoder'
const opusFrameworkHeader = read('uni_modules/oleap-ble-sdk/utssdk/app-ios/Frameworks/OpusDecoder.framework/Headers/OpusFileDecoder.h')

function fail(message) {
  throw new Error(message)
}

function assert(condition, message) {
  if (!condition) {
    fail(message)
  }
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

function mustMatch(source, pattern, label) {
  if (!pattern.test(source)) {
    fail(`Missing ${label}: ${pattern}`)
  }
}

for (const text of [
  "import { CBCentralManager",
  'CBCentralManagerDelegate',
  'CBPeripheralDelegate',
  'CBCharacteristicWriteType',
  'CoreBluetooth',
  'OpusDecoder',
  '0.1.0-p5-ios-decoder',
  'COMMUNICATION_SERVICE_UUID',
  'COMMUNICATION_NOTIFY_UUID',
  'COMMUNICATION_WRITE_UUID',
  'RECORD_SERVICE_UUID',
  'RECORD_NOTIFY_UUID',
  'RECORD_WRITE_UUID',
  'scanForPeripherals',
  'connect(peripheral',
  'cancelPeripheralConnection',
  'discoverServices',
  'discoverCharacteristics',
  'setNotifyValue(true',
  'writeValue',
  'centralManagerDidUpdateState',
  'didDiscover',
  'didConnect',
  'didDiscoverServices',
  'didDiscoverCharacteristicsFor',
  'didUpdateNotificationStateFor',
  'didUpdateValueFor',
  'finishConnectionIfReady',
  'channelReadySnapshot'
]) {
  mustContain(iosIndex, text, 'iOS BLE host implementation')
}

for (const text of [
  'CONTROL_SYNC_FIRST',
  'CONTROL_SYNC_SECOND',
  'CONTROL_MESSAGE_TYPE',
  'CONTROL_DESC_REQUEST',
  'CONTROL_DESC_ACK',
  'CONTROL_CMD_DP_QUERY',
  'CONTROL_CMD_DP_SEND',
  'CONTROL_CMD_DP_WRITE',
  'DP_ID_SHORTCUT_KEY',
  'controlCrc32',
  'encodeControlFrame',
  'decodeControlFrame',
  'encodeControlPayload',
  'decodeControlPayload',
  'encodeDataPoint',
  'decodeDataPoint',
  'decodeShortcutKeyValue',
  'queryDp',
  'writeDp',
  'enqueueControlTransaction',
  'processNextControlTransaction',
  'handleControlIncomingFrame',
  'handleControlDpSend',
  'handleControlDpWrite',
  'ackControlReport',
  'control_device_report_ack_sent',
  'control_transaction_enqueued',
  'control_response_matched',
  'control_timeout',
  'control_write_rejected',
  'shortcut_key_report',
  'onDpReport',
  'onShortcutKey'
]) {
  mustContain(iosIndex, text, 'iOS control protocol implementation')
}

for (const text of [
  'return queryDp(DP_ID_BATTERY)',
  'return queryDp(DP_ID_SN)',
  'return queryDp(DP_ID_EQ_MODE)',
  'return writeDp(DP_ID_EQ_MODE',
  'return writeDp(DP_ID_APP_TIME'
]) {
  mustContain(iosIndex, text, 'iOS control public API wiring')
}
mustNotContain(iosIndex, 'shortcutCode', 'unconfirmed shortcut key semantic field')
mustNotContain(iosIndex, 'pressType', 'unconfirmed shortcut key semantic field')

for (const text of [
  'ios_flash_not_ready',
  'opus_decode_failed',
  'opus_decode_empty_output',
  'opus_decoder_channels_unsupported',
  'opus_decoder_frame_layout_unsupported'
]) {
  mustContain(iosIndex, text, 'explicit iOS P5 boundary')
}

for (const text of [
  'RECORDING_COMMAND_STOP',
  'RECORDING_COMMAND_PERSONAL',
  'RECORDING_RESPONSE_START',
  'RECORDING_RESPONSE_STOP',
  'RECORDING_FRAME_HEADER_LENGTH',
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
  'appendBytesToFileHandle',
  'closeRecordingSessionStreams',
  'updateRecordingIndexStats',
  'handleRecordingStartResponse',
  'handleRecordingStopResponse',
  'handleRecordingFrames',
  'recording_start_enqueued',
  'recording_session_started',
  'recording_frames_received',
  'recording_session_stopped',
  'decodeRecordingSession',
  'decodeRecordingFramesToWav',
  'decodeRecordingFramesToMp3',
  'decodeResultStats',
  'recordingDecodedOutputPath',
  'ensureRecordingDecodeLayout',
  'recording_decode_completed',
  'opus2wav',
  'opus2mp3',
  'onRecordingProgress',
  'onDecodeProgress',
  'oleap-recordings',
  'opusRawPath',
  'framesPath'
]) {
  mustContain(iosIndex, text, 'iOS recording protocol implementation')
}

mustNotContain(iosIndex, 'unsupportedPlatformError', 'unsupported platform stub import')
mustNotContain(iosIndex, 'unsupportedPromise', 'unsupported platform stub implementation')
mustNotContain(iosIndex, 'record_notify_ignored_ios_p5', 'old iOS record notify ignore boundary')
mustNotContain(iosIndex, 'ios_recording_not_ready', 'old iOS recording not-ready placeholder')
mustNotContain(iosIndex, 'ios_audio_decode_not_ready', 'old iOS decoder not-ready placeholder')
mustNotContain(iosIndex, 'ios_decoder_not_ready', 'old iOS decode progress placeholder')
mustNotContain(iosIndex, 'toArrayBuffer', 'JS-style Data bridge in iOS native implementation')
mustContain(iosConfig, 'realtime recording WAV/MP3 decoder slice', 'iOS config status note')
mustContain(iosPlist, 'NSBluetoothAlwaysUsageDescription', 'iOS Bluetooth always usage description')
mustContain(iosPlist, 'NSBluetoothPeripheralUsageDescription', 'iOS Bluetooth peripheral usage description')
mustContain(opusFrameworkHeader, 'int opus2wav', 'iOS OpusDecoder wav entrypoint')
mustContain(opusFrameworkHeader, 'int opus2mp3', 'iOS OpusDecoder mp3 entrypoint')
assert(existsSync(resolve(root, opusFrameworkBinary)), 'Missing iOS OpusDecoder framework binary')
assert(statSync(resolve(root, opusFrameworkBinary)).size > 512 * 1024, 'iOS OpusDecoder framework binary looks too small')

mustMatch(iosIndex, /peripheral[\s\S]+didUpdateValueFor[\s\S]+handleControlIncomingFrame/, 'iOS communication notify dispatches to control parser')
mustMatch(iosIndex, /peripheral[\s\S]+didUpdateValueFor[\s\S]+handleRecordNotify/, 'iOS record notify dispatches to recording parser')
mustMatch(iosIndex, /centralManager[\s\S]+didConnect[\s\S]+discoverServices/, 'iOS didConnect discovers services')
mustMatch(iosIndex, /didDiscoverCharacteristicsFor[\s\S]+setNotifyValue\(true[\s\S]+finishConnectionIfReady/, 'iOS characteristic discovery enables notify and checks readiness')
mustMatch(iosIndex, /didUpdateNotificationStateFor[\s\S]+notifyReadyCount[\s\S]+finishConnectionIfReady/, 'iOS notify state completes pending connection')
mustMatch(iosIndex, /connect\(options[\s\S]+centralManager\?\.connect\(peripheral/, 'iOS exported connect starts central connection')
mustMatch(iosIndex, /startRecording\(options[\s\S]+buildRecordingCommand\(Number\(scene.command\), \[0\][\s\S]+writeRecordBytes\(command,\s*false\)/, 'iOS startRecording writes start command to record channel')
mustMatch(iosIndex, /stopRecording\(options[\s\S]+buildRecordingCommand\(RECORDING_COMMAND_STOP, \[1\][\s\S]+writeRecordBytes\(command,\s*false\)/, 'iOS stopRecording writes stop command to record channel')
mustMatch(iosIndex, /handleRecordingStopResponse[\s\S]+closeRecordingSessionStreams[\s\S]+decodeRecordingSession/, 'iOS stop response closes frames and decodes output')
mustMatch(iosIndex, /decodeRecordingFramesToWav[\s\S]+opus2wav\(session\.framesPath, outputPath\)/, 'iOS WAV decode uses OpusDecoder framework')
mustMatch(iosIndex, /decodeRecordingFramesToMp3[\s\S]+opus2mp3\(session\.framesPath, outputPath\)/, 'iOS MP3 decode uses OpusDecoder framework')
mustMatch(iosIndex, /ensureRecordingDecodeLayout[\s\S]+session\.frameLen\) != RECORDING_DECODER_FRAME_LEN[\s\S]+opus_decoder_frame_layout_unsupported/, 'iOS decoder validates 4B+80B frame layout')

const crcTable = buildCrcTable()

const fixtures = {
  queryBattery: readHexFixture('control/query_battery.hex'),
  writeEq: readHexFixture('control/write_eq_high_bass.hex'),
  reportBattery: readHexFixture('control/report_battery.hex'),
  reportShortcutKey: readHexFixture('control/report_shortcut_key.hex'),
  startPersonal: readHexFixture('recording/start_personal.hex'),
  stopRecording: readHexFixture('recording/stop_recording.hex'),
  startResponse: readHexFixture('recording/start_response_success.hex'),
  stopResponse: readHexFixture('recording/stop_response_app.hex'),
  singleFrame: readHexFixture('recording/opus_notify_single_frame.hex'),
  twoFrames: readHexFixture('recording/opus_notify_two_frames.hex')
}

const query = decodeFrame(fixtures.queryBattery)
assert(query.payload.sendSn === 1, 'query battery fixture must start at SendSN 1')
assert(query.payload.command === 0x10, 'query battery fixture must be dp query')
assert(query.payload.commandPayload[0] === 0x03, 'query battery fixture must target DP 0x03')

const write = decodeFrame(fixtures.writeEq)
assert(write.payload.command === 0x12, 'write EQ fixture must be dp write')
const writeDp = decodeDp(write.payload.commandPayload.slice(4))
assert(writeDp.id === 0x81, 'write EQ fixture must target DP 0x81')
assert(writeDp.type === 0x00, 'write EQ fixture must use raw type')
assert(writeDp.raw.length === 1 && writeDp.raw[0] === 0x03, 'write EQ fixture value must be 0x03')

const report = decodeFrame(fixtures.reportBattery)
assert(report.payload.command === 0x11, 'battery report fixture must be dp send')
assert(report.payload.askSn === 0, 'battery report fixture must be active report')
const reportDp = decodeDp(report.payload.commandPayload.slice(4))
assert(reportDp.id === 0x03, 'battery report fixture must target DP 0x03')
assert(reportDp.type === 0x02, 'battery report fixture must use number type')

const shortcutReport = decodeFrame(fixtures.reportShortcutKey)
assert(shortcutReport.payload.command === 0x11, 'shortcut key report fixture must be dp send')
assert(shortcutReport.payload.askSn === 0, 'shortcut key report fixture must be active report')
const shortcutDp = decodeDp(shortcutReport.payload.commandPayload.slice(4))
assert(shortcutDp.id === 0x87, 'shortcut key report fixture must target DP 0x87')
assert(shortcutDp.type === 0x04, 'shortcut key report fixture must use enum type')
assert(shortcutDp.raw.length === 1 && shortcutDp.raw[0] === 0x01, 'shortcut key report fixture value must be 0x01')

assertBytesEqual(buildRecordingCommand(0x0181, [0]), fixtures.startPersonal, 'iOS start personal command mismatch')
assertBytesEqual(buildRecordingCommand(0x0081, [1]), fixtures.stopRecording, 'iOS stop recording command mismatch')

const start = decodeRecordingResponse(fixtures.startResponse)
assert(start.kind === 'start', 'iOS start fixture must decode as start response')
assert(start.startReason === 0, 'iOS start fixture startReason must be success')
assert(start.recordChannel === 1, 'iOS start fixture recordChannel must be 1')
assert(start.packetLength === 80, 'iOS start fixture packetLength must be 80')

const stop = decodeRecordingResponse(fixtures.stopResponse)
assert(stop.kind === 'stop', 'iOS stop fixture must decode as stop response')
assert(stop.stopReason === 1, 'iOS stop fixture stopReason must be app stop')
assert(stop.stopReasonScene === 1, 'iOS stop fixture scene must be personal')

const single = splitFrames(fixtures.singleFrame)
assert(single.frames.length === 1, 'iOS single OPUS notify must contain one frame')
assert(single.badFrames === 0, 'iOS single OPUS notify must not report bad frames')
assert(single.frames[0].frameLen === 4, 'iOS single frame length mismatch')
assert(single.frames[0].dataIndex === 1, 'iOS single frame index mismatch')
assert(single.frames[0].bitrate === 32000, 'iOS single frame bitrate mismatch')
assert(single.frames[0].channels === 1, 'iOS single frame channels mismatch')
assertBytesEqual(single.frames[0].payload, [0xf8, 0xff, 0xfe, 0xfd], 'iOS single frame payload mismatch')

const multiple = splitFrames(fixtures.twoFrames)
assert(multiple.frames.length === 2, 'iOS multi OPUS notify must contain two frames')
assert(multiple.badFrames === 0, 'iOS multi OPUS notify must not report bad frames')
assert(multiple.frames[0].dataIndex === 1, 'iOS multi frame first index mismatch')
assert(multiple.frames[1].dataIndex === 2, 'iOS multi frame second index mismatch')
assertBytesEqual(multiple.frames[1].payload, [0xf7, 0xff, 0xfe, 0xfc], 'iOS multi frame payload mismatch')

console.log('P5 iOS host/control/recording/decoder check passed')

function readHexFixture(relativePath) {
  return read(`uni_modules/oleap-ble-sdk/test-fixtures/${relativePath}`)
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => Number.parseInt(part, 16))
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

function buildCrcTable() {
  const table = []
  for (let index = 0; index < 256; index++) {
    let crc = index
    for (let bit = 0; bit < 8; bit++) {
      crc = (crc & 1) !== 0 ? ((crc >>> 1) ^ 0xedb88320) : (crc >>> 1)
    }
    table.push(crc >>> 0)
  }
  return table
}

function crc32(bytes) {
  let crc = 0xffffffff
  for (const byte of bytes) {
    crc = ((crc >>> 8) ^ crcTable[(crc ^ byte) & 0xff]) >>> 0
  }
  return (crc ^ 0xffffffff) >>> 0
}

function decodeFrame(bytes) {
  assert(bytes[0] === 0x99 && bytes[1] === 0xec, 'control frame sync mismatch')
  const desc = readUint16Le(bytes, 2)
  assert(bytes[4] === 0xb2, 'control frame message type mismatch')
  const payloadLength = readUint16Le(bytes, 5)
  const hasCrc = (desc & 0x0008) !== 0
  const expectedLength = 7 + payloadLength + (hasCrc ? 4 : 0)
  assert(bytes.length === expectedLength, 'control frame length mismatch')
  const payload = bytes.slice(7, 7 + payloadLength)
  if (hasCrc) {
    const expectedCrc = readUint32Le(bytes, 7 + payloadLength)
    assert(crc32(payload) === expectedCrc, 'control frame CRC mismatch')
  }
  return {
    desc,
    payload: {
      sendSn: readUint32Le(payload, 0),
      askSn: readUint32Le(payload, 4),
      command: payload[8],
      commandPayload: payload.slice(9)
    }
  }
}

function decodeDp(bytes) {
  assert(bytes.length >= 4, 'DP data too short')
  const length = readUint16Le(bytes, 2)
  assert(bytes.length - 4 >= length, 'DP value length mismatch')
  return {
    id: bytes[0],
    type: bytes[1],
    raw: bytes.slice(4, 4 + length)
  }
}

function assertBytesEqual(actual, expected, message) {
  assert(actual.length === expected.length, `${message}: length ${actual.length} !== ${expected.length}`)
  for (let index = 0; index < expected.length; index++) {
    assert(actual[index] === expected[index], `${message}: byte ${index} ${actual[index]} !== ${expected[index]}`)
  }
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
  assert(bytes.length >= 4 + declaredLength, 'iOS recording response length mismatch')
  if (command === 0x1280) {
    assert(declaredLength >= 4, 'iOS start response too short')
    return {
      kind: 'start',
      startReason: bytes[4],
      recordChannel: bytes[5],
      packetLength: readUint16Le(bytes, 6)
    }
  }
  if (command === 0x0080) {
    assert(declaredLength >= 2, 'iOS stop response too short')
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
    frames.push({
      frameLen,
      opusConfig,
      dataIndex: readUint16Le(bytes, offset + 2),
      bitrate: bitrateOf(opusConfig),
      channels: channelsOf(opusConfig),
      payload: bytes.slice(offset + 4, end),
      rawFrame: bytes.slice(offset, end)
    })
    offset = end
  }
  return { frames, badFrames }
}
