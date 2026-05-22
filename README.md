# Oleap UniApp Demo

普通 `uni-app` 教学 Demo，配套 `uni_modules/oleap-ble-sdk` UTS 插件骨架。

当前状态：

- Phase 0 已实现：项目基线、SDK facade、UTS 插件骨架、mock mode、fixture 目录、静态验收脚本。
- 默认使用 mock mode，可在没有耳机的情况下跑通页面和 API 调用链。
- Android/iOS 原生 BLE 和 OPUS 解码在后续 Phase 实现。

检查：

```sh
npm run check:phase0
```

入口：

- `pages/index/index.vue`
- SDK facade：`uni_modules/oleap-ble-sdk/index.js`
- UTS interface：`uni_modules/oleap-ble-sdk/utssdk/interface.uts`

