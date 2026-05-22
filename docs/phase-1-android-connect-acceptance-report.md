# Phase 1 Android Connect Acceptance Report

日期：2026-05-22

## 范围

已实现：

- Android GATT 连接入口 `connect({ deviceId })`。
- 连接前停止扫描。
- 单连接互斥，重复连接返回 `already_connecting`。
- 连接超时，默认 15 秒。
- `BluetoothGattCallback`。
- `onConnectionStateChange` 处理 connected/disconnected。
- `onServicesDiscovered` 处理服务发现结果。
- 控制服务和录音服务 UUID 常量。
- communication write/notify characteristic cache。
- record write/notify characteristic cache。
- `channelReadySnapshot()`。
- `getConnectionState()` 返回连接状态、generation 和 channel ready 状态。
- `disconnect()` 关闭 GATT、清理 characteristic cache、递增 generation。
- 连接成功只在必需 characteristic 全部发现后 resolve。

当时未实现，后续报告补齐或继续推进：

- Notify 订阅和 Write queue 已在 `phase-1-android-notify-write-acceptance-report.md` 补齐。
- 控制协议事务。
- 录音协议和 OPUS 解码。
- iOS BLE Host。

## 验收命令

```sh
npm run check:p1-android
```

结果：

```text
P1 Android host check passed
```

同时回归：

```sh
npm run check:phase0
```

结果：

```text
Phase 0 check passed
```

## 审查结论

- `connect()` 不在 GATT connected 时提前 resolve，必须等服务发现和 characteristic cache 完成。
- 连接中的设备使用 `pendingDeviceId`，避免 `getConnectionState()` 在服务发现前误报 connected。
- 断开和连接失败都会清理 GATT、pending timer 和 characteristic cache。
- Notify 订阅和写队列已作为独立 P1-5/P1-6 步骤验收，避免连接发现步骤职责过大。
- 控制协议已在 `phase-2-android-control-acceptance-report.md` 作为独立步骤验收。

## 待真机验证

当前环境未运行 HBuilderX/UTS Android 编译，也未连接 Android 真机。后续需要在 HBuilderX 中验证：

- Android 编译通过。
- 真实 Oleap 设备连接成功。
- `discoverServices()` 返回 true。
- 必需 service/characteristic 全部能发现。
- 连接失败、超时、手动断开能正确释放 GATT。
- 重复连接不会泄漏旧 callback 或旧 characteristic。

下一步：

- `P2`：控制协议 frame/DP/transaction。
