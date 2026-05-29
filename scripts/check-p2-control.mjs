import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const root = resolve(new URL('..', import.meta.url).pathname)
const androidIndex = readFileSync(
  resolve(root, 'uni_modules/oleap-ble-sdk/utssdk/app-android/index.uts'),
  'utf8'
)

function fail(message) {
  throw new Error(message)
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

const reportPath = resolve(root, 'docs/phase-2-android-control-acceptance-report.md')
if (!existsSync(reportPath)) {
  fail('Missing Phase 2 Android control acceptance report')
}

const crcTable = buildCrcTable()

const requiredControlStrings = [
  'SDK_VERSION',
  'CONTROL_SYNC_FIRST',
  'CONTROL_SYNC_SECOND',
  'CONTROL_MESSAGE_TYPE',
  'CONTROL_DESC_REQUEST',
  'CONTROL_DESC_ACK',
  'CONTROL_DESC_CRC_MASK',
  'CONTROL_CMD_DP_QUERY',
  'CONTROL_CMD_DP_SEND',
  'CONTROL_CMD_DP_WRITE',
  'DP_ID_BATTERY',
  'DP_ID_SN',
  'DP_ID_EQ_MODE',
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
]

for (const text of requiredControlStrings) {
  mustContain(androidIndex, text, 'Android control protocol implementation')
}

mustContain(androidIndex, 'return queryDp(DP_ID_BATTERY)', 'getBattery control query')
mustContain(androidIndex, 'return queryDp(DP_ID_SN)', 'getSn control query')
mustContain(androidIndex, 'return queryDp(DP_ID_EQ_MODE)', 'getEqMode control query')
mustContain(androidIndex, 'return writeDp(DP_ID_EQ_MODE', 'setEqMode control write')
mustContain(androidIndex, 'return writeDp(DP_ID_APP_TIME', 'syncAppTime control write')
mustMatch(androidIndex, /handleCommunicationNotify[\s\S]+handleControlIncomingFrame/, 'communication notify dispatches to control parser')
mustNotContain(androidIndex, 'control_not_ready', 'control_not_ready placeholder')
mustNotContain(androidIndex, 'shortcutCode', 'unconfirmed shortcut key semantic field')
mustNotContain(androidIndex, 'pressType', 'unconfirmed shortcut key semantic field')

const fixtures = {
  queryBattery: readHexFixture('control/query_battery.hex'),
  writeEq: readHexFixture('control/write_eq_high_bass.hex'),
  reportBattery: readHexFixture('control/report_battery.hex'),
  reportShortcutKey: readHexFixture('control/report_shortcut_key.hex')
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

console.log('P2 Android control check passed')

function readHexFixture(relativePath) {
  const fullPath = resolve(root, 'uni_modules/oleap-ble-sdk/test-fixtures', relativePath)
  const text = readFileSync(fullPath, 'utf8')
  return text
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => Number.parseInt(part, 16))
}

function assert(condition, message) {
  if (!condition) {
    fail(message)
  }
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
  for (let i = 0; i < 256; i++) {
    let crc = i
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
