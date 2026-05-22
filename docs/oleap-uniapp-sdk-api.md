# Oleap UniApp BLE SDK API

状态：Phase 0 API 契约稳定；Android UTS 已接入扫描、连接、notify/write transport、控制协议和实时录音 OPUS 落盘。Flash、iOS 原生实现、Android libopus/WAV finalize 待后续 Phase 接入。

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

Phase 0 默认使用 mock mode。后续原生实现完成后，业务页面不需要更换 API。

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

Android native 当前已能完成 start/stop、OPUS 帧切分和临时文件落盘；在 libopus/WAV writer 集成前，真机 `stopRecording({ format: 'wav' })` 会返回 `opus_decode_unsupported`，错误详情中包含 `opusRawPath`、`framesPath` 和帧统计。mock mode 仍返回 WAV 路径，便于课堂页面先联调业务流程。

返回：

```js
{
  filePath: 'mock://recordings/mock-xxx.wav',
  format: 'wav',
  durationMs: 2000,
  sampleRate: 16000,
  channels: 1,
  frameCount: 100,
  lostFrames: 0,
  outOfOrderFrames: 0,
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

`deleteAfterSuccess` 后续只允许安全删除队首文件。

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
