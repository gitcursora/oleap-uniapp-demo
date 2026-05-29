# Oleap UniApp BLE SDK API

状态：Phase 0 API 契约稳定；Android UTS 已接入扫描、连接、notify/write transport、控制协议、实时录音 OPUS 落盘、Flash 离线文件下载和 WAV/MP3 finalize。iOS UTS 已接入 CoreBluetooth host/control、实时录音协议、OPUS 落盘和 WAV/MP3 decoder，iOS Flash 文件输出待后续 P5 切片。

## 导入

```js
import { OleapBle } from '@/uni_modules/oleap-ble-sdk/index.js'
```

## 初始化

```js
await OleapBle.init({
  logLevel: 'debug'
})
```

SDK facade 默认走 UTS native adapter。Demo 不再提供 mock mode，课堂环境要求先在真机 App 中完成授权、扫描和连接。

Demo 页面推荐通过页面 runtime 初始化，避免每个页面重复写初始化和错误收口样板：

```js
import { ensureOleapReady, runOleapAction } from '@/utils/oleap-page-runtime.js'

await runOleapAction(this, async () => {
  await ensureOleapReady()
})
```

注意：`ensureOleapReady()` 是 Demo 层辅助函数，不是 SDK API。SDK API 仍然从 `OleapBle` 调用。

## 连接

```js
await OleapBle.requestPermissions()
await OleapBle.startScan({ timeoutMs: 2500 })

const off = OleapBle.onDeviceFound((device) => {
  console.log(device.deviceId, device.name)
})

await OleapBle.connect({ deviceId })
await OleapBle.disconnect()
off()
```

所有 `onXxx` 方法都返回取消订阅函数。页面卸载时必须调用。

Demo 页面推荐使用订阅工具统一释放：

```js
import {
  disposeOleapDisposers,
  registerOleapDisposers
} from '@/utils/oleap-page-runtime.js'

registerOleapDisposers(
  this,
  OleapBle.onDeviceFound((device) => {}),
  OleapBle.onConnectionChanged((event) => {})
)

// onUnload
disposeOleapDisposers(this)
```

## 设备控制

```js
const battery = await OleapBle.getBattery()
const sn = await OleapBle.getSn()
const name = await OleapBle.getDeviceName()
const firmware = await OleapBle.getFirmwareVersion()
const hardware = await OleapBle.getHardwareVersion()
const eq = await OleapBle.getEqMode()
await OleapBle.setEqMode({ mode: 1 })
const recordState = await OleapBle.getRecordState()
const flashCapacity = await OleapBle.getFlashCapacity()
await OleapBle.syncAppTime()
```

## 实时录音

```js
await OleapBle.startRecording({ scene: 'personal' })

const result = await OleapBle.stopRecording({
  format: 'wav'
})
```

`scene` 当前可传 `personal`、`call`、`media`、`ambient`；`format` 当前支持 `wav` 和 `mp3`。Android native 当前已能完成 start/stop、OPUS 帧切分、临时文件落盘和 WAV/MP3 输出。当前 Android decoder 使用 `*.oleapframes` 作为输入，要求帧布局为 `4B header + 80B OPUS payload`、单声道、16kHz；不满足时会明确返回 `opus_decoder_frame_layout_unsupported` 或 `opus_decoder_channels_unsupported`。iOS native 当前已接入 start/stop、OPUS notify 帧切分、丢包统计、`.opusraw`/`.oleapframes` 落盘和 `OpusDecoder.framework` WAV/MP3 输出；iOS decoder 当前同样要求 `*.oleapframes` 为 `4B header + 80B OPUS payload`、单声道、16kHz，不满足时会明确返回 `opus_decoder_frame_layout_unsupported` 或 `opus_decoder_channels_unsupported`。decoder 返回负值或输出为空时会明确返回 `opus_decode_failed` / `opus_decode_empty_output`，不会伪装成功。

返回：

```js
{
  filePath: '/cache/oleap-recordings/android-xxx.wav',
  format: 'wav',
  durationMs: 2000,
  sampleRate: 16000,
  channels: 1,
  frameCount: 100,
  frameLen: 84,
  decodedFrames: 100,
  failedFrames: 0,
  pcmBytes: 64000,
  lostFrames: 0,
  outOfOrderFrames: 0,
  badFrames: 0,
  size: 64044
}
```

## Flash 文件

```js
const files = await OleapBle.listFlashRecordings()
const result = await OleapBle.downloadFlashRecording({
  fileId: files[0].fileId,
  format: 'wav',
  deleteAfterSuccess: false
})
await OleapBle.stopFlashDownload()
```

Android native 当前已能查询文件数量、读取文件信息、连续下载 OPUS chunk、停止传输、输出 WAV/MP3，并可在 `deleteAfterSuccess=true` 时安全删除队首文件。SDK 会先确认目标 `fileId` 是设备当前队首；非队首删除返回 `flash_delete_order_violation`。iOS native 当前 Flash API 会明确返回 `ios_flash_not_ready`。

返回：

```js
{
  filePath: '/cache/oleap-recordings/android-xxx.wav',
  format: 'wav',
  source: 'flash',
  fileId: 1001,
  durationMs: 2000,
  sampleRate: 16000,
  channels: 1,
  frameCount: 100,
  lostFrames: 0,
  outOfOrderFrames: 0,
  badFrames: 0,
  size: 64044,
  deleted: false
}
```

## 事件

```js
const offDp = OleapBle.onDpReport((report) => {})
const offShortcut = OleapBle.onShortcutKey((event) => {
  // event.dpId === 135, event.name === 'shortcutKey'
  // SDK only reports the shortcut key event. Business code decides whether to start recording.
  console.log(event.value.raw)
})
const offRecord = OleapBle.onRecordingProgress((event) => {})
const offDecode = OleapBle.onDecodeProgress((event) => {})
const offError = OleapBle.onError((error) => {})

offDp()
offShortcut()
offRecord()
offDecode()
offError()
```

## 诊断

```js
const diagnostics = OleapBle.getDiagnostics()
OleapBle.clearDiagnostics()
```

诊断不记录音频 payload。
