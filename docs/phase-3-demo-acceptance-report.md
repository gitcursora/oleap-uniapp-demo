# Phase 3 Demo Workflow Acceptance Report

状态：已完成离线可验收版本，真机验收待 HBuilderX 构建与耳机实测。

## 本轮范围

- SDK JS facade 切换为 native-only 代理：
  - 在 App 运行环境中加载 UTS native adapter。
  - 订阅、同步状态和诊断 API 均直接分派到 native adapter。
- 首页移除 Mock/Native 模式切换，保留授权、扫描、已知设备快速连接和当前设备 ID 展示。
- 设备页、录音页、Flash 页统一走 native adapter。
- 录音页补齐课堂交付主流程：
  - 录音场景选择。
  - WAV/MP3 输出选择。
  - 录音时长、帧数、帧长、采样、丢包、乱序、坏帧展示。
  - 解码阶段与进度展示，兼容 `0..1` 与 `0..100` 两种进度。
  - 输出文件路径、大小、复制路径和转写入口。
  - SDK 错误码与 decoder 细节可见。

## 验收命令

```sh
npm run check:phase0
npm run check:p1-android
npm run check:p2-control
npm run check:p3-recording
npm run check:p3-demo
```

## 风险与边界

- `manifest.json` 由 HBuilderX 生成，本轮不修改、不纳入提交。
- Android native BLE/录音/解码已有静态与 fixture 验收，仍需真机验证 UTS 编译、权限弹窗、连接稳定性和 WAV/MP3 可播放性。
- Flash native 协议已在 P4 接入 Android，仍需真机验证。
- iOS native BLE 当前仍是 unsupported stub。
