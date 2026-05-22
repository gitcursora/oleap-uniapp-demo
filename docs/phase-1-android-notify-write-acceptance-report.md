# Phase 1 Android Notify/Write Acceptance Report

日期：2026-05-22

## 范围

已实现：

- Android communication notify 订阅。
- Android record notify 订阅。
- CCCD `00002902-0000-1000-8000-00805f9b34fb` 串行写入。
- `connect()` 只在服务发现、characteristic cache 和两个 notify 都成功后 resolve。
- `onCharacteristicChanged` 区分 communication/record notify。
- communication/record 写队列。
- `Array<number>` 到 Android `ByteArray` 的写入转换。
- `onCharacteristicWrite` 串行释放下一笔写入。
- 写入超时，默认 8 秒。
- 断开时 reject active/pending write。
- GATT callback 绑定 generation，旧连接回调不会推进新连接。
- `getDiagnostics()` 暴露 `notificationsReady`、generation 和 transport 事件。

当时未实现，后续报告补齐或继续推进：

- 控制协议 frame codec、DP codec 和事务管理已在 `phase-2-android-control-acceptance-report.md` 补齐。
- communication notify payload 到控制协议的业务分发已在 `phase-2-android-control-acceptance-report.md` 补齐。
- record notify payload 到录音协议的业务分发。
- 实时录音 OPUS 解码和 WAV 输出。
- Flash 文件协议。
- iOS BLE Host。

## 验收命令

```sh
npm run check:p1-android
```

预期结果：

```text
P1 Android host check passed
```

同时回归：

```sh
npm run check:phase0
```

预期结果：

```text
Phase 0 check passed
```

## 审查结论

- Notify 订阅没有在 GATT connected 时提前宣告成功，必须等两个 CCCD 写入完成。
- 写队列只保留一个 active write，下一笔写入由 `onCharacteristicWrite` 或超时释放。
- `closeGatt()` 会清理 notify 状态、characteristic cache、写队列和 session generation。
- GATT callback 持有创建时 generation，避免旧连接的 descriptor/write/notify 回调污染新连接。
- 当前阶段只记录 notify payload 长度，不把音频 payload 写入诊断日志。

## 待真机验证

当前环境未运行 HBuilderX/UTS Android 编译，也未连接 Android 真机。后续需要在 HBuilderX 中验证：

- Android UTS 编译通过。
- 两个 CCCD 写入均返回 `BluetoothGatt.GATT_SUCCESS`。
- no-response 写入在目标 Android 机型上是否稳定触发 `onCharacteristicWrite`。
- 主动断开、超时和快速重连时不会出现旧 callback 误触发。
- communication notify 能收到控制协议响应。
- record notify 能收到录音协议响应或音频帧。
