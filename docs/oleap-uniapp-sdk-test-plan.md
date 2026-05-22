# Oleap UniApp BLE SDK Test Plan

状态：Phase 0 已执行静态与 mock 验收，后续 Phase 按本计划扩展真机测试。

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
- 控制、录音、Flash fixture 文件存在且是合法 hex。
- mock 扫描能发出设备。
- mock 连接后能读取电量。
- mock 实时录音能产生进度并返回 WAV 路径。
- mock Flash 列表和下载能返回 WAV 路径。
- 诊断日志有事件。

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
- Demo 层支持 Mock/Native 模式切换，并持久化运行模式。
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
