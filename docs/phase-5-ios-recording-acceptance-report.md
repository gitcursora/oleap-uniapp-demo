# Phase 5 iOS Recording Acceptance Report

状态：已完成 iOS 实时录音协议和 WAV/MP3 decoder 第一切片，真机可播放验收待 HBuilderX iOS 构建与 Oleap 耳机实测。

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
- iOS decoder：
  - 已内置 `OpusDecoder.framework`。
  - 停止录音会关闭文件句柄并调用 `opus2wav` / `opus2mp3`。
  - decoder 返回负值时返回 `opus_decode_failed`。
  - 输出文件为空或过小时返回 `opus_decode_empty_output`。
  - 成功返回 `filePath`、`format`、`size`、`opusRawPath` 和 `framesPath`。

## 验收命令

```sh
npm run check:p5-ios
```

## 风险与边界

- 当前切片已接入 WAV/MP3 decoder，但尚未经过 HBuilderX iOS 真机编译和耳机实录可播放验证。
- `FileHandle`、`FileManager`、`UTSiOS.getDataPath()`、`OpusDecoder.framework` 链接需要 HBuilderX iOS 真机编译验证。
- 下一切片应推进 iOS Flash 下载，复用当前 decoder 输出 WAV/MP3。
