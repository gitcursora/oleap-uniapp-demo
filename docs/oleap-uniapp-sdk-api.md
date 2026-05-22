# Oleap UniApp BLE SDK API

状态：Phase 0 API 契约稳定；Android UTS 已接入扫描、连接、notify/write transport、控制协议、实时录音 OPUS 落盘、Flash 离线文件下载和 WAV/MP3 finalize。iOS 原生实现待后续 Phase 接入。

## 导入

```js
import { OleapBle } from '@/uni_modules/oleap-ble-sdk/index.js'
```

## 初始化

```js
await OleapBle.init({
  mock: true,
  logLevel: 'debug'
})
```

默认使用 mock mode。App 真机环境可传 `mock: false` 走 UTS native adapter，业务页面不需要更换 API。Demo 页通过本地存储统一保存 Mock/Native 运行模式。

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
await OleapBle.startRecording({ scene: 'meeting' })

const result = await OleapBle.stopRecording({
  format: 'wav'
})
```

`scene` 当前可传 `meeting`、`call`、`media`、`ambient`；`format` 当前支持 `wav` 和 `mp3`。Android native 当前已能完成 start/stop、OPUS 帧切分、临时文件落盘和 WAV/MP3 输出。当前 Android decoder 使用 `*.oleapframes` 作为输入，要求帧布局为 `4B header + 80B OPUS payload`、单声道、16kHz；不满足时会明确返回 `opus_decoder_frame_layout_unsupported` 或 `opus_decoder_channels_unsupported`。

返回：

```js
{
  filePath: 'mock://recordings/mock-xxx.wav',
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

Android native 当前已能查询文件数量、读取文件信息、连续下载 OPUS chunk、停止传输、输出 WAV/MP3，并可在 `deleteAfterSuccess=true` 时安全删除队首文件。SDK 会先确认目标 `fileId` 是设备当前队首；非队首删除返回 `flash_delete_order_violation`。

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
const offRecord = OleapBle.onRecordingProgress((event) => {})
const offDecode = OleapBle.onDecodeProgress((event) => {})
const offError = OleapBle.onError((error) => {})

offDp()
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
