import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const root = resolve(new URL('..', import.meta.url).pathname)
const androidIndex = read('uni_modules/oleap-ble-sdk/utssdk/app-android/index.uts')
const flashPage = read('pages/flash/flash.vue')
read('docs/phase-4-android-flash-acceptance-report.md')
const crcTable = Array.from({ length: 256 }, (_, index) => {
  let crc = index
  for (let bit = 0; bit < 8; bit++) {
    crc = (crc & 1) !== 0 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1
  }
  return crc >>> 0
})

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

for (const text of [
  '0.1.0-p4-flash',
  'FLASH_COMMAND_GET_FILE_COUNT',
  'FLASH_COMMAND_GET_FILE_INFO',
  'FLASH_COMMAND_DOWNLOAD',
  'FLASH_COMMAND_DELETE',
  'FLASH_COMMAND_STOP_UPLOAD',
  'FLASH_DOWNLOAD_FRAME_TIMEOUT_MS',
  'buildFlashCommand',
  'buildFlashGetFileCountCommand',
  'buildFlashGetFileInfoCommand',
  'buildFlashDownloadCommand',
  'buildFlashDeleteCommand',
  'parseFlashFileCountResponse',
  'parseFlashFileInfoResponse',
  'parseFlashDownloadResponse',
  'parseFlashDeleteResponse',
  'queryFlashFileCount',
  'queryFlashFileInfo',
  'handleFlashCommandResponse',
  'handleFlashDownloadResponse',
  'finalizeFlashDownloadSession',
  'flash_delete_order_violation',
  'flash_download_interrupted',
  'FLASH_READ_ERROR_VALUE',
  'FLASH_NO_FILE_VALUE',
  'deleteAfterSuccess',
  "source = 'flash'",
  "result.source = 'flash'",
  'decodeRecordingSession'
]) {
  mustContain(androidIndex, text, 'Android Flash protocol implementation')
}

mustNotContain(androidIndex, "notImplemented<any>('flash_not_ready'", 'Flash not-ready placeholder')
mustContain(androidIndex, 'const crcInput = byteSlice(frame, 2, 4 + payload.length)', 'Flash CRC starts at parameter length')
mustContain(androidIndex, 'const crcOffset = 4 + declaredLength', 'Flash response CRC offset is dynamic')
mustContain(androidIndex, 'returnLength < dataCapacity', 'Flash completion condition uses actual chunk capacity')
mustContain(androidIndex, 'returnLength == FLASH_READ_ERROR_VALUE', 'Flash read-error sentinel handling')
mustContain(androidIndex, 'returnLength == FLASH_NO_FILE_VALUE', 'Flash missing-file sentinel handling')
mustContain(androidIndex, 'countResponse.fileStartId != fileId', 'safe delete verifies head file')
mustNotContain(androidIndex, 'Number(countResponse.fileStartId)', 'Kotlin-unsafe Number constructor in safe delete')

for (const text of [
  'formatOptions',
  'deleteAfterSuccess',
  'OleapBle.downloadFlashRecording',
  'OleapBle.stopFlashDownload',
  'copyPath',
  'goTranscript',
  'event.flash'
]) {
  mustContain(flashPage, text, 'Flash demo page workflow')
}

const fixtures = {
  getFileCount: readHexFixture('get_file_count.hex'),
  fileInfo: readHexFixture('file_info_response.hex'),
  downloadChunk: readHexFixture('download_chunk_response.hex'),
  deleteResponse: readHexFixture('delete_response_success.hex')
}

assertBytesEqual(buildFlashGetFileCountCommand(), fixtures.getFileCount, 'get file count command mismatch')

const info = parseFlashFileInfoResponse(fixtures.fileInfo)
assert(info.isFileExist === true, 'file info fixture should exist')
assert(info.fileInfo.fileId === 1001, 'file info fixture fileId mismatch')
assert(info.fileInfo.fileLength === 38400, 'file info fixture length mismatch')
assert(info.fileInfo.recordType === 1, 'file info fixture record type mismatch')
assert(info.fileInfo.channels === 1, 'file info fixture channel mismatch')
assert(info.fileInfo.sampleRate === 16000, 'file info fixture sample rate mismatch')
assert(info.fileInfo.bitRate === 16000, 'file info fixture bit rate mismatch')

const download = parseFlashDownloadResponse(fixtures.downloadChunk)
assert(download.returnLength === 8, 'download fixture return length mismatch')
assert(download.startAddress === 0, 'download fixture start address mismatch')
assert(download.fileData.length === 8, 'download fixture payload length mismatch')
assert(download.completed === false, 'download fixture should not be complete')
const frames = splitFrames(download.fileData)
assert(frames.frames.length === 1, 'download fixture should contain one OPUS frame')
assert(frames.frames[0].dataIndex === 1, 'download fixture frame index mismatch')

const deleted = parseFlashDeleteResponse(fixtures.deleteResponse)
assert(deleted.status === 0, 'delete fixture status mismatch')
assert(deleted.fileId === 1002, 'delete fixture next file id mismatch')

const infoCommand = buildFlashGetFileInfoCommand(1001)
assert(readUint16Be(infoCommand, 0) === 0x0282, 'get info command code mismatch')
assert(readUint16Le(infoCommand, 2) === 4, 'get info command length mismatch')
assert(readUint32Le(infoCommand, 4) === 1001, 'get info command file id mismatch')
assert(infoCommand.length === 12, 'get info command must include CRC')
assert(readUint32Le(infoCommand, 8) === crc32(infoCommand.slice(2, 8)), 'get info command CRC mismatch')

const downloadCommand = buildFlashDownloadCommand(1001, 0, true)
assert(readUint16Be(downloadCommand, 0) === 0x0382, 'download command code mismatch')
assert(readUint16Le(downloadCommand, 2) === 12, 'download command length mismatch')
assert(readUint32Le(downloadCommand, 4) === 0, 'download command control mismatch')
assert(readUint32Le(downloadCommand, 8) === 1001, 'download command file id mismatch')
assert(readUint32Le(downloadCommand, 12) === 0, 'download command offset mismatch')
assert(readUint32Le(downloadCommand, 16) === crc32(downloadCommand.slice(2, 16)), 'download command CRC mismatch')

console.log('P4 Android Flash check passed')

function readHexFixture(name) {
  return read(`uni_modules/oleap-ble-sdk/test-fixtures/flash/${name}`)
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

function writeUint16Le(bytes, offset, value) {
  bytes[offset] = value & 0xff
  bytes[offset + 1] = (value >> 8) & 0xff
}

function writeUint32Le(bytes, offset, value) {
  const normalized = value >>> 0
  bytes[offset] = normalized & 0xff
  bytes[offset + 1] = (normalized >>> 8) & 0xff
  bytes[offset + 2] = (normalized >>> 16) & 0xff
  bytes[offset + 3] = (normalized >>> 24) & 0xff
}

function buildRecordingCommand(command, payload = []) {
  const frame = new Array(4 + payload.length).fill(0)
  frame[0] = (command >> 8) & 0xff
  frame[1] = command & 0xff
  writeUint16Le(frame, 2, payload.length)
  for (let index = 0; index < payload.length; index++) {
    frame[4 + index] = payload[index] & 0xff
  }
  return frame
}

function buildFlashCommand(command, payload, needCrc = true) {
  const frame = buildRecordingCommand(command, payload)
  if (!needCrc) return frame
  const crc = crc32(frame.slice(2, 4 + payload.length))
  frame.push(crc & 0xff, (crc >>> 8) & 0xff, (crc >>> 16) & 0xff, (crc >>> 24) & 0xff)
  return frame
}

function buildFlashGetFileCountCommand() {
  return buildFlashCommand(0x0182, [0], false)
}

function buildFlashGetFileInfoCommand(fileId) {
  const payload = [0, 0, 0, 0]
  writeUint32Le(payload, 0, fileId)
  return buildFlashCommand(0x0282, payload, true)
}

function buildFlashDownloadCommand(fileId, startAddress, continuous) {
  const payload = new Array(12).fill(0)
  writeUint32Le(payload, 0, continuous ? 0 : 1)
  writeUint32Le(payload, 4, fileId)
  writeUint32Le(payload, 8, startAddress)
  return buildFlashCommand(0x0382, payload, true)
}

function crc32(bytes) {
  let crc = 0xffffffff
  for (const byte of bytes) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ byte) & 0xff]
  }
  return (crc ^ 0xffffffff) >>> 0
}

function parseFlashFileInfoResponse(bytes) {
  const declaredLength = readUint16Le(bytes, 2)
  assert(declaredLength === 36, 'file info declared length mismatch')
  return {
    isFileExist: readUint32Le(bytes, 4) === 1,
    fileInfo: {
      fileVersion: readUint16Le(bytes, 8),
      blockNum: readUint16Le(bytes, 10),
      fileId: readUint32Le(bytes, 12),
      fileLength: readUint32Le(bytes, 16),
      recordType: bytes[34],
      channels: bytes[35],
      sampleRate: readUint16Le(bytes, 36),
      bitRate: readUint16Le(bytes, 38)
    }
  }
}

function parseFlashDownloadResponse(bytes) {
  const declaredLength = readUint16Le(bytes, 2)
  const dataCapacity = declaredLength - 8
  const returnLength = readUint32Le(bytes, 4)
  return {
    returnLength,
    startAddress: readUint32Le(bytes, 8),
    fileData: bytes.slice(12, 12 + dataCapacity),
    completed: returnLength < dataCapacity
  }
}

function parseFlashDeleteResponse(bytes) {
  assert(readUint16Le(bytes, 2) === 8, 'delete declared length mismatch')
  return {
    status: readUint32Le(bytes, 4),
    fileId: readUint32Le(bytes, 8)
  }
}

function splitFrames(bytes) {
  const frames = []
  let offset = 0
  while (offset < bytes.length) {
    const frameLen = bytes[offset]
    const end = offset + 4 + frameLen
    assert(frameLen > 0 && end <= bytes.length, 'invalid frame layout')
    frames.push({
      frameLen,
      dataIndex: readUint16Le(bytes, offset + 2),
      payload: bytes.slice(offset + 4, end)
    })
    offset = end
  }
  return { frames }
}
