# Phase 1 Android Scan Acceptance Report

日期：2026-05-22

## 范围

已实现：

- Android UTS 平台层初始化。
- Android 12+ 运行时权限：`BLUETOOTH_SCAN`、`BLUETOOTH_CONNECT`。
- Android 11 及以下运行时权限：`ACCESS_FINE_LOCATION`。
- 蓝牙支持和开启状态查询。
- BLE 扫描启动。
- BLE 扫描停止。
- 扫描超时自动停止。
- Oleap 设备名前缀过滤。
- 设备名优先读取 `BluetoothDevice.getName()`，为空时回退到 `ScanRecord.getDeviceName()`。
- `onDeviceFound` 事件订阅和取消订阅。
- 扫描错误和诊断日志。

未实现：

- Android GATT 连接。
- Service/Characteristic 发现。
- Notify 订阅。
- 控制协议事务。
- 录音协议和 OPUS 解码。

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

- P1-1/P1-2 的代码边界清晰，没有提前实现连接。
- 扫描前检查权限和蓝牙状态。
- 扫描有超时和显式停止路径。
- 只向页面发出 Oleap 设备，避免页面层处理全量蓝牙设备。
- 扫描超时有默认值和正数保护，避免传入异常 timeout 导致扫描无法自动结束。
- 事件订阅返回取消函数，保持 Phase 0 的副作用约束。

## 待真机验证

当前环境未运行 HBuilderX/UTS Android 编译，也未连接 Android 真机。后续需要在 HBuilderX 中验证：

- Android 编译通过。
- 权限弹窗符合预期。
- Android 12+ 真机可扫描到 Oleap 设备。
- Android 11 及以下真机权限路径正确。
- 扫描超时后系统蓝牙扫描确实停止。

下一步：

- `P1-3`：Android GATT 连接和断开。
- `P1-4`：服务发现和 characteristic cache。
