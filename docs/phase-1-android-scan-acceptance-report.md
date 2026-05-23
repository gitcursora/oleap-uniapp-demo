# Phase 1 Android Scan Acceptance Report

日期：2026-05-22

## 范围

已实现：

- Android UTS 平台层初始化。
- Android 12+ 运行时权限：`BLUETOOTH_SCAN`、`BLUETOOTH_CONNECT`。
- 宿主 `manifest.json` 明确 `targetSdkVersion >= 31`，否则 Android 权限库不允许请求 `BLUETOOTH_SCAN/CONNECT`。
- 宿主 `manifest.json` 明确 `minSdkVersion >= 24`，匹配 UTS 插件和 OPUS decoder AAR 的 Android 7.0+ 要求。
- UTS 运行时按 Android 系统版本选择权限组：Android 12+ 请求 `BLUETOOTH_SCAN/CONNECT`，Android 11 及以下请求 `ACCESS_FINE_LOCATION`。
- `BLUETOOTH_SCAN` manifest 使用 `android:usesPermissionFlags="neverForLocation"`，明确扫描不用于物理定位，避免 Android 权限库在授权前抛出 manifest 配置异常。
- Android 12+ 如果宿主实际 `targetSdkVersion < 31`，SDK 会返回 `target_sdk_too_low`，要求重新打包自定义基座。
- Android 11 及以下的运行时权限：`ACCESS_FINE_LOCATION`。
- 蓝牙支持和开启状态查询。
- BLE 扫描启动。
- BLE `startScan(callback)` 兼容路径，避免部分运行基座对自定义 `ScanSettings` 的兼容差异。
- 当 BLE scanner 启动失败时，回退到经典蓝牙 `BluetoothAdapter.startDiscovery()` 发现 Oleap 设备地址。
- BLE 扫描停止。
- 扫描超时自动停止。
- Oleap 设备名前缀过滤。
- 设备名前缀过滤改为大小写不敏感，兼容 `OLEAP Archer` / `Oleap Archer` 等固件命名差异。
- 设备名优先读取 `BluetoothDevice.getName()`，为空时回退到 `ScanRecord.getDeviceName()`。
- `onDeviceFound` 事件订阅和取消订阅。
- 扫描错误和诊断日志。

当时未实现，后续报告补齐或继续推进：

- Android GATT 连接已在 `phase-1-android-connect-acceptance-report.md` 补齐。
- Service/Characteristic 发现已在 `phase-1-android-connect-acceptance-report.md` 补齐。
- Notify 订阅已在 `phase-1-android-notify-write-acceptance-report.md` 补齐。
- 控制协议事务已在 `phase-2-android-control-acceptance-report.md` 补齐。
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
- Android 12+ 不再把定位权限当作 BLE 扫描充分条件；如果 HBuilderX 自定义基座实际仍是 `targetSdkVersion < 31`，会提前提示重新打包，避免授权看似成功但 `BluetoothLeScanner.startScan` 抛 `Need android.permission.BLUETOOTH_SCAN`。
- Android 打包 target SDK 由宿主项目声明，插件不在自身 Manifest 中覆盖 target SDK，避免影响集成方全局打包策略。
- 扫描优先走 BLE scanner，失败后自动回退到经典蓝牙发现，减少自定义基座或厂商蓝牙栈差异带来的不可用面。
- 扫描有超时和显式停止路径。
- 只向页面发出 Oleap 设备，避免页面层处理全量蓝牙设备。
- 设备过滤对大小写不敏感，减少不同硬件批次或系统上报名称大小写差异导致的“扫描无结果”。
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

- `P2`：控制协议 frame/DP/transaction。
