# Oleap UniApp BLE SDK Implementation Plan

状态：v0.6，Android P0-P4 已推进到静态与 fixture 可验收；iOS P5 host/control、实时录音协议和 WAV/MP3 decoder 第一切片已推进
目标项目：`oleap-uniapp-demo`  
目标 SDK：`uni_modules/oleap-ble-sdk`  
目标形态：普通 `uni-app` 教学 Demo + UTS 插件标准 SDK，预留 `uni-app x` 兼容

## 1. 背景与目标

本项目用于职业本科院校教学活动。学生使用普通 `uni-app` 开发软硬结合 App，通过 Oleap 耳机完成连接、设备状态读取、实时录音、录音文件生成、上传转写等场景。

本计划只实现 BLE 控制协议和录音协议，不实现 OTA。SDK 要把 BLE、协议、OPUS 解码、文件落盘等复杂度封装在 UTS/原生层，学生只面对简单的业务 API。

主要目标：

- 封装 `oleap-ble-sdk` UTS 插件，支持 Android 优先，iOS 随后补齐。
- 完整实现控制协议的查询、写入、主动上报和 ACK。
- 完整实现实时录音协议：启动、停止、音频帧解析、丢包统计、输出 WAV。
- 实现 Flash 录音文件的列表、下载、停止传输、顺序删除，并输出 WAV。
- 提供普通 `uni-app` Demo，覆盖扫描连接、设备信息、实时录音、Flash 下载、上传转写入口。
- 以教学安全为优先，避免学生直接操作危险底层能力。

非目标：

- 不实现 OTA。
- 不把 Flutter runtime 嵌入 UniApp。
- 不让 JS 层处理高频 BLE notify 音频帧。
- 不暴露任意原始 BLE characteristic 读写给学生层 API。
- 不默认支持后台长时间录音或后台 Flash 下载。
- 不默认把 Flash 任意 fileId 删除能力暴露给学生。

## 2. 参考依据

本计划以当前 Flutter 仓库和 DCloud 官方插件结构为依据。

协议与现有实现：

- `../oleap-flutter/docs/architecture/oleap-ble-communication-protocol-v1.4-reference.md`
- `../oleap-flutter/packages/oleap_ble_sdk/lib/src/ble/communication/device_control_service.dart`
- `../oleap-flutter/packages/oleap_ble_sdk/lib/src/ble/communication/dp_definitions.dart`
- `../oleap-flutter/packages/oleap_ble_sdk/lib/src/ble/recording/recording_command_codec.dart`
- `../oleap-flutter/packages/oleap_ble_sdk/lib/src/ble/recording/recording_response_codec.dart`
- `../oleap-flutter/packages/oleap_ble_sdk/lib/src/ble/recording/recording_frame_codec.dart`
- `../oleap-flutter/lib/services/audio/opus_decoder_service.dart`
- `../oleap-flutter/lib/services/record/record_write.dart`

DCloud 约束：

- UTS 插件使用 `uni_modules` 管理。
- 插件必须有 `package.json` 和 `utssdk/interface.uts`。
- `utssdk/app-android/index.uts` 和 `utssdk/app-ios/index.uts` 可以分别实现 Android/iOS 平台能力。
- 分平台实现优先于根目录 `index.uts`。
- UTS 插件可供普通 `uni-app` 和 `uni-app x` 使用，但本项目 Demo 主线使用普通 `uni-app`。

外部文档：

- DCloud UTS 插件：`https://uniapp.dcloud.io/plugin/uts-plugin.html`
- DCloud uni_modules：`https://uniapp.dcloud.io/plugin/uni_modules.html`

## 3. 总体架构

```text
uni-app Demo 页面
  |
  | import { OleapBle } from '@/uni_modules/oleap-ble-sdk'
  v
oleap-ble-sdk UTS API facade
  |
  +-- BleHost
  |     Android: BluetoothAdapter / BluetoothLeScanner / BluetoothGatt
  |     iOS: CBCentralManager / CBPeripheral
  |
  +-- ControlProtocol
  |     Control frame codec
  |     DP TLV codec
  |     transaction manager
  |     DP report dispatcher
  |
  +-- RecordingProtocol
  |     command codec
  |     response codec
  |     OPUS frame splitter
  |     realtime recording session
  |     flash transfer session
  |
  +-- AudioFinalizer
  |     OPUS payload file
  |     libopus decode to PCM
  |     WAV writer
  |     optional MP3 encoder adapter
  |
  +-- Diagnostics
        bounded logs
        event counters
        export for teaching/support
```

核心原则：

- BLE host 只处理连接、特征、notify、write，不理解业务 DP。
- 协议层只处理字节编解码和事务，不操作页面状态。
- 音频 session 在原生侧串行处理，不通过 JS 发送音频帧。
- 学生层 API 是业务语义，专家层 API 才暴露 DP 和诊断能力。

仓库副作用约束：

- 本计划实施时默认只修改 `oleap-uniapp-demo`。
- `oleap-flutter` 只作为协议和实现参考，不在本项目实施过程中修改。
- 需要从 Flutter 仓库抽取测试向量时，复制到本项目 `docs/fixtures/` 或 `uni_modules/oleap-ble-sdk/test-fixtures/`，不要建立运行时相对路径依赖。
- 第三方二进制库只放在 SDK 插件平台目录，不放入 Demo 页面目录。

## 4. 项目目录规划

```text
oleap-uniapp-demo/
  docs/
    oleap-uniapp-sdk-implementation-plan.md
    oleap-uniapp-sdk-api.md
    oleap-uniapp-sdk-test-plan.md
  uni_modules/
    oleap-ble-sdk/
      package.json
      index.uts
      utssdk/
        interface.uts
        unierror.uts
        app-android/
          index.uts
          AndroidManifest.xml
          config.json
          libs/
            libopus-android/
          internal/
            BleHost.uts
            ControlFrameCodec.uts
            DpCodec.uts
            ControlTransactionManager.uts
            RecordingCommandCodec.uts
            RecordingResponseCodec.uts
            RecordingFrameSplitter.uts
            RealtimeRecordingSession.uts
            FlashTransferSession.uts
            OpusWavDecoder.uts
            WavWriter.uts
            Diagnostics.uts
        app-ios/
          index.uts
          info.plist
          config.json
          Frameworks/
          internal/
            BleHost.uts
            ControlFrameCodec.uts
            DpCodec.uts
            ControlTransactionManager.uts
            RecordingCommandCodec.uts
            RecordingResponseCodec.uts
            RecordingFrameSplitter.uts
            RealtimeRecordingSession.uts
            FlashTransferSession.uts
            OpusWavDecoder.uts
            WavWriter.uts
            Diagnostics.uts
  pages/
    index/index.vue
    device/device.vue
    record/record.vue
    flash/flash.vue
    transcript/transcript.vue
  server-demo/
    README.md
```

说明：

- `internal/` 是插件内部目录，不作为学生直接 import 的入口。
- Android 和 iOS 可以先重复实现少量平台 glue，协议常量和测试向量保持一致。
- 如果后续 UTS 对共享代码复用验证稳定，再抽公共 `utssdk/common/`。

测试向量目录：

```text
uni_modules/oleap-ble-sdk/
  test-fixtures/
    control/
      query_battery.hex
      write_eq_high_bass.hex
      report_battery.hex
    recording/
      start_personal.hex
      stop_recording.hex
      start_response_success.hex
      stop_response_app.hex
      opus_notify_single_frame.hex
      opus_notify_two_frames.hex
    flash/
      get_file_count.hex
      file_info_response.hex
      download_chunk_response.hex
      delete_response_success.hex
```

这些 fixture 是 Android/iOS/UTS 三端协议一致性的共同基准。

## 4.1 BLE UUID 常量

SDK 内部必须集中定义 UUID，禁止页面层传入 UUID。

控制通道：

| 名称 | UUID |
|---|---|
| Service | `00002001-0000-1000-8000-00805f9b34fb` |
| Notify | `0000c92a-0000-1000-8000-00805f9b34fb` |
| Write | `0000ca2a-0000-1000-8000-00805f9b34fb` |

录音通道：

| 名称 | UUID |
|---|---|
| Service | `65786365-6c70-6f69-6e74-2e636f820000` |
| Notify | `65786365-6c70-6f69-6e74-2e636f820003` |
| Write | `65786365-6c70-6f69-6e74-2e636f820004` |

设备过滤：

- 设备名称前缀：`Oleap`。
- 允许通过配置添加临时前缀，但默认不扫描所有设备。

## 5. SDK Public API

### 5.1 学生层 API

学生层 API 只暴露稳定业务能力。

```ts
type OleapDevice = {
  deviceId: string
  name: string
  rssi: number
  manufacturerDataHex?: string
}

type RecordingResult = {
  filePath: string
  format: 'wav' | 'mp3'
  durationMs: number
  sampleRate: number
  channels: number
  frameCount: number
  lostFrames: number
  outOfOrderFrames: number
  size: number
}

type FlashRecordingInfo = {
  fileId: number
  fileLength: number
  recordType: number
  channels: number
  sampleRate: number
  bitRate: number
  recordTime?: string
}
```

```ts
OleapBle.init(options)
OleapBle.requestPermissions()
OleapBle.getBluetoothState()

OleapBle.startScan(options)
OleapBle.stopScan()
OleapBle.connect({ deviceId })
OleapBle.disconnect()
OleapBle.getConnectionState()

OleapBle.getBattery()
OleapBle.getSn()
OleapBle.getDeviceName()
OleapBle.getFirmwareVersion()
OleapBle.getHardwareVersion()
OleapBle.getEqMode()
OleapBle.setEqMode({ mode })
OleapBle.getRecordState()
OleapBle.getFlashCapacity()
OleapBle.syncAppTime()

OleapBle.startRecording({ scene })
OleapBle.stopRecording({ format })

OleapBle.listFlashRecordings()
OleapBle.downloadFlashRecording({ fileId, format, deleteAfterSuccess })
OleapBle.stopFlashDownload()

OleapBle.onDeviceFound(callback)
OleapBle.onConnectionChanged(callback)
OleapBle.onDpReport(callback)
OleapBle.onShortcutKey(callback)
OleapBle.onRecordingProgress(callback)
OleapBle.onDecodeProgress(callback)
OleapBle.onError(callback)

OleapBle.getDiagnostics()
OleapBle.clearDiagnostics()
```

默认行为：

- `format` 默认 `wav`。
- `scene` 默认 `personal`，映射到协议个人录音 `0x01`，后续可扩展 `call/media/ambient`。
- `downloadFlashRecording` 默认不删除文件；如 `deleteAfterSuccess=true`，SDK 必须确认目标是系统当前最旧文件或按 SDK 内部队列顺序删除。
- `startRecording` 期间禁止并发 Flash 下载。
- Flash 下载期间禁止启动实时录音。

事件订阅约定：

```ts
const off = OleapBle.onDeviceFound((device) => {
  console.log(device)
})

off()
```

- 所有 `onXxx` API 必须返回取消订阅函数。
- 页面 `onUnload` 必须取消订阅；Demo 页面要示范这一点。
- SDK 内部事件 fan-out 要使用有限队列，页面长时间不消费时不能无限增长。
- 录音和下载进度回调节流到 200ms 左右，避免 UI 高频刷新。

### 5.2 专家层 API

专家层用于内部调试、教师演示和故障定位，不在学生默认文档中突出。

```ts
OleapBle.expert.queryDp({ dpId })
OleapBle.expert.writeDp({ dpId, type, value })
OleapBle.expert.getKnownDpSnapshot()
OleapBle.expert.exportRawDiagnostics()
OleapBle.expert.setLogLevel(level)
```

专家层仍不提供任意 characteristic 写入；如确需 raw BLE 调试，应单独创建 Debug 插件或受编译开关保护。

## 6. 控制协议实施细节

### 6.1 Control Frame

实现内容：

- `SYNC = 99 EC`
- `DESC` 小端位域
- `MsgType = B2`
- `DataLen` 小端
- `Payload = SendSN + AskSN + CMD + command payload`
- CRC32 覆盖 `Payload`

常用 DESC：

- 请求：`0x022A`，BLE + version b01 + CRC + need_response。
- ACK：`0x0232` 或按协议需要设置 ack 位。
- 错误响应解析：读取 `DESC.bit8`。

注意事项：

- `SendSN` 自增并允许 uint32 回绕。
- `AskSN` 用于匹配响应，不应只靠 CMD 判断事务。
- 收到不连续 SN 只记录诊断，不直接断开。
- 写 DP 失败响应可能携带设备当前有效值，SDK 要回滚本地快照并返回给调用方。

### 6.2 DP TLV

实现 DP 编解码：

```text
Dp_id   1B
Dp_type 1B
Dp_len  2B little-endian
Dp_data nB
```

第一版必须实现的 DP：

| DP | 功能 | API |
|---:|---|---|
| `0x03` | 电量 | `getBattery`, `onDpReport` |
| `0x08` | 心跳 | snapshot/report only |
| `0x21` | 蓝牙状态 | `getBluetoothState` |
| `0x23` | BT 地址 | `getBtAddress` |
| `0x25` | BLE 地址 | `getBleAddress` |
| `0x66` | 设备名 | `getDeviceName`, optional `setDeviceName` |
| `0x67` | 固件版本 | `getFirmwareVersion` |
| `0x71` | 硬件版本 | `getHardwareVersion` |
| `0x7B` | 当前连接设备地址 | snapshot/report only |
| `0x7C` | 录音状态 | `getRecordState`, `onDpReport` |
| `0x7D` | 通话状态 | snapshot/report only |
| `0x7E` | 同步时间 | `syncAppTime` |
| `0x7F` | Flash 容量 | `getFlashCapacity`, `onDpReport` |
| `0x80` | SN | `getSn` |
| `0x81` | EQ | `getEqMode`, `setEqMode` |
| `0x82` | 按键模式 | optional |
| `0x84` | 历史连接设备 | optional |
| `0x85` | 删除历史连接 | optional |
| `0x86` | 通话降噪 | optional |
| `0x87` | 特殊固件快捷键 | `onShortcutKey`, `onDpReport` |

主动上报：

- 解析 `CMD=0x11`。
- 更新 DP snapshot。
- 发布 `onDpReport`。
- 对 `0x87` 快捷键主动上报额外发布 `onShortcutKey`，SDK 不自动触发录音等业务动作。
- 对设备上报发送 ACK。
- ACK 失败不重发业务命令，只记录诊断。

事务管理：

- 查询/写入超时默认 3 秒。
- 最大重试 3 次。
- 任一时刻 communication channel 只允许一个 active command owner。
- watch/report 是 fan-out，不阻塞 command owner。

## 7. 录音协议实施细节

### 7.1 实时录音命令

启动：

```text
XX 81
01 00
00
```

停止：

```text
00 81
01 00
01
```

场景映射：

| SDK scene | 协议值 | 说明 |
|---|---:|---|
| `personal` | `0x01` | 个人录音，教学默认 |
| `call` | `0x02` | 通话录音 |
| `media` | `0x03` | 媒体录音 |
| `ambient` | `0x04` | 环境录音 |

启动响应：

- `12 80`
- 解析错误码、通道数、数据包长。
- 错误码不为 `0x00` 时返回类型化错误。

停止响应：

- `00 80`
- 解析停止原因和停止场景。
- 收到停止响应后 finalize 当前录音 session。

### 7.2 OPUS Frame Splitter

每个 OPUS packet：

```text
frameLen    1B
opusConfig  1B
dataIndex   2B little-endian
dataBuffer  frameLen bytes
```

实现要求：

- 一个 notify 中按 `frameLen` 循环切包。
- `frameLen=0` 或 `dataEnd > notify.length` 视为坏包并记录。
- `opusConfig` 高 4 位映射 bitrate：`0 -> 32000`, `1 -> 24000`, `2 -> 16000`。
- `opusConfig` 低 4 位映射 channels，0 按 1 处理。
- `dataIndex` 用于统计丢包和乱序，支持 uint16 回绕。
- 输出两个文件：`*.opusraw` 保存纯 OPUS payload，`*.oleapframes` 保存带 4B 帧头的原始帧，便于诊断。

### 7.3 WAV 输出

第一版默认输出 WAV。

处理流程：

```text
OPUS packets -> libopus decode -> PCM s16le -> RIFF/WAV header -> .wav
```

参数：

- sampleRate：固定 `16000`。
- channels：来自 `opusConfig` 或启动响应。
- sample format：signed 16-bit little-endian。
- WAV header 在 finalize 时写入准确 data size。

副作用防护：

- 解码在原生后台线程执行，不阻塞 UI。
- 临时 PCM 文件在成功或失败后清理。
- 解码失败保留 `*.opusraw` 和 `*.oleapframes`，方便诊断和重试。
- JS 回调只上报进度，不传输音频二进制。
- 单次录音 session 只允许一个 finalize 过程。

libopus 打包策略：

- Android 第一版使用预编译 `libopus`，按 ABI 放入插件平台目录，例如 `arm64-v8a` 和 `armeabi-v7a`。如课堂设备统一为 64 位，可先只交付 `arm64-v8a`，但文档必须注明。
- iOS 第一版优先使用静态库或 XCFramework，统一封装为 `OpusWavDecoder`。
- `OpusWavDecoder` 对外只接收 OPUS payload 文件路径、channels、sampleRate、suggestedFrameLen，不暴露 native decoder 句柄给 JS。
- 如果任一平台缺少 decoder，`stopRecording` 返回 `opus_decode_unsupported`，并保留 OPUS 临时文件用于诊断，不伪装成成功 WAV。

### 7.4 MP3 输出

MP3 作为第二阶段能力。

可选路径：

- Android：LAME 或 FFmpeg 变体。
- iOS：优先评估系统可用编码能力；如使用第三方编码库，必须确认授权和包体影响。

验收条件：

- MP3 输出与 WAV 输出时长一致，误差小于 1 秒。
- 编码失败时自动 fallback 返回 WAV，错误中标记 `mp3_encode_failed`。
- 教学 Demo 默认仍使用 WAV。

## 8. Flash 录音实施细节

第一版实现 Flash 文件高层 API，不让学生直接组合底层命令。

命令：

- `01 82`：获取文件数量。
- `02 82`：获取文件信息。
- `03 82`：下载文件数据。
- `13 82`：停止文件传输。
- `04 82`：删除文件。

高层流程：

```text
listFlashRecordings:
  getFlashCapacity
  getFileCount
  for fileId in known range:
    getFileInfo(fileId)
  return metadata list

downloadFlashRecording:
  assert no realtime recording session active
  request download from startAddress=0
  append received OPUS packets
  stop when returnLength < expected payload capacity
  decode to WAV
  optionally delete in safe order
```

文件 ID 枚举策略：

- `getFileCount` 返回 `fileCount` 和 `fileStartId`。
- 第一版按 `fileStartId ... fileStartId + fileCount - 1` 查询 `getFileInfo`。
- 如果设备返回不存在，跳过该 ID 并记录诊断。
- 如真机验证发现 ID 不连续，需要在 Phase 4 加入“探测直到连续 miss 达到阈值”的 fallback。

删除规则：

- 协议限制只能从系统第一个/最旧文件顺序删除。
- SDK 维护 `flashQueue`，只有队首文件允许自动删除。
- 如果调用方要求删除非队首文件，返回 `flash_delete_order_violation`。
- 删除失败不影响已下载 WAV 文件。

连续传输：

- 默认使用连续传输。
- 支持 `stopFlashDownload()` 中断。
- 中断后保留临时文件和 checkpoint，第二阶段再考虑断点续传。

Flash 下载验收：

- 文件列表准确。
- 文件 metadata 解析准确。
- 下载完成后 WAV 可播放。
- 删除只删除队首文件。
- 断连时下载 session 进入 failed，不继续写文件。

## 9. BLE Host 实施细节

### 9.1 Android

权限：

- Android 12+：`BLUETOOTH_SCAN`, `BLUETOOTH_CONNECT`。
- Android 11 及以下：按系统要求补位置权限。
- Manifest 中只声明必要权限，不声明后台定位。

连接流程：

```text
requestPermissions
check adapter state
startScan filter by name/service/manufacturer
stopScan before connect
connectGatt
discoverServices
requestConnectionPriority high if available
requestMtu 512 if available
find communication write/notify
find record write/notify
subscribe notify
emit connected
bootstrap DP query
```

副作用防护：

- 连接前停止扫描。
- 同一时刻只有一个 connecting task。
- 断开时取消 GATT callback、清空 characteristic cache、递增 session generation。
- 写入时检查 generation，拒绝旧 session 的 pending write。
- notify callback 不做重 CPU 工作，只投递到串行协议队列。

### 9.2 iOS

权限和配置：

- `info.plist` 添加蓝牙用途说明。
- 用 `CBCentralManager` 管理状态。
- 不默认声明后台 BLE mode，避免教学 Demo 被误认为支持后台稳定传输。

连接流程：

```text
central state poweredOn
scan or connect known peripheral
discoverServices
discoverCharacteristics
setNotifyValue true
emit connected
bootstrap DP query
```

iOS 风险：

- iOS 不直接暴露 BLE MAC，设备标识需要用 `identifier` 和已配对信息处理。
- 前后台切换可能导致传输中断，SDK 必须在事件中报告 `interrupted`。
- iOS Flash 大文件下载需重点真机压测。

## 10. 并发与状态机

全局状态：

```text
idle
scanning
connecting
connected
disconnecting
disconnected
```

业务互斥：

```text
recording: idle | starting | active | stopping | finalizing | failed
flash: idle | listing | downloading | stopping | finalizing | failed
decode: idle | decoding | completed | failed
```

规则：

- `recording.active` 时禁止 `flash.downloading`。
- `flash.downloading` 时禁止 `recording.starting`。
- `decode.decoding` 可与 BLE idle 并存，但同一文件只允许一个 decode。
- disconnect 会取消 pending control transaction、record command waiter、flash transfer。
- reconnect 后 generation 自增，旧 notify 不得命中新事务。

## 11. 错误模型

统一错误结构：

```ts
type OleapBleError = {
  code: string
  message: string
  area: 'permission' | 'bluetooth' | 'connection' | 'control' | 'recording' | 'flash' | 'decode'
  recoverable: boolean
  details?: Record<string, any>
}
```

关键错误码：

- `permission_denied`
- `bluetooth_off`
- `scan_timeout`
- `connect_timeout`
- `service_not_found`
- `characteristic_not_found`
- `control_timeout`
- `control_write_rejected`
- `record_channel_not_ready`
- `record_start_rejected`
- `record_stop_timeout`
- `record_frame_corrupted`
- `flash_delete_order_violation`
- `flash_download_interrupted`
- `opus_decode_failed`
- `wav_write_failed`
- `unsupported_platform`

学生层错误信息要给可操作建议；专家层保留 bytes、dpId、sendSn、askSn 等诊断字段。

## 12. 诊断与日志

诊断目标：

- 教师/助教可以快速判断是权限、连接、协议、音频、转写哪一层问题。
- 默认不记录完整音频数据，避免隐私和文件体积问题。

记录内容：

- SDK version、platform、app version。
- 权限状态、蓝牙状态。
- 扫描结果摘要。
- 连接耗时、discover 耗时、MTU。
- 订阅 communication/record notify 是否成功。
- control transaction 的 cmd、dpId、sendSn、askSn、耗时、结果。
- recording frame count、lostFrames、outOfOrderFrames。
- flash file count、download bytes、delete result。
- decode 耗时、输出文件路径、错误码。

限制：

- ring buffer 默认 500 条。
- 不记录 OPUS payload。
- 导出诊断前脱敏 deviceId、MAC、SN，可保留 hash。

## 13. Demo 页面规划

### 13.1 首页/连接页

功能：

- 请求权限。
- 蓝牙状态提示。
- 扫描 Oleap 设备。
- 连接/断开。
- 展示连接状态和诊断入口。

### 13.2 设备页

功能：

- 电量、SN、固件版本、硬件版本。
- EQ 查询和设置。
- 录音状态、Flash 容量。
- 主动上报事件列表。

### 13.3 实时录音页

功能：

- 开始个人录音。
- 显示时长、帧数、丢包数。
- 停止后显示 WAV 文件路径。
- 播放本地 WAV。
- 跳转转写页。

### 13.4 Flash 页

功能：

- 列出 Flash 录音文件。
- 下载选中文件。
- 显示下载进度。
- 下载后输出 WAV。
- 可选安全删除。

### 13.5 转写页

功能：

- 选择实时录音或 Flash 下载得到的 WAV。
- 上传到示例后端。
- 展示转写结果。
- 后端接口用 mock 优先，真实 ASR 后续替换。

## 14. 分阶段实施计划

### Phase 0：项目基线

任务：

- 初始化普通 `uni-app` Vue3 项目结构。
- 创建 `uni_modules/oleap-ble-sdk` 插件骨架。
- 创建 SDK 文档、API 文档、测试计划。
- 配置 Android/iOS 权限占位。

验收：

- Demo 能启动。
- 能 import SDK。
- 未实现平台返回 `unsupported_platform`。

任务拆分：

| ID | 任务 | 依赖 | 产出 |
|---|---|---|---|
| P0-1 | 创建普通 `uni-app` Vue3 Demo 基线 | 无 | 可启动空 Demo |
| P0-2 | 创建 `uni_modules/oleap-ble-sdk` 骨架 | P0-1 | `package.json`, `index.uts`, `interface.uts` |
| P0-3 | 定义 API 类型和错误类型 | P0-2 | TS/UTS 类型定义 |
| P0-4 | 加入 mock mode | P0-3 | 无设备可跑通页面 |
| P0-5 | 创建 fixture 目录 | P0-2 | 初始 golden 文件 |

### Phase 1：Android BLE Host

任务：

- 实现权限请求和状态查询。
- 实现扫描、停止扫描、连接、断开。
- 实现 service/characteristic 发现。
- 订阅 communication 和 record notify。
- 实现基本 diagnostics。

验收：

- Android 真机可扫描 Oleap 设备。
- 连接后 communication/record channel ready。
- 断开后状态和资源清理正确。

任务拆分：

| ID | 任务 | 依赖 | 产出 |
|---|---|---|---|
| P1-1 | Android 权限和蓝牙状态 | P0 | `requestPermissions`, `getBluetoothState` |
| P1-2 | 扫描和过滤 | P1-1 | `startScan`, `stopScan`, `onDeviceFound` |
| P1-3 | GATT 连接和断开 | P1-2 | `connect`, `disconnect` |
| P1-4 | 服务发现和 characteristic cache | P1-3 | channel ready |
| P1-5 | notify 订阅和 write queue | P1-4 | communication/record notify |
| P1-6 | generation 和资源释放 | P1-5 | reconnect safe |

### Phase 2：控制协议

任务：

- 实现 CRC32。
- 实现 control frame codec。
- 实现 DP TLV codec。
- 实现 transaction manager。
- 实现 DP snapshot 和 report dispatcher。
- 实现电量、SN、版本、EQ、录音状态、Flash 容量等 API。

验收：

- `getBattery` 成功。
- `getSn` 成功。
- `getEqMode` 和 `setEqMode` 成功。
- 主动上报能触发 `onDpReport` 并 ACK。
- 超时和写失败有类型化错误。

任务拆分：

| ID | 任务 | 依赖 | 产出 |
|---|---|---|---|
| P2-1 | CRC32 + byte utils | P0-5 | fixture 可验证 |
| P2-2 | Control frame encode/decode | P2-1 | query/write/report frame |
| P2-3 | DP TLV encode/decode | P2-1 | known DP models |
| P2-4 | Transaction manager | P1-5, P2-2 | timeout/retry/matching |
| P2-5 | DP report dispatcher + ACK | P2-2, P2-3 | `onDpReport` |
| P2-6 | 设备 API facade | P2-4 | battery/SN/EQ/version |

### Phase 3：实时录音 + WAV

当前实施状态：Android 已完成 P3-1 到 P3-7，包括 start/stop、响应解析、OPUS frame splitter、realtime session、`*.opusraw`/`*.oleapframes` 落盘，以及基于 `oleap-release.aar` 的 WAV/MP3 finalize。当前 Android decoder 输入为 `4B header + 80B OPUS payload` 的连续帧文件，SDK 使用 `*.oleapframes` 进入解码；其他帧布局会明确失败。

任务：

- 实现 recording command codec。
- 实现 recording response codec。
- 实现 OPUS frame splitter。
- 实现 realtime recording session。
- 集成 libopus 解码。
- 实现 WAV writer。
- Demo 录音页接入。

验收：

- `startRecording` 收到成功响应。
- notify 音频帧持续写入。
- `stopRecording` 返回 WAV 文件。
- WAV 可播放，时长与录音时长一致。
- 丢包统计可见。

任务拆分：

| ID | 任务 | 依赖 | 产出 |
|---|---|---|---|
| P3-1 | Recording command codec | P0-5 | start/stop bytes |
| P3-2 | Recording response codec | P0-5 | `12 80`, `00 80` |
| P3-3 | OPUS frame splitter | P0-5 | single/multi frame |
| P3-4 | Realtime session state machine | P1-5, P3-1, P3-2 | start/stop/progress |
| P3-5 | OPUS payload writer | P3-3 | `*.opusraw`, `*.oleapframes` |
| P3-6 | libopus bridge | P3-5 | PCM output |
| P3-7 | WAV writer | P3-6 | playable WAV |
| P3-8 | Demo record page | P3-7 | classroom main flow |

### Phase 4：Flash 文件

任务：

- 实现文件数量、文件信息、下载、停止传输、删除。
- 实现 Flash transfer session。
- 下载数据复用 OPUS frame splitter。
- 下载完成后输出 WAV。
- Demo Flash 页接入。

验收：

- 能列出 Flash 文件。
- 能下载并输出可播放 WAV。
- 能安全删除队首文件。
- 中断下载不会产生半成品成功结果。

任务拆分：

| ID | 任务 | 依赖 | 产出 |
|---|---|---|---|
| P4-1 | Flash command codec | P3-1 | `01/02/03/04/13 82` |
| P4-2 | Flash response codec | P3-2 | count/info/chunk/delete |
| P4-3 | `listFlashRecordings` | P2-6, P4-2 | metadata list |
| P4-4 | Flash transfer session | P4-1, P4-2, P3-5 | chunk append |
| P4-5 | Flash WAV finalize | P3-7, P4-4 | downloaded WAV |
| P4-6 | Safe delete queue | P4-3 | delete head only |
| P4-7 | Demo flash page | P4-5 | classroom advanced flow |

### Phase 5：iOS 支持

任务：

- 实现 iOS BLE Host。
- 复用协议测试向量。
- 集成 iOS OPUS 解码和 WAV writer。
- 完成 iOS Demo 验证。

验收：

- iOS 可连接、查询电量/SN/EQ。
- iOS 可实时录音输出 WAV。
- iOS Flash 下载经过至少 3 个文件样本验证。

任务拆分：

| ID | 任务 | 依赖 | 产出 |
|---|---|---|---|
| P5-1 | iOS BLE host | P1-6 | scan/connect/discover |
| P5-2 | iOS notify/write bridge | P5-1 | channel ready |
| P5-3 | iOS libopus/WAV | P3-7 | playable WAV |
| P5-4 | iOS control smoke | P5-2, P2 | battery/SN/EQ |
| P5-5 | iOS recording smoke | P5-3, P3 | realtime WAV |
| P5-6 | iOS Flash smoke | P5-5, P4 | Flash WAV |

### Phase 6：教学打磨

任务：

- 完成 API 文档。
- 完成课堂快速开始。
- 完成常见错误处理指南。
- 完成 mock mode。
- 完成示例后端上传转写。
- 准备教师演示脚本和学生任务书。

验收：

- 无耳机时 mock mode 可完成页面开发。
- 有耳机时真实链路可跑通。
- 学生只需 5 到 8 个 API 即可完成录音转写 Demo。

## 15. 测试计划

### 15.1 单元测试

协议 codec：

- control frame CRC32 golden。
- DP TLV encode/decode。
- query/write response matching。
- report ACK 生成。
- recording command bytes。
- recording response decode。
- OPUS frame splitter 单帧、多帧、坏帧、截断帧。
- Flash response decode。
- WAV header 生成。

### 15.2 集成测试

Android 真机：

- 权限拒绝/允许。
- 蓝牙关闭。
- 扫描超时。
- 连接/断开/重连。
- 查询 DP。
- 主动上报。
- 实时录音 10 秒、60 秒、5 分钟。
- Flash 下载小文件和大文件。
- 录音中断网/断蓝牙。

iOS 真机：

- 同 Android，但重点补前后台切换和系统蓝牙权限变化。

### 15.3 教学验收

- 学生 Demo 从空白项目接入 SDK 不超过 30 分钟。
- 一次完整录音转写流程不需要学生查看协议文档。
- 常见问题能通过 Demo 页面提示定位到权限、连接、录音或转写层。

## 16. 副作用与风险控制

文件系统：

- 所有录音文件写入 App 私有目录。
- 临时文件命名带 sessionId。
- finalize 成功后再暴露最终路径。
- 失败时保留诊断文件但不返回成功。

BLE：

- 连接前停止扫描。
- 断开时清理 GATT、callbacks、timers。
- 所有 pending transaction 绑定 generation。
- 不在 notify 回调里执行解码。

音频：

- 默认输出 WAV，避免 MP3 编码授权和包体风险。
- OPUS payload 不通过 JS bridge。
- 解码后台线程执行，提供取消。

Flash：

- 禁止任意删除。
- 下载和实时录音互斥。
- 删除失败不影响已下载文件。

隐私：

- 诊断不记录音频 payload。
- 导出日志默认脱敏 SN/MAC/deviceId。
- Demo 转写上传前明确提示用户。

教学：

- 提供 mock mode，降低设备数量不足的课堂风险。
- 提供错误码解释，降低助教排障成本。
- 高风险专家 API 默认隐藏。

## 17. 开工顺序建议

最小可用链路：

1. Android 插件骨架。
2. 扫描连接。
3. 控制协议 `getBattery`。
4. 控制协议 `getSn`。
5. 实时录音 `start/stop`。
6. OPUS -> WAV。
7. Demo 录音转写。
8. Flash 下载。
9. iOS。

不要先做：

- MP3。
- OTA。
- 后台模式。
- Flash 断点续传。
- 专家 raw BLE 能力。
- 复杂 UI。

## 17.1 Definition of Done

每个 Phase 完成时必须满足：

- 代码只修改 `oleap-uniapp-demo`。
- Demo 页面能运行，未实现功能以明确错误提示返回。
- 新增协议逻辑有 fixture 或真机验收记录。
- 所有事件订阅在页面卸载时取消。
- 断开连接后无 pending timer、callback、decode task 泄漏。
- 诊断日志可导出，且不包含音频 payload。
- 文档同步更新 API、错误码和已知限制。

## 18. 交付清单

SDK：

- `uni_modules/oleap-ble-sdk`
- Android 实现。
- iOS 实现。
- API 类型定义。
- 错误码。
- 诊断导出。

Demo：

- 连接页。
- 设备页。
- 实时录音页。
- Flash 页。
- 转写页。
- mock mode。

文档：

- 快速开始。
- API 文档。
- 权限配置。
- 常见错误。
- 教学任务书。
- 测试报告模板。

## 19. 迭代审查清单

计划达到可落地程度前必须通过以下审查：

- [x] 是否明确了不做 OTA、后台长传、raw BLE 等非目标。
- [x] 是否把高频音频数据留在原生侧，避免 JS bridge 压力。
- [x] 是否覆盖控制协议查询、写入、主动上报、ACK、超时。
- [x] 是否覆盖实时录音启动、停止、帧解析、丢包、WAV 输出。
- [x] 是否覆盖 Flash 列表、下载、停止、安全删除。
- [x] 是否覆盖 Android 和 iOS 的平台差异。
- [x] 是否有清晰错误模型。
- [x] 是否有资源清理和 generation 防旧响应机制。
- [x] 是否有测试计划和教学验收。
- [x] 是否能按 Phase 逐步交付，不依赖一次性大爆炸实现。

## 19.1 迭代审查记录

第一轮审查发现并已补齐：

- 增加 BLE UUID 常量表，避免页面层传入 UUID。
- 增加事件订阅取消约定，避免页面卸载后回调泄漏。
- 增加 libopus Android/iOS 打包策略，明确 decoder 不可用时的错误行为。
- 增加 Flash 文件 ID 枚举策略，避免默认假设完全连续却无 fallback。
- 增加 fixture 目录和 golden 测试向量规划。
- 增加 Phase 任务 ID、依赖和产出，便于直接拆任务。
- 增加 Definition of Done，约束每阶段副作用和文档同步。

第二轮审查结论：

- 计划已具备按 Phase 开工条件。
- 第一条可执行任务是 `P0-1`：初始化普通 `uni-app` Vue3 Demo 基线。
- 第一条 SDK 任务是 `P0-2`：创建 `uni_modules/oleap-ble-sdk` 骨架。
- 第一条真机闭环任务是 `P1-1` 到 `P2-6`：Android 连接后读取电量/SN/EQ。

## 20. 当前结论

按本计划实施，第一版可先完成 Android 端“扫描连接 + 控制协议 + 实时录音 WAV + Demo 转写”，随后补 Flash 和 iOS。计划已经拆到任务 ID、依赖、产出和验收粒度，可以直接进入 Phase 0 实施。
