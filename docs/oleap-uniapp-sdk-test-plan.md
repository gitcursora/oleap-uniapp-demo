# Oleap UniApp BLE SDK Test Plan

状态：Phase 0 已切换为 native-only 静态验收，后续 Phase 按本计划扩展真机测试。

## Phase 0

命令：

```sh
npm run check:phase0
```

覆盖：

- 必需项目文件存在。
- `pages.json` 中的页面文件存在。
- 页面均通过 SDK facade import。
- 页面包含 `onUnload` 订阅清理。
- 页面 runtime 工具存在，统一收敛初始化、错误收口、订阅释放和诊断格式化。
- 控制、录音、Flash fixture 文件存在且是合法 hex。
- SDK facade 默认走 native adapter。
- Demo 页面不再包含 mock 模式入口或 mock 持久化状态。
- 首页保留授权、扫描、已知设备快速连接和连接态展示。

## Phase 1

Android 真机 BLE Host：

- 权限拒绝和允许。
- 蓝牙关闭和开启。
- 扫描设备。
- 停止扫描。
- 连接和断开。
- 服务发现。
- communication/record notify 订阅。
- 断开后资源释放。

当前静态验收：

```sh
npm run check:p1-android
```

覆盖：

- Android BLE native import。
- Android 12+ 蓝牙权限。
- Android 11 及以下位置权限。
- `UTSAndroid.requestSystemPermission` 和 `checkSystemPermissionGranted`。
- `getBluetoothState`。
- `startScan` / `stopScan`。
- Oleap 设备名前缀过滤。
- 扫描超时和清理。
- `onDeviceFound` 订阅和取消订阅。
- `getDiagnostics`。
- Android GATT 连接入口。
- 连接超时。
- `BluetoothGattCallback`。
- `onConnectionStateChange`。
- `onServicesDiscovered`。
- 必需 service/characteristic UUID。
- characteristic cache。
- channel ready snapshot。
- communication/record notify CCCD 订阅。
- `onDescriptorWrite` 串行推进。
- communication/record notify 回调入口。
- communication/record 写队列。
- `ByteArray` 写入转换。
- 写入回调超时。
- 断开时取消 pending write。
- generation 防护，旧 GATT callback 不得推进新连接。
- 断开时清理 GATT 和 characteristic cache。

## Phase 2

控制协议：

- CRC32 fixture。
- control frame encode/decode。
- DP TLV encode/decode。
- 电量、SN、版本、EQ 查询。
- EQ 写入。
- 主动上报 ACK。
- 超时和重试。

当前静态与 fixture 验收：

```sh
npm run check:p2-control
```

覆盖：

- Android 控制协议占位已移除。
- 控制帧、Payload、DP TLV 编解码入口存在。
- control transaction queue 存在。
- communication notify 分发到控制协议解析。
- 主动上报 ACK 路径存在。
- 电量、SN、EQ、版本等 API 使用 `queryDp/writeDp`。
- control fixture CRC、CMD 和 DP TLV 可解析。

## Phase 3

实时录音：

- 启动响应成功。
- 启动响应拒绝。
- 单帧和多帧 OPUS notify。
- 丢包和乱序统计。
- 停止响应。
- WAV 可播放。
- 断连时停止 session。

当前静态与 fixture 验收：

```sh
npm run check:p3-recording
npm run check:p3-demo
```

覆盖：

- Android 录音协议占位已移除。
- start/stop 命令 codec 与 fixture 一致。
- 启动响应 `0x1280` 和停止响应 `0x0080` 可解析。
- 单帧和多帧 OPUS notify 可切分。
- OPUS bitrate、channels、frame time 可计算。
- realtime session、pending command timeout、断连清理入口存在。
- OPUS payload 和带头诊断帧写入 App 私有缓存目录。
- Android decoder AAR 已接入插件构建。
- 停止录音后使用 `*.oleapframes` 输出 WAV/MP3。
- decoder 输出文件存在性和大小校验存在。
- 不满足 `4B header + 80B OPUS payload`、单声道、16kHz 的布局时明确失败，不伪装 WAV 成功。
- Demo 层使用 native-only 运行模式，并保留已知设备快速连接。
- Demo 录音页支持场景、WAV/MP3 输出、录音统计、解码进度、输出文件路径复制和转写入口。
- Demo 层 SDK 错误码与 decoder 细节可见。

待真机补齐：

- Android HBuilderX/UTS 编译验证。
- 真实录音 WAV 可播放验证。

## Phase 4

Flash：

- 获取文件数量。
- 获取文件信息。
- 连续下载。
- 手动停止下载。
- 下载后 WAV 可播放。
- 队首安全删除。
- 非队首删除拒绝。

当前静态与 fixture 验收：

```sh
npm run check:p4-flash
```

覆盖：

- Android Flash 协议占位已移除。
- Flash 文件数量、文件信息、文件下载、删除、停止传输命令 codec 存在。
- Flash 命令 CRC 从参数长度字段开始计算。
- Flash 响应 CRC offset 使用 `4 + declaredLength` 动态计算。
- 文件信息 fixture 可解析出 fileId、长度、录音类型、通道、采样率和码率。
- 下载 chunk fixture 可解析出动态 payload，并复用 OPUS 帧切分。
- 下载完成条件使用 `returnLength < dataCapacity`。
- `0xFEFEFEFE` 读取错误和 `0xFFFFFFFF` 文件不存在特殊值被处理。
- `deleteAfterSuccess` 只允许删除设备当前队首文件。
- Demo Flash 页支持 WAV/MP3、下载后删除队首、停止下载、复制路径和转写入口。

待真机补齐：

- Android HBuilderX/UTS Flash 编译验证。
- 大文件连续下载稳定性。
- 手动停止下载后设备侧传输停止。
- 下载后 WAV/MP3 可播放。
- 队首删除成功、非队首删除拒绝。

## Phase 5

iOS native：

- iOS CoreBluetooth 初始化。
- iOS 扫描 Oleap 设备。
- iOS 连接、服务发现、characteristic cache。
- iOS communication/record notify 订阅。
- iOS communication/record write bridge。
- iOS 控制协议：电量、SN、EQ、版本等查询与 EQ 写入。
- iOS 实时录音 start/stop、OPUS notify 帧解析、丢包统计、临时文件落盘和 WAV/MP3 解码。
- iOS Flash 文件输出。

当前静态与 fixture 验收：

```sh
npm run check:p5-ios
```

覆盖：

- iOS unsupported stub 已移除。
- `CBCentralManagerDelegate` / `CBPeripheralDelegate` native host 存在。
- iOS 扫描、连接、断开、服务发现、特征发现、notify 订阅和写入入口存在。
- communication notify 分发到控制协议解析。
- record notify 分发到录音协议解析。
- iOS 控制协议 codec、transaction queue、主动上报 ACK、超时重试存在。
- iOS 电量、SN、设备名、版本、EQ、录音状态、Flash 容量、同步时间 API 接入控制协议。
- iOS 录音命令、启动/停止响应、OPUS frame splitter 复用 Android P3 fixture 口径。
- iOS 录音 session 能创建私有目录下的 `.opusraw` 和 `.oleapframes` 临时文件。
- iOS `OpusDecoder.framework` 存在，`stopRecording` 可调用 `opus2wav` / `opus2mp3` 输出文件。
- iOS 蓝牙权限文案存在。
- iOS decoder 失败时明确返回 `opus_decode_failed` / `opus_decode_empty_output`，Flash 当前明确返回 `ios_flash_not_ready`，不伪装成功。
- 控制协议 fixture 在 iOS P5 检查中复用，保证 DP frame 口径一致。
- 录音协议 fixture 在 iOS P5 检查中复用，保证 start/stop/frame 口径一致。

待真机补齐：

- Android 之外的 HBuilderX iOS/UTS 编译验证。
- iOS 真机扫描、连接、notify/write 稳定性。
- iOS 电量/SN/EQ 查询和主动上报 ACK。
- iOS 实时录音 start/stop、帧落盘路径可读。
- iOS 实时录音 WAV 可播放。
- iOS Flash 下载 WAV/MP3 可播放。
