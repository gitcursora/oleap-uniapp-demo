# Oleap UniApp Demo

普通 `uni-app` 教学 Demo，配套 `uni_modules/oleap-ble-sdk` UTS 插件骨架。

当前状态：

- Phase 0 已实现：项目基线、SDK facade、UTS 插件骨架、mock mode、fixture 目录、静态验收脚本。
- P1 Android 已完成：权限、蓝牙状态、扫描、停止扫描、Oleap 设备过滤、GATT 连接、服务发现、characteristic cache、notify 订阅、写队列和 generation 防护已写入 UTS 平台层。
- P2 Android 已推进：控制协议 CRC/frame/DP 编解码、事务队列、主动上报 ACK、电量/SN/EQ/版本等设备 API 已接入 UTS 平台层。
- P3 Android 已推进：实时录音 start/stop、响应解析、OPUS notify 帧切分、丢包统计、`.opusraw`/`.oleapframes` 落盘、WAV/MP3 finalize 和录音进度已接入 UTS 平台层。
- Demo 页面已支持 Mock/Native 运行模式切换，默认使用 mock mode，可在没有耳机的情况下跑通页面和 API 调用链。
- 录音页已补齐场景选择、WAV/MP3 输出选择、录音统计、解码进度、文件路径复制和转写入口。
- P4 Android 已推进：Flash 文件数量/信息/下载/停止/安全删除、离线 OPUS 落盘和 WAV/MP3 finalize 已接入 UTS 平台层。
- iOS 原生 BLE 在后续 Phase 实现。

检查：

```sh
npm run check:phase0
npm run check:p1-android
npm run check:p2-control
npm run check:p3-recording
npm run check:p3-demo
npm run check:p4-flash
```

入口：

- `pages/index/index.vue`
- SDK facade：`uni_modules/oleap-ble-sdk/index.js`
- UTS interface：`uni_modules/oleap-ble-sdk/utssdk/interface.uts`
