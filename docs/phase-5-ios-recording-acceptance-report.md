# Phase 5 iOS Recording Acceptance Report

状态：已完成 iOS 实时录音协议第一切片，WAV/MP3 decoder 和真机验收待后续 P5 切片。

## 本轮范围

- iOS `app-ios/index.uts` 接入实时录音协议：
  - `startRecording` 按 scene 生成 `0xXX81` 启动命令。
  - `stopRecording` 生成 `0x0081` 停止命令。
  - 解析 `0x1280` 启动响应和 `0x0080` 停止响应。
  - record notify 分发到录音协议解析器。
  - OPUS notify 按 `frameLen + opusConfig + dataIndex + payload` 切帧。
  - 统计 frameCount、durationMs、lostFrames、outOfOrderFrames、badFrames。
  - 在 App 私有目录 `oleap-recordings` 下落盘 `.opusraw` 和 `.oleapframes`。
  - 通过 `onRecordingProgress` 上报节流后的录音进度。
- iOS decoder 边界：
  - 停止录音会关闭文件句柄并保留临时 OPUS 文件。
  - 请求 WAV/MP3 输出时返回 `ios_audio_decode_not_ready`。
  - 错误详情包含 `opusRawPath` 和 `framesPath`，用于后续 decoder 切片和真机排障。

## 验收命令

```sh
npm run check:p5-ios
```

## 风险与边界

- 当前切片不生成可播放 WAV/MP3。
- `FileHandle`、`FileManager`、`UTSiOS.getDataPath()` 需要 HBuilderX iOS 真机编译验证。
- 下一切片应优先接入 iOS OPUS decoder/WAV writer，让 `stopRecording({ format: 'wav' })` 返回可播放文件。
