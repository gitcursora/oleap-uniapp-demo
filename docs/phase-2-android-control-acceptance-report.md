# Phase 2 Android Control Acceptance Report

日期：2026-05-22

## 范围

已实现：

- 控制通道 CRC32，覆盖 Payload。
- 控制帧 encode/decode：`SYNC=99 EC`、`MsgType=B2`、`DataLen`、可选 CRC。
- 控制 Payload encode/decode：`SendSN`、`AskSN`、`CMD`。
- DP TLV encode/decode：`Dp_id`、`Dp_type`、`Dp_len`、`Dp_data`。
- Android communication notify 分发到控制协议解析。
- 单 active control transaction 队列。
- 查询/写入事务超时，默认 3 秒，最多 3 次。
- 设备主动上报 `CMD=0x11` 后发送 ACK。
- `onDpReport` 发布主动上报、查询响应和写入回滚事件。
- Android `getBattery`、`getSn`、`getDeviceName`、版本、EQ、录音状态、Flash 容量、同步时间 API 接入控制协议。

未实现：

- 专家层 `queryDp/writeDp/getKnownDpSnapshot` 公开 API。
- 更完整的 DP schema 访问控制。
- 控制协议真机回归。
- 实时录音真机回归。
- Flash 文件传输协议。
- iOS 控制协议。

## 验收命令

```sh
npm run check:p2-control
```

预期结果：

```text
P2 Android control check passed
```

同时回归：

```sh
npm run check:phase0
npm run check:p1-android
```

预期结果：

```text
Phase 0 check passed
P1 Android host check passed
```

## 审查结论

- 控制协议没有暴露原始 BLE characteristic 给学生层。
- `getBattery/getSn/getEqMode` 等 API 只依赖 DP 语义。
- BLE 写队列仍是唯一底层写入口，控制 ACK 和事务写入不会并发写 characteristic。
- 断开连接会取消 active/queued control transaction 并清空 DP snapshot。
- 诊断日志只记录控制事件、DP ID 和长度，不记录大块 payload。

## 待真机验证

当前环境未运行 HBuilderX/UTS Android 编译，也未连接 Android 真机。后续需要在 HBuilderX 中验证：

- Android UTS 编译通过。
- `getBattery/getSn/getEqMode` 在真实 Oleap 设备上返回。
- `setEqMode` 成功响应和拒绝回滚路径。
- 设备主动上报触发 `onDpReport` 并收到 ACK。
- 断连、超时、快速重连不会留下旧事务。
