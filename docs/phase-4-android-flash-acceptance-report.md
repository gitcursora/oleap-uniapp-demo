# Phase 4 Android Flash Acceptance Report

状态：已完成 Android UTS 离线 Flash 文件协议第一版，真机验收待 HBuilderX 构建与耳机实测。

## 本轮范围

- 实现 Flash 文件管理指令 codec：
  - 获取文件数量 `0x0182`。
  - 获取文件信息 `0x0282`。
  - 连续下载文件数据 `0x0382`。
  - 删除文件 `0x0482`。
  - 停止传输 `0x1382`。
- 实现 Flash 响应解析：
  - 文件数量与起始文件 ID。
  - 32B 文件头。
  - 动态长度下载 chunk。
  - 删除状态与新的队首文件 ID。
- 实现 Flash transfer session：
  - 复用实时录音 OPUS 帧切分、丢包/坏帧统计、`.opusraw`/`.oleapframes` 落盘。
  - 下载完成后复用 Android decoder 输出 WAV/MP3。
  - 处理 `0xFEFEFEFE` 读取错误和 `0xFFFFFFFF` 文件不存在。
  - 文件数据帧间隔 5 秒超时，超时后发送停止传输。
- 实现安全删除：
  - `deleteAfterSuccess=true` 时先确认目标 fileId 是当前队首。
  - 非队首删除返回 `flash_delete_order_violation`，不向设备发送删除命令。
- Demo Flash 页接入：
  - WAV/MP3 输出选择。
  - 下载后删除队首开关。
  - 下载进度、帧数、坏帧、文件路径展示。
  - 复制路径和转写入口。

## 验收命令

```sh
npm run check:phase0
npm run check:p1-android
npm run check:p2-control
npm run check:p3-recording
npm run check:p3-demo
npm run check:p4-flash
```

## 风险与边界

- 当前文件 ID 枚举采用 `fileStartId + index` 的连续策略，并限制单次最多查询 64 个文件；若真机出现 fileId 不连续，需要在下一轮加入连续 miss fallback。
- 响应 CRC 目前解析并保留，不强制拒绝 CRC 不匹配，以兼容已有历史实现；命令 CRC 已按协议从参数长度字段开始计算。
- Flash 下载仍需要真机验证大文件传输稳定性、停止传输、删除队首和 WAV/MP3 可播放性。
- iOS native Flash 仍待后续 Phase。
