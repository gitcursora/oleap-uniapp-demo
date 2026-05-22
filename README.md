# Oleap UniApp Demo

普通 `uni-app` 教学 Demo，配套 `uni_modules/oleap-ble-sdk` UTS 插件骨架。

当前状态：

- Phase 0 已实现：项目基线、SDK facade、UTS 插件骨架、mock mode、fixture 目录、静态验收脚本。
- P1 Android 已推进：权限、蓝牙状态、扫描、停止扫描、Oleap 设备过滤、GATT 连接、服务发现和 characteristic cache 已写入 UTS 平台层。
- 默认使用 mock mode，可在没有耳机的情况下跑通页面和 API 调用链。
- Android notify 订阅、iOS 原生 BLE 和 OPUS 解码在后续 Phase 实现。

检查：

```sh
npm run check:phase0
npm run check:p1-android
```

入口：

- `pages/index/index.vue`
- SDK facade：`uni_modules/oleap-ble-sdk/index.js`
- UTS interface：`uni_modules/oleap-ble-sdk/utssdk/interface.uts`
