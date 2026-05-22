# Phase 5 iOS Host Acceptance Report

状态：已完成 iOS CoreBluetooth host/control 第一切片，真机验收待 HBuilderX iOS 构建与 Oleap 耳机实测。

## 本轮范围

- iOS `app-ios/index.uts` 从 unsupported stub 升级为 CoreBluetooth native host：
  - `CBCentralManager` 初始化和蓝牙状态读取。
  - 按设备名前缀 `Oleap` 扫描。
  - `CBPeripheral` 连接、服务发现、特征发现。
  - communication / record 双通道 characteristic cache。
  - communication / record notify 开启。
  - communication / record write bridge。
- iOS 控制协议 smoke：
  - 控制帧 CRC、encode/decode、DP TLV encode/decode。
  - control transaction queue、超时、重试。
  - 主动上报 ACK。
  - 电量、SN、设备名、版本、EQ、录音状态、Flash 容量、同步时间 API。
- iOS 权限配置：
  - `NSBluetoothAlwaysUsageDescription`。
  - `NSBluetoothPeripheralUsageDescription`。
- iOS 录音和 Flash 当前保留明确边界：
  - `startRecording` / `stopRecording` 返回 `ios_recording_not_ready`。
  - `listFlashRecordings` / `downloadFlashRecording` 返回 `ios_flash_not_ready`。
  - record notify 在 P5 第一切片仅记录诊断，不伪装输出文件。

## 验收命令

```sh
npm run check:phase0
npm run check:p1-android
npm run check:p2-control
npm run check:p3-recording
npm run check:p3-demo
npm run check:p4-flash
npm run check:p5-ios
```

## 风险与边界

- 当前 P5 只覆盖 iOS host/control，不承诺 iOS WAV/MP3 文件输出。
- iOS `Data` 与 UTS typed array 桥接、CoreBluetooth delegate 方法签名仍需 HBuilderX 真机编译验证。
- iOS 不新增后台 BLE capability，避免 App 行为和审核面扩大。
- 下一切片应接入 iOS OPUS decoder/WAV writer，并复用 Android P3/P4 的录音和 Flash session 语义。
