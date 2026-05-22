import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const root = resolve(new URL('..', import.meta.url).pathname)
const iosIndex = read('uni_modules/oleap-ble-sdk/utssdk/app-ios/index.uts')
const iosConfig = read('uni_modules/oleap-ble-sdk/utssdk/app-ios/config.json')
const iosPlist = read('uni_modules/oleap-ble-sdk/utssdk/app-ios/info.plist')
read('docs/phase-5-ios-host-acceptance-report.md')

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
  '0.1.0-p5-ios-host',
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
  'controlCrc32',
  'encodeControlFrame',
  'decodeControlFrame',
  'encodeControlPayload',
  'decodeControlPayload',
  'encodeDataPoint',
  'decodeDataPoint',
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
  'onDpReport'
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

for (const text of [
  'ios_recording_not_ready',
  'ios_flash_not_ready',
  'record_notify_ignored_ios_p5'
]) {
  mustContain(iosIndex, text, 'explicit iOS P5 unsupported boundary')
}

mustNotContain(iosIndex, 'unsupportedPlatformError', 'unsupported platform stub import')
mustNotContain(iosIndex, 'unsupportedPromise', 'unsupported platform stub implementation')
mustNotContain(iosIndex, 'toArrayBuffer', 'JS-style Data bridge in iOS native implementation')
mustContain(iosConfig, 'P5 iOS host/control slice', 'iOS config status note')
mustContain(iosPlist, 'NSBluetoothAlwaysUsageDescription', 'iOS Bluetooth always usage description')
mustContain(iosPlist, 'NSBluetoothPeripheralUsageDescription', 'iOS Bluetooth peripheral usage description')

mustMatch(iosIndex, /peripheral[\s\S]+didUpdateValueFor[\s\S]+handleControlIncomingFrame/, 'iOS communication notify dispatches to control parser')
mustMatch(iosIndex, /centralManager[\s\S]+didConnect[\s\S]+discoverServices/, 'iOS didConnect discovers services')
mustMatch(iosIndex, /didDiscoverCharacteristicsFor[\s\S]+setNotifyValue\(true[\s\S]+finishConnectionIfReady/, 'iOS characteristic discovery enables notify and checks readiness')
mustMatch(iosIndex, /didUpdateNotificationStateFor[\s\S]+notifyReadyCount[\s\S]+finishConnectionIfReady/, 'iOS notify state completes pending connection')
mustMatch(iosIndex, /connect\(options[\s\S]+centralManager\?\.connect\(peripheral/, 'iOS exported connect starts central connection')

const crcTable = buildCrcTable()

const fixtures = {
  queryBattery: readHexFixture('control/query_battery.hex'),
  writeEq: readHexFixture('control/write_eq_high_bass.hex'),
  reportBattery: readHexFixture('control/report_battery.hex')
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

console.log('P5 iOS host/control check passed')

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
