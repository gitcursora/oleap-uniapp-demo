# Phase 3 Android Recording Acceptance Report

日期：2026-05-22

## 范围

已实现：

- Android 录音 start/stop 命令 codec：命令字大端、参数长度小端。
- 录音启动响应 `0x1280` 和停止响应 `0x0080` 解析。
- `meeting/call/media/ambient` 录音场景映射。
- realtime OPUS notify 单帧和多帧 splitter。
- OPUS 配置解析：bitrate、channels、frame time。
- 基于 `dataIndex` 的丢包和乱序统计。
- realtime recording session 状态机：start pending、active、stop pending、断连清理。
- OPUS payload 流式写入 `*.opusraw`。
- 带 4B 帧头的诊断帧流式写入 `*.oleapframes`。
- `onRecordingProgress` 发布实时帧数、时长、丢包、坏帧统计。
- `getDiagnostics()` 增加录音 active/pending 快照。

刻意未伪装完成：

- Android libopus bridge 尚未集成。
- WAV/MP3 finalize 尚未实现。
- `stopRecording({ format: 'wav' })` 收到停止响应并关闭临时文件后，会返回 `opus_decode_unsupported`，错误详情保留 `opusRawPath`、`framesPath` 和统计信息，避免把 OPUS 临时文件伪装成 WAV 成功。

## 验收命令

```sh
npm run check:p3-recording
```

预期结果：

```text
P3 Android recording check passed
```

同时回归：

```sh
npm run check:phase0
npm run check:p1-android
npm run check:p2-control
```

预期结果：

```text
Phase 0 check passed
P1 Android host check passed
P2 Android control check passed
```

## 审查结论

- 录音 API 继续走 SDK facade，页面层不接触 BLE UUID 或原始 characteristic。
- 录音命令复用已有 record 写队列，避免并发写 characteristic 的副作用。
- notify 解析只记录长度、帧数和统计，不把音频 payload 写入诊断日志。
- 断连时会关闭文件流、取消 pending recording command，并清理 active session。
- decoder 缺失时明确失败并保留 OPUS 文件，后续 P3-6/P3-7 可在同一 finalize 点接入 libopus 和 WAV writer。

## 待真机验证

当前环境未运行 HBuilderX/UTS Android 编译，也未连接 Android 真机。后续需要在 HBuilderX 中验证：

- Android UTS 编译通过，`FileOutputStream` 和 BLE callback 类型可用。
- 真实设备启动会议录音后返回 `0x1280` 成功响应。
- 连续收到 OPUS notify，并写入 App 私有缓存目录。
- 停止录音返回 `0x0080` 后关闭文件流。
- 断连、超时、快速重连不会留下旧 session 或未关闭文件流。
- 集成 libopus 后，`stopRecording({ format: 'wav' })` 返回可播放 WAV。
