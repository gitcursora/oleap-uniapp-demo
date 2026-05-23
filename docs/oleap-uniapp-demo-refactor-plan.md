# Oleap UniApp Demo Refactor Plan

状态：v1.0，可实施  
目标项目：`oleap-uniapp-demo`  
目标范围：Demo 页面层横切逻辑收敛，不修改 UTS native 协议实现  
当前背景：BLE 链路已稳定，页面中重复出现 `OleapBle.init({ logLevel: 'debug' })`、`safeRun`、订阅释放、诊断刷新等样板代码，需要在不影响真机链路的前提下提升代码专业度和可维护性。

## 1. 目标

本次收敛的目标不是重写 Demo，也不是改变 SDK 能力，而是把页面层的重复横切逻辑沉淀成稳定工具，让页面更像业务页面。

具体目标：

- 页面不再直接重复调用 `OleapBle.init({ logLevel: 'debug' })`，改为统一的 `ensureOleapReady()`。
- 页面不再各自实现 `safeRun`，改为统一的 `runOleapAction()`。
- 页面不再各自手写订阅清理循环，改为统一的 `registerOleapDisposers()` 和 `disposeOleapDisposers()`。
- 诊断刷新、诊断格式化、时间格式化等工具统一复用。
- 保持首页、设备页、实时录音页、Flash 页现有交互和状态语义不变。
- 静态检查脚本同步调整，检查新的收敛结构，而不是继续锁死旧的重复写法。

## 2. 非目标

本次不做以下事情：

- 不修改 `uni_modules/oleap-ble-sdk/utssdk/app-android/index.uts`。
- 不修改 `uni_modules/oleap-ble-sdk/utssdk/app-ios/index.uts`。
- 不改变 `uni_modules/oleap-ble-sdk/index.js` 对外 API。
- 不改变设备扫描、自动连接、控制协议、录音协议、Flash 下载协议行为。
- 不引入全局 Vue mixin。
- 不引入 Pinia、Vuex 或新的状态管理框架。
- 不把页面业务逻辑搬进工具函数。
- 不删除教学必要的显式代码，例如页面仍然应该看得出“订阅了哪些事件”。

## 3. 当前重复点

当前重复主要来自四类代码。

### 3.1 SDK 初始化

重复位置：

- `pages/index/index.vue`
- `pages/device/device.vue`
- `pages/record/record.vue`
- `pages/flash/flash.vue`

当前模式：

```js
await OleapBle.init({ logLevel: 'debug' })
```

问题：

- 每个页面都写同一段初始化。
- 学生容易误以为每次进入页面都必须重新初始化 native。
- 后续如果要调整日志级别，需要改多个页面。

保留原因：

- 现在写法安全，页面可被直接进入。
- `OleapBle.init()` 是幂等低成本操作。

收敛方向：

- 新增 `ensureOleapReady()`，内部缓存初始化 Promise。
- 初始化失败时清空缓存，允许用户修复环境后重试。
- 页面只调用 `await ensureOleapReady()`。

### 3.2 错误收口

重复位置：

- `pages/index/index.vue`
- `pages/device/device.vue`
- `pages/record/record.vue`
- `pages/flash/flash.vue`

当前模式：

```js
async safeRun(action) {
  try {
    this.error = ''
    await action()
  } catch (error) {
    this.error = formatSdkError(error) || '操作失败'
  }
}
```

问题：

- 各页面实现略有差异。
- 首页有 `busy` 锁，录音页和 Flash 页有手动 `busy` 控制，容易产生不一致。
- 后续如果要统一 toast、诊断刷新或错误埋点，需要改多处。

收敛方向：

- 新增 `runOleapAction(page, action, options)`。
- 支持可选 `busyKey`，首页可继续使用 `busy` 防重复点击。
- 支持可选 `after`，设备页和录音页可在 finally 中刷新诊断。
- 默认把错误写入 `page.error`。
- 默认吞掉错误，保持当前页面按钮行为；需要继续抛错时显式传 `rethrow: true`。

### 3.3 订阅释放

重复位置：

- 首页的 `disposeSubscriptions()`
- 设备页的 `disposeSubscriptions()`
- 录音页的 `disposeSubscriptions()`
- Flash 页的 `onUnload()` 内联释放循环

当前模式：

```js
const disposers = this.disposers.splice(0)
disposers.forEach((dispose) => {
  if (typeof dispose !== 'function') {
    return
  }
  try {
    dispose()
  } catch (error) {}
})
```

问题：

- 重复。
- Flash 页写法和其他页面不一致。
- 后续如果要统计未释放订阅或调试重复订阅，需要改多处。

收敛方向：

- 新增 `registerOleapDisposers(page, ...disposers)`。
- 新增 `disposeOleapDisposers(page)`。
- 页面仍然显式写出订阅内容，但不再手写释放循环。

### 3.4 诊断与格式化

重复位置：

- 设备页和录音页都有 `refreshDiagnostics()`。
- 设备页和录音页都有 `shortTime()`、`stringifyDetails()`。
- 诊断复制逻辑重复。

收敛方向：

- 新增 `refreshOleapDiagnostics(page, options)`。
- 新增 `shortTime(value)`。
- 新增 `stringifyDetails(value)`。
- 新增 `copyOleapDiagnostics(diagnostics)`。

## 4. 建议新增工具文件

新增文件：

```text
utils/oleap-page-runtime.js
```

职责边界：

- 只处理页面横切能力。
- 不持有业务状态。
- 不自动扫描。
- 不自动连接。
- 不自动启动或停止录音。
- 不理解 Flash 文件业务规则。

建议导出：

```js
import { OleapBle } from '@/uni_modules/oleap-ble-sdk/index.js'
import { formatSdkError } from '@/utils/demo-runtime.js'

const DEFAULT_LOG_LEVEL = 'debug'

let readyPromise = null

export function ensureOleapReady(options = {}) {}

export async function runOleapAction(page, action, options = {}) {}

export function registerOleapDisposers(page, ...disposers) {}

export function disposeOleapDisposers(page) {}

export function refreshOleapDiagnostics(page, options = {}) {}

export function copyOleapDiagnostics(diagnostics) {}

export function shortTime(value) {}

export function stringifyDetails(value) {}
```

### 4.1 ensureOleapReady

设计：

```js
export function ensureOleapReady(options = {}) {
  if (!readyPromise) {
    readyPromise = OleapBle.init({
      logLevel: options.logLevel || DEFAULT_LOG_LEVEL
    }).catch((error) => {
      readyPromise = null
      throw error
    })
  }
  return readyPromise
}
```

关键点：

- 缓存 Promise，避免同一进程内重复初始化噪音。
- 初始化失败后重置缓存，避免失败状态永久卡住。
- 不在模块顶层直接调用，避免 App runtime 未就绪时提前触发 native adapter。

### 4.2 runOleapAction

建议签名：

```js
export async function runOleapAction(page, action, options = {}) {
  const {
    errorKey = 'error',
    busyKey = '',
    skipWhenBusy = true,
    after = null,
    rethrow = false
  } = options

  if (busyKey && skipWhenBusy && page[busyKey]) {
    return
  }

  try {
    if (busyKey) {
      page[busyKey] = true
    }
    if (errorKey) {
      page[errorKey] = ''
    }
    return await action()
  } catch (error) {
    if (errorKey) {
      page[errorKey] = formatSdkError(error) || '操作失败'
    }
    if (rethrow) {
      throw error
    }
    return null
  } finally {
    if (typeof after === 'function') {
      after()
    }
    if (busyKey) {
      page[busyKey] = false
    }
  }
}
```

关键点：

- 首页继续通过 `busyKey: 'busy'` 防重复点击。
- 录音页和 Flash 页如果有更细的 `busy` 生命周期，可以不使用 `busyKey`，保留页面内部业务控制。
- `after` 用于刷新诊断，不把诊断逻辑硬编码到所有页面。
- 默认不抛出错误，保持当前页面体验。

### 4.3 订阅工具

建议实现：

```js
export function registerOleapDisposers(page, ...disposers) {
  if (!Array.isArray(page.disposers)) {
    page.disposers = []
  }
  page.disposers.push(...disposers.filter((dispose) => typeof dispose === 'function'))
}

export function disposeOleapDisposers(page) {
  const disposers = Array.isArray(page.disposers) ? page.disposers.splice(0) : []
  disposers.forEach((dispose) => {
    try {
      dispose()
    } catch (error) {}
  })
}
```

关键点：

- 过滤非函数，避免 native adapter 返回异常值时影响页面卸载。
- 释放时使用 `splice(0)`，确保重复调用安全。
- 不在工具里自动订阅任何事件。

### 4.4 诊断工具

建议实现：

```js
export function refreshOleapDiagnostics(page, options = {}) {
  try {
    if (options.connectionKey !== false) {
      page[options.connectionKey || 'connection'] = OleapBle.getConnectionState()
    }
    if (options.diagnosticsKey !== false) {
      page[options.diagnosticsKey || 'diagnostics'] = OleapBle.getDiagnostics() || { events: [] }
    }
  } catch (error) {}
}
```

关键点：

- 设备页和录音页使用默认 `connection` / `diagnostics`。
- 首页只需要连接状态时，可继续保留自己的 `applyConnectionState()`，不用强行迁移。
- Flash 页当前没有诊断面板，暂不强行引入诊断刷新。

## 5. 分阶段实施计划

### P0 基线确认

目标：

- 确认当前提交是稳定基线。
- 确认 refactor 前后的行为可比较。

操作：

```sh
git status --short
git log --oneline -1
git diff --check
npm run check:phase0
npm run check:p1-android
npm run check:p2-control
npm run check:p3-recording
npm run check:p3-demo
npm run check:p4-flash
npm run check:p5-ios
```

验收：

- 工作区从干净基线开始。
- 所有静态检查通过。

### P1 新增页面 runtime 工具

目标：

- 新增 `utils/oleap-page-runtime.js`。
- 不迁移任何页面。
- 只增加可复用工具和必要的静态检查。

文件：

- 新增 `utils/oleap-page-runtime.js`
- 修改 `scripts/check-phase0.mjs`
- 修改 `scripts/check-p3-demo.mjs`

检查脚本新增断言：

- `utils/oleap-page-runtime.js` 存在。
- 包含 `ensureOleapReady`。
- 包含 `runOleapAction`。
- 包含 `registerOleapDisposers`。
- 包含 `disposeOleapDisposers`。
- 包含 `refreshOleapDiagnostics`。

验收：

```sh
git diff --check
npm run check:phase0
npm run check:p3-demo
```

副作用控制：

- P1 不改页面，真机行为必然不变。

### P2 迁移 Flash 页

优先迁移 Flash 页，因为它最小、重复点最集中。

目标：

- 删除 `pages/flash/flash.vue` 中的本地 `safeRun`。
- 删除手写订阅释放循环。
- 使用 `ensureOleapReady()`。
- 使用 `runOleapAction()`。
- 使用 `registerOleapDisposers()` 和 `disposeOleapDisposers()`。

预期页面变化：

```js
import {
  ensureOleapReady,
  runOleapAction,
  registerOleapDisposers,
  disposeOleapDisposers
} from '@/utils/oleap-page-runtime.js'
```

```js
async onLoad() {
  await runOleapAction(this, async () => {
    await ensureOleapReady()
    registerOleapDisposers(
      this,
      OleapBle.onRecordingProgress((event) => {
        if (!event.flash) return
        this.progress = event.progress || 0
        this.frameCount = event.frameCount || this.frameCount
        this.badFrames = event.badFrames || 0
      })
    )
  })
  await this.loadFiles()
},
onUnload() {
  disposeOleapDisposers(this)
}
```

验收：

- Flash 页不再包含 `async safeRun(action)`。
- Flash 页不再直接包含 `OleapBle.init({ logLevel: 'debug' })`。
- Flash 页仍然保留 `onUnload()`。
- Flash 页仍然保留 `OleapBle.onRecordingProgress`，教学上能看出它监听了下载进度。
- `npm run check:p4-flash` 通过。

副作用控制：

- 不改变下载按钮、停止按钮、复制路径、转写入口。
- 不改变 `busy` 的设置位置，避免下载中状态出现抖动。

### P3 迁移 Device 页

目标：

- 删除本地 `safeRun`。
- 删除本地 `disposeSubscriptions`。
- 使用 `refreshOleapDiagnostics()`。
- 使用 `shortTime()` 和 `stringifyDetails()` 工具。

验收：

- 设备页不再包含 `async safeRun(action)`。
- 设备页不再包含本地 `disposeSubscriptions()`。
- 设备页仍然保留 `OleapBle.onDpReport`，教学上能看出 DP 上报来源。
- `refresh()` 仍然按原顺序查询电量、SN、名称、固件、硬件、EQ、录音状态、Flash 容量。
- `npm run check:p2-control` 和 `npm run check:p3-demo` 通过。

副作用控制：

- 不改变设备信息字段结构。
- 不改变 EQ 切换逻辑。
- 不改变诊断面板展示内容。

### P4 迁移 Record 页

目标：

- 删除本地 `safeRun`。
- 删除本地 `disposeSubscriptions`。
- 使用 `refreshOleapDiagnostics()`。
- 使用 `shortTime()` 和 `stringifyDetails()`。
- 保留录音 start/stop 内部 `busy` 业务控制。

验收：

- 录音页不再包含 `async safeRun(action)`。
- 录音页不再直接包含 `OleapBle.init({ logLevel: 'debug' })`。
- 录音页仍然显式订阅 `onConnectionChanged`、`onRecordingProgress`、`onDecodeProgress`、`onError`。
- `shouldClearActiveAfterStopError()` 行为不变。
- `npm run check:p3-recording` 和 `npm run check:p3-demo` 通过。

副作用控制：

- 不改变录音场景、输出格式、解码进度、文件路径、转写入口。
- 不把录音错误恢复逻辑放进通用工具，避免隐藏业务语义。

### P5 迁移首页

首页状态最复杂，最后迁移。

目标：

- 删除本地 `safeRun`。
- 删除本地 `disposeSubscriptions`。
- 使用 `ensureOleapReady()`。
- 使用 `runOleapAction(this, action, { busyKey: 'busy' })` 保持防重复点击。
- 使用 `registerOleapDisposers()` 和 `disposeOleapDisposers()`。

验收：

- 首页不再包含 `async safeRun(action)`。
- 首页不再直接包含 `OleapBle.init({ logLevel: 'debug' })`。
- 首页仍然保留 `initializeSdk`、`installSubscriptions`、`bootstrapKnownDevices`，避免业务流程被工具函数吞掉。
- 首页仍然保留 `clearScanTimer()`。
- 首页扫描、已知设备自动连接、上次设备连接、连接态展示不变。
- `npm run check:phase0` 和 `npm run check:p3-demo` 通过。

副作用控制：

- `runOleapAction` 只替代错误和 busy 外壳，不改变 `scan()` 的内部 try/catch fallback。
- 不把自动连接逻辑下沉到工具函数。
- 不改变本地 `events` 最近事件列表。

### P6 更新文档和示例

目标：

- 更新 `README.md` 中 API 示例，避免继续教学生每页手写 `safeRun`。
- 更新 `docs/oleap-uniapp-sdk-api.md` 中导入和页面模板示例。
- 更新测试计划，说明页面 runtime 收敛后的检查项。

文档重点：

- 说明页面层推荐使用 `ensureOleapReady()`。
- 说明 `runOleapAction()` 是 Demo 层工具，不是 SDK API。
- 说明 SDK API 仍然从 `OleapBle` 调用。

验收：

- README 不再把本地 `safeRun` 当成推荐模板。
- API 文档区分 SDK API 和 Demo runtime 工具。

### P7 全量验证

静态验证：

```sh
git diff --check
npm run check:phase0
npm run check:p1-android
npm run check:p2-control
npm run check:p3-recording
npm run check:p3-demo
npm run check:p4-flash
npm run check:p5-ios
```

结构验证：

```sh
rg "async safeRun\\(" pages
rg "OleapBle\\.init\\(" pages
rg "disposeSubscriptions\\(" pages
rg "formatSdkError" pages
```

期望：

- `rg "async safeRun\\(" pages` 无结果。
- `rg "OleapBle\\.init\\(" pages` 无结果。
- `rg "disposeSubscriptions\\(" pages` 无结果。
- `rg "formatSdkError" pages` 无结果或只存在业务明确需要的地方；错误格式化应主要集中在 runtime 工具。

真机 smoke：

1. 冷启动 App，首页能进入。
2. 点击授权，权限状态正确刷新。
3. 点击扫描，能看到 Oleap 设备。
4. 点击设备，连接成功，首页显示设备 ID。
5. 进入设备状态页，能读取电量、SN、版本、EQ。
6. 在设备状态页来回进入 3 次，DP 上报不重复显示多份。
7. 进入实时录音页，开始录音、结束录音，生成 WAV 路径。
8. 实时录音页来回进入 3 次，录音进度事件不重复。
9. 进入 Flash 页，刷新列表、下载文件、复制路径。
10. Flash 页来回进入 3 次，下载进度事件不重复。
11. 任意页面断开耳机后，错误展示为页面文案，不出现 Unhandled Promise Rejection。

## 6. 代码风格约束

- 页面仍使用 Options API，不引入 Composition API 大迁移。
- 不使用全局 mixin，避免生命周期来源不透明。
- 工具函数必须是小函数，避免出现“万能 page manager”。
- 工具函数不得主动调用扫描、连接、录音、Flash 下载。
- 页面业务方法名保持稳定，降低教学讲解成本。
- 每个阶段只改一类页面或一类工具，方便回滚。

## 7. 风险与规避

### 风险 1：过度抽象让学生看不懂

规避：

- 只抽横切逻辑，不抽业务逻辑。
- 页面里仍然保留 `OleapBle.onXxx` 和 `OleapBle.xxx()` 业务调用。
- README 中说明 runtime 工具只是 Demo 层辅助，不是硬件 SDK。

### 风险 2：首页 busy 语义被改变

规避：

- `runOleapAction` 支持 `busyKey`。
- 首页迁移最后做。
- 首页 `scan()` 的内部 fallback 不动。

### 风险 3：录音页 stop 失败恢复行为被吞掉

规避：

- 保留 `shouldClearActiveAfterStopError()`。
- `runOleapAction` 不理解录音业务错误。
- 录音页 start/stop 的内部 `try/finally` 保留。

### 风险 4：订阅释放迁移后出现重复事件

规避：

- 每个页面 `installSubscriptions()` 前先调用 `disposeOleapDisposers(this)`。
- 真机 smoke 加入“页面来回进入 3 次”的事件重复检查。

### 风险 5：静态检查锁定旧写法导致误报

规避：

- P1 先更新检查脚本，让脚本识别新 runtime。
- 页面迁移时同步更新对应检查项。

## 8. 推荐提交策略

建议分 3 个提交，降低回滚成本。

### Commit 1

```text
refactor(BLE): add uni-app page runtime helpers
```

内容：

- 新增 `utils/oleap-page-runtime.js`。
- 更新最小静态检查。

### Commit 2

```text
refactor(BLE): consolidate secondary demo pages
```

内容：

- 迁移 Flash 页。
- 迁移 Device 页。
- 迁移 Record 页。
- 更新相关检查。

### Commit 3

```text
refactor(BLE): consolidate home page runtime flow
```

内容：

- 迁移首页。
- 更新 README、API 文档和测试计划。
- 全量检查通过。

如果希望一次性提交，也应至少按 P1 到 P7 顺序实施和验证，不建议边改首页边改其他页面。

## 9. 迭代审查记录

### 审查 1：是否应该用 Vue mixin

结论：不使用。

原因：

- mixin 会隐藏生命周期和方法来源，不利于教学。
- 页面里已有 Options API，显式导入工具函数更容易理解。
- mixin 可能和页面本地 `data`、`methods` 命名冲突。

调整：

- 采用 `utils/oleap-page-runtime.js` 的纯函数工具。

### 审查 2：是否应该把自动连接也抽走

结论：不抽。

原因：

- 自动连接是首页业务逻辑，不是横切逻辑。
- 抽走后学生更难理解“扫描结果如何变成连接”。
- 自动连接涉及上次设备、已知设备、扫描结果优先级，不适合放进通用工具。

调整：

- 首页保留 `bootstrapKnownDevices()`、`preferredDevice()`、`autoConnectDevice()`。

### 审查 3：是否应该把录音 start/stop 的 busy 全部交给通用工具

结论：不完全交给工具。

原因：

- 录音页有 `active`、`busy`、`decode.phase`、失败后清理状态等业务语义。
- 通用工具只负责错误收口，不应该理解录音状态机。

调整：

- 录音页保留 start/stop 内部 `try/finally`。
- `runOleapAction` 在录音页不强制使用 `busyKey`。

### 审查 4：验收标准是否足够具体

结论：初稿不够具体，已补充。

补充内容：

- 增加 `rg` 结构验证命令。
- 增加真机 smoke 11 项。
- 增加每阶段可验收条件。
- 增加提交拆分建议。

## 10. 最终可落地结论

本计划可落地，建议按 `P0 -> P1 -> P2 -> P3 -> P4 -> P5 -> P6 -> P7` 顺序执行。

核心原则：

- 只抽横切逻辑。
- 不动 native。
- 不改 SDK API。
- 不改变页面业务行为。
- 每迁移一个页面就跑对应检查。
- 最后必须做 Android 真机 smoke，重点看重复订阅和错误展示。
