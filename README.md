# Oleap UniApp Demo

这是一个面向教学场景的 `uni-app` Demo 项目，目标不是做一个花哨的展示页，而是让学生能真正完成一条“软硬结合”的开发链路：

1. 用 `uni-app` 做前端页面和交互。
2. 用 `UTS` 插件接入 Oleap 耳机 BLE 能力。
3. 完成扫描、连接、设备状态查询、实时录音、Flash 文件下载。
4. 在此基础上继续扩展业务场景，例如：
   - 会议录音转写助手
   - 课堂笔记助手
   - 采访录音整理工具
   - 学习复盘语音助手
   - 巡检记录助手

这份 README 会尽量写得详细，默认读者是第一次接触 `uni-app`、`BLE`、`UTS`、甚至第一次做 App 的同学。

## 1. 先说结论：这个项目是做什么的

你可以把它理解成一套“已经搭好骨架的课堂工程”：

- `pages/` 里是学生能直接看懂、直接改页面的 `uni-app` 页面。
- `uni_modules/oleap-ble-sdk/` 是已经封装好的 SDK。
- SDK 底层通过 `UTS` 连接 Android / iOS 原生蓝牙能力。
- 学生多数情况下不需要先去看懂原生 BLE 细节，也能基于页面和 SDK 做出一个可交付的小应用。

一句话概括：

> 这个项目的核心价值，不是“从 0 手写蓝牙协议”，而是“让学生尽快把耳机能力接到业务场景里”。

## 2. 这不是一个什么项目

为了避免期待错位，也先说清楚它不是什么：

- 它不是生产环境的完整商业 App。
- 它不是给学生练习“从 0 写 BLE 底层”的仓库。
- 它不是 Web/H5 演示项目。
- 它现在默认是 **native-only** 模式，不再提供 mock 模式。

为什么不保留 mock 模式：

- 现在课堂里每位学生都有耳机。
- 继续保留 mock，反而会让初学者误以为“页面能跑就是能力打通了”。
- 教学目标是让学生真正完成“耳机 + App + 业务”的闭环。

## 3. 当前能力边界

### 已具备

- Android：
  - 蓝牙权限处理
  - 蓝牙状态读取
  - 扫描 Oleap 设备
  - GATT 连接
  - 服务发现
  - characteristic 缓存
  - notify 订阅
  - 控制协议查询 / 写入
  - 实时录音 start / stop
  - OPUS 帧落盘
  - WAV / MP3 输出
  - Flash 文件列表 / 下载 / 停止 / 安全删除

- iOS：
  - CoreBluetooth host
  - 控制协议基础能力
  - 实时录音 start / stop
  - OPUS 落盘
  - WAV / MP3 解码

### 还没有完全收口

- iOS Flash 下载链路仍待后续切片完善。
- 转写页目前还是课堂演示入口，不是完整的真实 ASR 后端。
- 学生真正交付的“业务价值”，通常要在此项目基础上继续接后端接口。

### 课堂推荐主线

如果你是老师，建议课堂主线优先走：

1. **Android 真机**
2. `扫描 -> 连接 -> 设备状态 -> 实时录音 -> Flash 下载`
3. 最后再做“转写 / 总结 / 后端交互”

## 4. 你会学到什么

如果你是第一次做类似项目，这个仓库最适合练这几件事：

- 什么是 `uni-app`
- 什么是 `UTS`
- 什么是 BLE
- 什么是扫描、连接、notify、write
- 什么是“设备能力接入”
- 什么是“把底层能力变成业务页面”
- 什么是“前端 + 硬件 + 后端”的组合开发

如果你最后能基于这个仓库做出一个能录音、能拿文件、能发给后端转写、能展示结果的 App，其实已经很接近真实项目开发了。

## 5. 你需要准备什么

## 5.1 软件环境

- `HBuilderX`，建议 `5.x` 稳定版
- `Node.js >= 18`
- `npm`

## 5.2 硬件环境

- 一台 Android 手机
- 一副 Oleap 耳机
- 数据线

## 5.3 为什么优先 Android

因为当前课堂主线里：

- Android 链路更完整
- 实时录音和 Flash 下载验证更适合课堂实操
- 初学者在 Android 上更容易定位权限、扫描、连接问题

## 6. 第一次上手前，先理解 4 个名词

如果你完全是小白，下面这 4 个词先理解就够了。

### 6.1 BLE

BLE 是低功耗蓝牙。
你可以把它理解成：

> 手机和耳机之间的一条“低功耗数据通道”。

它不是拿来直接传大片视频的，它更适合传控制命令、状态数据、短包音频帧。

### 6.2 GATT

GATT 是 BLE 里的一套数据组织方式。
你可以把它粗略理解成：

- `Service`：像一个功能分组
- `Characteristic`：像一个具体字段或接口

这个项目里，你可以简单认为：

- 有一组 characteristic 负责控制协议
- 有一组 characteristic 负责录音协议

### 6.3 notify

notify 的意思是：

> 设备主动把数据推给手机

例如：

- 耳机主动上报电量变化
- 耳机不断推送录音 OPUS 帧

### 6.4 write

write 的意思是：

> 手机把命令写给耳机

例如：

- 查询电量
- 查询 SN
- 启动录音
- 停止录音
- 请求下载 Flash 文件

## 7. 项目结构怎么读

第一次看代码时，建议按下面顺序读：

```text
oleap-uniapp-demo/
├── pages/                                # 页面，学生最常改这里
│   ├── index/                            # 首页：授权、扫描、连接、入口导航
│   ├── device/                           # 设备状态页：电量、SN、版本、EQ
│   ├── record/                           # 实时录音页：开始/结束、WAV/MP3
│   ├── flash/                            # Flash 文件页：列表、下载、删除
│   └── transcript/                       # 转写页：当前是教学占位入口
├── uni_modules/
│   └── oleap-ble-sdk/
│       ├── index.js                      # JS facade，页面通过它调用 SDK
│       └── utssdk/
│           ├── interface.uts             # SDK 对外 API 类型声明
│           ├── app-android/index.uts     # Android 原生 BLE / 协议实现
│           └── app-ios/index.uts         # iOS 原生 BLE / 协议实现
├── utils/
│   └── demo-runtime.js                   # Demo 运行时工具，例如错误格式化
├── docs/                                 # 详细文档
└── scripts/                              # 静态检查脚本
```

### 推荐阅读顺序

如果你是学生：

1. 先读 `pages/index/index.vue`
2. 再读 `pages/device/device.vue`
3. 再读 `pages/record/record.vue`
4. 最后再看 `uni_modules/oleap-ble-sdk/index.js`

如果你一上来就读 `utssdk/app-android/index.uts`，大概率会被 BLE 和协议代码吓到，这很正常。

## 8. 10 分钟快速启动

## 8.1 打开项目

1. 用 HBuilderX 打开 `oleap-uniapp-demo`
2. 确认页面目录、`uni_modules`、`manifest.json` 都能正常显示

## 8.2 本地检查

在项目根目录执行：

```sh
npm run check:phase0
npm run check:p1-android
npm run check:p2-control
npm run check:p3-recording
npm run check:p3-demo
npm run check:p4-flash
npm run check:p5-ios
```

这些脚本不是“业务测试”，而是帮助你快速确认：

- 项目文件是否齐全
- SDK facade 是否还在
- 页面是否还保留必要订阅清理
- Android / iOS / 控制协议 / 录音协议 / Flash 协议的静态结构是否被误改

## 8.3 运行到真机

建议课堂上使用 HBuilderX 的 App 真机运行能力。

### 很重要

如果你修改的是下面这些文件：

- `pages/*.vue`
- `utils/*.js`
- 普通 JS 逻辑

通常可以热更新或重新运行页面。

但是如果你修改的是下面这些文件：

- `uni_modules/oleap-ble-sdk/utssdk/app-android/index.uts`
- `uni_modules/oleap-ble-sdk/utssdk/app-ios/index.uts`
- `uni_modules/oleap-ble-sdk/utssdk/app-android/AndroidManifest.xml`
- 原生 UTS 相关配置

你通常需要：

> **重新打自定义基座，或者至少重新触发原生编译**

这是 uni-app / UTS 开发里一个特别常见、也特别容易让新手困惑的点。

## 9. 首页怎么用

首页路径：

- `pages/index/index.vue`

首页的作用不是“展示”，而是“指挥台”。

你可以把它理解成整个课堂 Demo 的总入口。

### 首页完成的事情

- 检查蓝牙状态
- 请求蓝牙权限
- 扫描附近设备
- 显示扫描结果
- 连接设备
- 显示当前连接设备 ID
- 跳转到设备状态页 / 录音页 / Flash 页 / 转写页

### 学生第一次操作建议

1. 打开首页
2. 点击授权
3. 打开蓝牙
4. 点击扫描
5. 看到设备列表后点击连接
6. 确认首页出现“当前连接”和设备 ID
7. 再进入其他页面

### 首页里几个状态怎么理解

- `蓝牙`：手机系统蓝牙状态 + 权限状态
- `设备`：当前扫描到多少台设备
- `连接`：当前是否已连上耳机

### “当前连接”卡片有什么用

这张卡片很重要，因为它能明确告诉学生：

- 现在到底有没有连上
- 连的是哪一台设备
- 设备 ID 是什么

这能明显降低课堂里“我以为连上了，其实没连上”的误会。

## 10. 设备状态页怎么用

路径：

- `pages/device/device.vue`

这个页面适合做“设备能力是否打通”的第一轮验证。

### 页面会读取什么

- 电量
- SN
- 设备名称
- 固件版本
- 硬件版本
- EQ 状态
- 录音状态
- Flash 容量

### 课堂上的推荐验证顺序

1. 先点“刷新”
2. 看电量是否正常
3. 看 SN 是否正常返回
4. 看版本是否正常返回
5. 点一次“切换 EQ”
6. 再刷新看看 EQ 是否变化

### 如果这里都通了，说明什么

说明至少下面这些东西基本是通的：

- BLE 连接
- 控制协议 write
- 控制协议 notify
- DP 查询
- DP 写入

## 11. 实时录音页怎么用

路径：

- `pages/record/record.vue`

这是课堂里最有“成就感”的页面之一，因为它能直接让学生看到耳机录音能力被接进 App。

### 你可以做什么

- 选择录音场景
- 选择输出格式 `wav` / `mp3`
- 开始录音
- 停止录音
- 查看录音统计
- 查看解码进度
- 复制输出文件路径
- 把文件路径带到转写页

### 场景参数

当前支持：

- `personal`
- `call`
- `media`
- `ambient`

课堂里通常建议先用 `personal`。

### 一个标准录音流程

1. 进入实时录音页
2. 选择 `personal`
3. 选择 `wav`
4. 点击“开始”
5. 等待几秒
6. 点击“结束”
7. 等待解码完成
8. 查看输出文件路径

### 页面上的统计字段是什么意思

- `时长`：录了多久
- `帧数`：收到多少音频帧
- `帧长`：单帧长度
- `采样`：例如 `16000 Hz / 1 ch`
- `丢包`：理论上应该收到但没收到的帧
- `乱序`：到达顺序不对的帧
- `坏帧`：格式不合法或无法正常解析的帧

这些字段对课堂很有帮助，因为它们让学生知道：

> “录音不是一个黑盒按钮，而是一条真正的数据链路。”

## 12. Flash 文件页怎么用

路径：

- `pages/flash/flash.vue`

这个页面对应耳机里的“离线文件”能力。

### 可以做什么

- 拉取 Flash 文件列表
- 下载某个文件
- 停止下载
- 下载成功后复制文件路径
- 可选“下载后删除队首”

### 为什么会有“只能删除队首”

这不是页面随便设计的限制，而是设备协议侧的安全约束。

简单理解：

> 设备端希望文件按顺序消费，避免中间删文件导致状态不一致。

所以课堂上要提醒学生：

- 不是任何文件都能随便删
- `deleteAfterSuccess` 是一种受控删除

## 13. 转写页目前是什么状态

路径：

- `pages/transcript/transcript.vue`

这个页面目前更像一个“业务延展接口”，而不是最终成品。

它当前主要作用是：

- 接收录音页或 Flash 页带过来的文件路径
- 给学生一个“下一步接后端”的入口

如果你是学生，最适合在这里做的事情是：

- 把本地音频路径上传到后端
- 调用转写接口
- 展示转写结果
- 再进一步做摘要、关键词、待办、脑图

## 14. 这套项目的完整数据流

从课堂理解角度，可以把全链路看成这样：

```text
Oleap 耳机
  -> BLE
  -> UTS 原生层
  -> SDK facade
  -> uni-app 页面
  -> 业务逻辑
  -> 后端接口（可选）
  -> 转写 / 总结 / 结果展示
```

如果再细一点：

```text
耳机
  -> 控制协议 / 录音协议 / Flash 协议
  -> Android/iOS UTS
  -> uni_modules/oleap-ble-sdk/index.js
  -> pages/index / device / record / flash
  -> transcript 页面
  -> 你自己的后端服务
```

## 15. 学生应该改哪里，不该改哪里

这个非常重要。

### 建议学生优先改

- `pages/index/index.vue`
- `pages/device/device.vue`
- `pages/record/record.vue`
- `pages/flash/flash.vue`
- `pages/transcript/transcript.vue`
- 自己新增的页面
- 自己新增的后端请求逻辑

### 初学者不建议一开始就改

- `uni_modules/oleap-ble-sdk/utssdk/app-android/index.uts`
- `uni_modules/oleap-ble-sdk/utssdk/app-ios/index.uts`
- 协议编解码核心逻辑
- 原生权限和 GATT 连接主状态机

不是因为这些地方不能改，而是因为：

> 这些地方对“理解前后端交互和做课堂交付”不是第一优先级。

## 16. 对纯小白最友好的开发路线

如果你是第一次做项目，建议按这个顺序来：

### 第 1 阶段：先跑起来

- 能打开首页
- 能授权
- 能扫描
- 能连接

### 第 2 阶段：先验证设备能力

- 能看电量
- 能看 SN
- 能看版本
- 能切 EQ

### 第 3 阶段：完成录音主链路

- 能开始录音
- 能停止录音
- 能拿到 WAV 或 MP3 文件

### 第 4 阶段：完成离线文件主链路

- 能拉 Flash 列表
- 能下载文件
- 能拿到离线文件路径

### 第 5 阶段：做自己的业务题

例如：

- 上传音频到后端
- 调用转写接口
- 展示转写文本
- 做摘要和标签
- 做会议纪要
- 做作业整理

## 17. 一个适合课堂的作业交付模板

如果老师想给学生留作业，可以要求学生交付如下内容：

### 必做

- 一个能连接耳机的 App
- 至少一个完整业务场景
- 能演示从耳机拿到数据
- 有前端页面
- 有业务流程

### 推荐场景

- 会议录音转写助手
- 上课录音整理助手
- 采访记录助手
- 背单词语音笔记助手
- 志愿活动访谈整理工具

### 最低验收建议

- 能扫描并连接
- 能展示设备 ID
- 能开始 / 停止录音
- 能得到 WAV 或 MP3
- 能把音频送到自己的业务流程里

### 实战命题参考

如果老师希望给学生提供更明确的选题方向，可以从下面 7 个命题中选择。它们都可以基于本项目的耳机录音、音频文件、转写入口和业务页面继续扩展。

| 序号 | 实战命题 | 命题描述 | 举例方向 |
| --- | --- | --- | --- |
| 1 | 黄鹂智声 App 功能重构 | 围绕黄鹂智声 App 现有产品或使用场景，对 App 的界面、交互流程和功能体验进行优化，提升用户使用效率和产品体验。 | 重新设计首页、录音入口、翻译页面、会议记录页面；利用 AI 生成 Web/H5 界面原型；设计更适合学生、办公或会议场景的操作流程。 |
| 2 | 语音翻译助手 | 面向跨语言交流场景，将音频内容转写为文字，并进一步完成翻译、重点提取和双语对照展示，帮助用户降低语言理解门槛。 | 留学生课堂实时翻译助手、跨境会议翻译工具、外籍客户沟通助手、旅游场景语音翻译卡片。 |
| 3 | 语音知识库系统 | 将课堂、会议、访谈、讲座等音频内容转化为可整理、可存储、可检索的知识资料，帮助用户沉淀信息资产。 | 课堂录音自动生成笔记与知识点；会议录音生成纪要、待办事项和关键词；访谈录音整理为可查询资料库。 |
| 4 | 语音内容生成工具 | 将用户的语音想法、口述内容或录音素材转化为结构化文本，并借助 AI 生成文章、脚本、文案、报告等内容。 | 口述生成小红书 / 公众号文案；录音生成短视频脚本；采访录音生成新闻稿；头脑风暴录音生成项目方案。 |
| 5 | 语音客服 / 销售助手 | 面向客服、销售、咨询等沟通场景，对语音对话进行识别、分析和总结，帮助提升沟通效率与服务质量。 | 客服通话自动生成问题摘要；销售沟通后自动生成客户需求、跟进计划和话术建议；咨询场景生成服务记录。 |
| 6 | 语音情绪分析工具 | 基于语音内容和表达特征，对用户情绪、态度或沟通状态进行分析，并用可视化方式展示结果。 | 课堂互动情绪观察、客服通话满意度分析、面试表达状态分析、演讲训练中的情绪变化反馈。 |
| 7 | 开放创新命题 | 基于黄鹂智声音频能力，自主设计新的应用场景，鼓励结合学习、办公、生活、无障碍、文旅、健康、娱乐等方向进行创新。 | 无障碍语音助手、老人陪伴记录工具、运动语音教练、博物馆语音导览、会议协作助手、语音日记与成长记录工具。 |

## 18. 常见报错与排查方法

下面这些问题在课堂里最常见。

### 18.1 白屏

优先排查：

1. 是否修改了 UTS 原生代码
2. 是否重新打了自定义基座
3. HBuilderX 控制台有没有报原生编译错误

### 18.2 能进首页，但扫描失败

优先排查：

1. 手机蓝牙是否打开
2. 权限是否授予
3. 耳机是否开机
4. 耳机是否已经连到别的手机
5. 自定义基座是否是最新

### 18.3 能扫描到设备，但连不上

优先排查：

1. 设备是否距离太远
2. 耳机是否已经与其他手机占用连接
3. 首页诊断里是否出现连接超时
4. 是否成功完成服务发现和 notify 订阅

### 18.4 设备状态页超时

说明通常不是“页面坏了”，而是下面某一层有问题：

- 控制协议 write 没成功
- communication notify 没成功
- 当前连接并不稳定

### 18.5 录音结束后没有文件

优先排查：

1. 是否真的收到录音帧
2. 解码进度有没有推进
3. 是否出现 `opus_decode_failed`
4. 帧布局是否满足当前 decoder 要求

### 18.6 为什么我改了 `index.uts`，但是手机效果没变

因为你改的是原生 UTS 代码，不是纯前端代码。
通常需要重新打基座或重新做原生编译。

## 19. 如果你是老师，推荐这样组织课堂

一个很顺的教学顺序是：

### 第一节

- 讲清楚项目目标
- 跑通首页扫描和连接
- 让每个人都看到自己的设备 ID

### 第二节

- 讲设备状态页
- 讲电量 / SN / 版本 / EQ
- 让大家知道“控制协议”是什么

### 第三节

- 讲实时录音页
- 演示开始 / 停止
- 让大家拿到 WAV 文件

### 第四节

- 讲 Flash 下载
- 讲离线文件
- 讲为什么“下载后删除队首”要受约束

### 第五节

- 讲如何把音频送到后端
- 讲转写页面如何改造成真实业务
- 让学生开始做自己的场景

## 20. 相关文档

如果你已经跑通首页，下一步建议看这些文档：

- Vibe Coding 课堂 HTML 课件：`docs/oleap-vibe-coding-class-ppt.html`
- Vibe Coding 二次开发实操指南：`docs/oleap-vibe-coding-secondary-development-guide.md`
- API 文档：`docs/oleap-uniapp-sdk-api.md`
- 测试计划：`docs/oleap-uniapp-sdk-test-plan.md`
- 实施计划：`docs/oleap-uniapp-sdk-implementation-plan.md`

## 21. 当前检查命令

```sh
npm run check:phase0
npm run check:p1-android
npm run check:p2-control
npm run check:p3-recording
npm run check:p3-demo
npm run check:p4-flash
npm run check:p5-ios
```

这些命令的意义不是“证明业务已经 100% 真机可用”，而是：

- 帮助你在改代码后快速发现明显回归
- 确认 SDK facade、页面结构、协议实现没有被误删
- 降低课堂多人同时修改时把项目改坏的概率

## 22. 一句给学生的话

如果你现在看这个仓库觉得内容很多，很正常。

你不需要第一天就看懂 BLE、GATT、UTS、OPUS、DP 协议全部细节。
课堂最重要的是先完成一条真正可运行的链路：

> 扫描 -> 连接 -> 取到数据 -> 做成业务

只要这条链路能跑通，你就已经不是“只会写页面”的开发者了。

## 23. SDK API 完整参考

这一节可以当成 SDK 的“说明书”。如果你是第一次写 App，不用一次性背下来；建议先按顺序看：

1. 先看 `23.1` 和 `23.2`，知道怎么引入 SDK。
2. 再看 `23.4` 和 `23.5`，把授权、扫描、连接跑通。
3. 然后按自己的项目需要选择 `设备状态`、`实时录音`、`Flash 文件`、`转写`。

### 23.1 推荐导入方式

项目里推荐统一使用 `OleapBle.xxx()` 的写法。这样代码更容易读，老师或同学看到 `OleapBle` 就知道这是耳机 SDK。

```js
import { OleapBle } from '@/uni_modules/oleap-ble-sdk/index.js'
```

SDK 也支持按函数名单独导入，适合你只想用少量函数的页面。

```js
import {
  init,
  startScan,
  connect,
  startRecording,
  stopRecording
} from '@/uni_modules/oleap-ble-sdk/index.js'
```

还支持默认导入：

```js
import OleapBle from '@/uni_modules/oleap-ble-sdk/index.js'
```

课堂项目建议使用第一种写法。

### 23.2 最小调用顺序

绝大多数页面都应该遵守这个顺序：

```js
import { ensureOleapReady } from '@/utils/oleap-page-runtime.js'

/**
 * 1. 初始化 SDK。
 * 2. 请求系统权限。
 * 3. 扫描或读取已知设备。
 * 4. 连接目标耳机。
 * 5. 连接成功后再查询设备状态、录音或下载 Flash 文件。
 */
await ensureOleapReady()
await OleapBle.requestPermissions()
await OleapBle.startScan({ timeoutMs: 3000 })
```

一个最小可用连接示例：

```js
import { OleapBle } from '@/uni_modules/oleap-ble-sdk/index.js'
import {
  disposeOleapDisposers,
  ensureOleapReady,
  registerOleapDisposers,
  runOleapAction
} from '@/utils/oleap-page-runtime.js'

export default {
  data() {
    return {
      devices: [],
      connectedDevice: null,
      disposers: []
    }
  },
  async onLoad() {
    await runOleapAction(this, async () => {
      await ensureOleapReady()
      registerOleapDisposers(
        this,
        OleapBle.onDeviceFound((device) => {
          if (!this.devices.some((item) => item.deviceId === device.deviceId)) {
            this.devices.push(device)
          }
        }),
        OleapBle.onConnectionChanged((event) => {
          this.connectedDevice = event.connected ? event.device : null
        })
      )
    })
  },
  onUnload() {
    disposeOleapDisposers(this)
  },
  methods: {
    async scan() {
      await runOleapAction(this, async () => {
        await OleapBle.requestPermissions()
        await OleapBle.startScan({ timeoutMs: 3000 })
      })
    },
    async connectDevice(device) {
      await runOleapAction(this, async () => {
        await OleapBle.connect({
          deviceId: device.deviceId,
          name: device.name
        })
      })
    }
  }
}
```

### 23.3 数据类型速查

下面这些类型来自 `uni_modules/oleap-ble-sdk/utssdk/interface.uts`。写页面时不用手动声明它们，但理解字段含义很重要。

#### OleapDevice

扫描到或已知的耳机设备。

```js
{
  deviceId: '01:EA:25:02:07:4A',
  name: 'OLEAP Archer',
  rssi: -56,
  manufacturerDataHex: '...'
}
```

字段说明：

- `deviceId`：设备 ID，Android 上通常是蓝牙 MAC 地址；连接时必须传这个字段。
- `name`：蓝牙广播名，页面上可以直接展示。
- `rssi`：信号强度，数值越接近 0 通常表示越近。
- `manufacturerDataHex`：广播厂商数据，普通业务一般不需要用。

#### OleapConnectionState

当前连接状态。

```js
{
  connected: true,
  device: {
    deviceId: '01:EA:25:02:07:4A',
    name: 'OLEAP Archer',
    rssi: 0
  }
}
```

字段说明：

- `connected`：是否已连接。
- `device`：已连接设备；未连接时通常是 `null`。

#### OleapBluetoothState

系统蓝牙和权限状态。

```js
{
  supported: true,
  enabled: true,
  permissionGranted: true,
  androidSdk: 35,
  targetSdk: 35,
  permissionMode: 'android12-bluetooth'
}
```

字段说明：

- `supported`：手机是否支持蓝牙。
- `enabled`：系统蓝牙是否打开。
- `permissionGranted`：当前 App 是否已经获得需要的蓝牙权限。
- `androidSdk`：手机系统 Android SDK 版本。
- `targetSdk`：当前 App 打包时的 targetSdkVersion。
- `permissionMode`：当前权限模式，常见值是 `legacy-location` 或 `android12-bluetooth`。

#### OleapPermissionResult

授权结果。

```js
{
  bluetooth: true,
  location: true,
  permissionGranted: true
}
```

字段说明：

- `bluetooth`：蓝牙相关权限是否可用。
- `location`：部分 Android 版本扫描 BLE 需要位置权限。
- `permissionGranted`：SDK 归一化后的总权限状态。

#### OleapDpReport

设备控制协议的主动上报或查询结果。

```js
{
  dpId: 3,
  name: 'batteryPercentage',
  value: 86,
  timestamp: '2026-05-23T06:30:00.000Z'
}
```

字段说明：

- `dpId`：协议里的 DP 编号。
- `name`：SDK 解析后的字段名，例如 `batteryPercentage`、`sn`、`eqMode`、`shortcutKey`。
- `value`：解析后的值，可能是数字、字符串或对象。
- `timestamp`：SDK 收到上报的时间。

#### OleapShortcutKeyEvent

特殊固件的快捷键主动上报事件，来自 DP `0x87` / `135`。

```js
{
  dpId: 135,
  name: 'shortcutKey',
  value: {
    raw: [1]
  },
  source: 'report',
  timestamp: '2026-05-23T06:30:00.000Z'
}
```

字段说明：

- `raw`：快捷键 DP 原始值。SDK 不解释字节含义，业务层可按固件协议自行映射。

#### OleapEqModeStatus

EQ 模式状态。

```js
{
  modeCount: 3,
  currentMode: 1,
  raw: [3, 1]
}
```

字段说明：

- `modeCount`：设备支持的 EQ 模式数量。
- `currentMode`：当前 EQ 模式编号。
- `raw`：协议原始值，排查问题时有用。

#### OleapRecordState

耳机当前录音状态。

```js
{
  state: 0,
  recordedFrameCount: 0,
  durationMs: 0
}
```

字段说明：

- `state`：设备侧录音状态码。
- `recordedFrameCount`：已录音帧数。
- `durationMs`：估算录音时长。

#### OleapFlashCapacity

耳机 Flash 存储容量。

```js
{
  totalBlocks: 1024,
  freeBlocks: 800,
  totalBytes: 4194304,
  freeBytes: 3276800
}
```

字段说明：

- `totalBlocks`：总块数。
- `freeBlocks`：空闲块数。
- `totalBytes`：总容量字节数。
- `freeBytes`：剩余容量字节数。

#### OleapRecordingProgress

实时录音或 Flash 下载进度。

```js
{
  sessionId: 'android-1716445800000',
  durationMs: 3000,
  frameCount: 150,
  lostFrames: 0,
  outOfOrderFrames: 0,
  flash: false,
  progress: 42,
  fileId: 1001
}
```

字段说明：

- `sessionId`：本次录音或下载会话 ID。
- `durationMs`：估算时长。
- `frameCount`：已接收音频帧数。
- `lostFrames`：估算丢帧数量。
- `outOfOrderFrames`：乱序帧数量。
- `flash`：是否来自 Flash 文件下载。
- `progress`：Flash 下载或解码进度。
- `fileId`：Flash 文件 ID。

#### OleapDecodeProgress

音频解码进度。

```js
{
  sessionId: 'android-1716445800000',
  phase: 'decoding',
  progress: 80
}
```

字段说明：

- `phase`：阶段，例如 `recording`、`stopping`、`decoding`、`completed`。
- `progress`：进度百分比。

#### OleapRecordingResult

实时录音停止后或 Flash 下载完成后的音频结果。

```js
{
  filePath: '/storage/emulated/0/Android/data/.../oleap-recordings/android-xxx.wav',
  format: 'wav',
  durationMs: 3000,
  sampleRate: 16000,
  channels: 1,
  frameCount: 150,
  lostFrames: 0,
  outOfOrderFrames: 0,
  size: 96044,
  source: 'realtime',
  fileId: 1001
}
```

字段说明：

- `filePath`：SDK 输出的音频文件路径，学生做上传或转写时最常用。
- `format`：`wav` 或 `mp3`。
- `durationMs`：录音时长。
- `sampleRate`：采样率，目前常见为 `16000`。
- `channels`：声道数，目前常见为 `1`。
- `frameCount`：音频帧数。
- `lostFrames`：丢帧数。
- `outOfOrderFrames`：乱序帧数。
- `size`：输出文件大小，单位字节。
- `source`：来源，例如 `realtime` 或 `flash`。
- `fileId`：Flash 文件结果会带这个字段。

#### OleapFlashRecordingInfo

Flash 离线录音文件信息。

```js
{
  fileId: 1001,
  fileLength: 40960,
  recordType: 1,
  channels: 1,
  sampleRate: 16000,
  bitRate: 32000,
  recordTime: '2026-05-23 14:30:00'
}
```

字段说明：

- `fileId`：Flash 文件 ID，下载时要传入。
- `fileLength`：文件长度。
- `recordType`：录音类型。
- `channels`：声道数。
- `sampleRate`：采样率。
- `bitRate`：码率。
- `recordTime`：录制时间，部分固件可能不返回。

#### OleapBleError

SDK 错误对象。

```js
{
  code: 'permission_denied',
  message: '请先授予蓝牙扫描权限',
  area: 'permission',
  recoverable: true,
  details: {}
}
```

字段说明：

- `code`：机器可读的错误码，适合写判断逻辑。
- `message`：给人看的错误说明，可以展示到页面。
- `area`：错误区域，例如 `permission`、`bluetooth`、`connection`、`control`、`recording`、`flash`。
- `recoverable`：是否通常可以通过重试、重新授权、重新连接恢复。
- `details`：排查问题时的额外信息。

### 23.4 初始化与权限函数

#### init(options)

```js
/**
 * 初始化 SDK。
 * 建议每个需要使用耳机能力的页面 onLoad 时先调用。
 * 多次调用通常不会有副作用。
 */
await OleapBle.init({
  logLevel: 'debug'
})
```

参数：

- `logLevel`：日志级别，可选 `debug`、`info`、`warn`、`error`。课堂调试建议用 `debug`。

返回：

- `Promise<void>`。

注意：

- 真机 App 环境才有 native UTS adapter。
- H5 或普通浏览器环境无法直接使用手机 BLE native 能力。
- Demo 页面推荐使用 `ensureOleapReady()`，它会缓存初始化 Promise，避免每个页面重复写初始化样板。

#### requestPermissions()

```js
/**
 * 请求 BLE 扫描和连接需要的系统权限。
 * Android 不同版本需要的权限不同，SDK 内部会做兼容处理。
 */
const permission = await OleapBle.requestPermissions()

if (!permission.permissionGranted && !permission.bluetooth) {
  uni.showToast({
    title: '请先授权蓝牙权限',
    icon: 'none'
  })
}
```

参数：

- 无。

返回：

- `Promise<OleapPermissionResult>`。

注意：

- 用户拒绝权限后，扫描和连接都会失败。
- 如果用户选择“不再询问”，需要引导用户到系统设置里重新打开权限。

#### getBluetoothState()

```js
/**
 * 读取当前手机蓝牙状态和 SDK 判断到的权限状态。
 * 常用于首页状态卡片、排查扫描失败原因。
 */
const state = await OleapBle.getBluetoothState()

console.log('蓝牙是否可用', state.supported)
console.log('系统蓝牙是否打开', state.enabled)
console.log('权限是否已授予', state.permissionGranted)
```

参数：

- 无。

返回：

- `Promise<OleapBluetoothState>`。

注意：

- `permissionGranted === true` 只表示权限通过，不代表用户一定打开了系统蓝牙。
- 扫描前应同时确认 `enabled` 和 `permissionGranted`。

### 23.5 扫描与连接函数

#### listKnownDevices()

```js
/**
 * 读取系统中已经配对、已知或 SDK 缓存的 Oleap 设备。
 * 可以用于首页启动后的自动连接。
 */
const devices = await OleapBle.listKnownDevices()

if (devices.length === 1) {
  await OleapBle.connect({
    deviceId: devices[0].deviceId,
    name: devices[0].name
  })
}
```

参数：

- 无。

返回：

- `Promise<Array<OleapDevice>>`。

注意：

- 这个函数不等于扫描，只是读取“已知设备”。
- 如果课堂每台手机只配一只耳机，可以用它做自动连接入口。

#### startScan(options)

```js
/**
 * 开始扫描附近 Oleap 耳机。
 * 扫描结果不会从 startScan 直接返回，而是通过 onDeviceFound 事件返回。
 */
const offDeviceFound = OleapBle.onDeviceFound((device) => {
  console.log('发现设备', device.name, device.deviceId, device.rssi)
})

await OleapBle.requestPermissions()
await OleapBle.startScan({
  timeoutMs: 3000
})

// 页面卸载时记得调用 offDeviceFound()
```

参数：

- `timeoutMs`：扫描持续时间，单位毫秒。课堂演示建议 `3000` 到 `5000`。

返回：

- `Promise<void>`。

注意：

- 扫描前必须先初始化并授权。
- 扫描结果通过 `onDeviceFound` 接收。
- 扫描太久会增加耗电，也可能让页面状态变复杂。

#### stopScan()

```js
/**
 * 主动停止扫描。
 * 页面离开、连接成功、用户点击停止时都可以调用。
 */
await OleapBle.stopScan()
```

参数：

- 无。

返回：

- `Promise<void>`。

注意：

- 连接设备前 SDK 内部也会尝试停止扫描。
- 页面卸载时主动停止扫描是好习惯。

#### connect(options)

```js
/**
 * 连接指定耳机。
 * deviceId 必填，name 建议传入，方便 SDK 和页面展示。
 */
await OleapBle.connect({
  deviceId: '01:EA:25:02:07:4A',
  name: 'OLEAP Archer',
  timeoutMs: 10000
})
```

参数：

- `deviceId`：必填，扫描结果里的设备 ID。
- `name`：可选，设备名。
- `timeoutMs`：可选，连接超时时间，单位毫秒。

返回：

- `Promise<OleapDevice>`。

注意：

- 必须先扫描到设备，或从 `listKnownDevices()` 得到设备。
- 连接成功后 SDK 会完成 GATT 连接、服务发现、特征值发现、通知订阅、MTU 请求等准备工作。
- 如果控制协议或录音协议超时，优先检查 `getConnectionState().channels` 和 `getDiagnostics()`。

#### disconnect()

```js
/**
 * 断开当前耳机连接。
 * 适合首页“断开”按钮、切换设备前、页面退出前调用。
 */
await OleapBle.disconnect()
```

参数：

- 无。

返回：

- `Promise<void>`。

注意：

- 断开后，设备状态查询、实时录音、Flash 下载都不能继续调用。
- 如果正在录音，建议先停止录音再断开。

#### getConnectionState()

```js
/**
 * 同步读取当前连接状态。
 * 注意这个函数不是 Promise，不需要 await。
 */
const connection = OleapBle.getConnectionState()

if (connection.connected) {
  console.log('已连接', connection.device.deviceId)
}
```

参数：

- 无。

返回：

- `OleapConnectionState`。

注意：

- 它是同步函数，适合页面刷新 UI 时立即读取。
- 如果要监听连接变化，使用 `onConnectionChanged()`。

### 23.6 设备控制函数

设备控制函数都要求已经连接耳机。它们走控制协议，常用于“设备状态页”。

#### getBattery()

```js
/**
 * 查询耳机电量。
 * 返回 0-100 的数字，具体精度取决于设备固件。
 */
const battery = await OleapBle.getBattery()
console.log(`当前电量：${battery}%`)
```

返回：

- `Promise<number>`。

#### getSn()

```js
/**
 * 查询设备 SN。
 * 可用于课堂记录每位同学使用的是哪只耳机。
 */
const sn = await OleapBle.getSn()
console.log('设备 SN', sn)
```

返回：

- `Promise<string>`。

#### getDeviceName()

```js
/**
 * 查询设备名称。
 */
const name = await OleapBle.getDeviceName()
```

返回：

- `Promise<string>`。

#### getFirmwareVersion()

```js
/**
 * 查询固件版本。
 * 排查问题时，老师可能会要求你提供这个值。
 */
const firmware = await OleapBle.getFirmwareVersion()
```

返回：

- `Promise<string>`。

#### getHardwareVersion()

```js
/**
 * 查询硬件版本。
 */
const hardware = await OleapBle.getHardwareVersion()
```

返回：

- `Promise<string>`。

#### getEqMode()

```js
/**
 * 查询当前 EQ 模式。
 */
const eq = await OleapBle.getEqMode()
console.log('当前 EQ', eq.currentMode)
```

返回：

- `Promise<OleapEqModeStatus>`。

#### setEqMode(options)

```js
/**
 * 设置 EQ 模式。
 * mode 是 0-255 的整数，实际可用范围由设备固件决定。
 */
const eq = await OleapBle.setEqMode({
  mode: 1
})
```

参数：

- `mode`：EQ 模式编号。

返回：

- `Promise<OleapEqModeStatus>`。

注意：

- 不要在页面上无限频繁调用，用户点击一次调一次即可。

#### getRecordState()

```js
/**
 * 查询设备当前录音状态。
 * 可以用来判断耳机是否正在录音、录音帧数等。
 */
const recordState = await OleapBle.getRecordState()
```

返回：

- `Promise<OleapRecordState>`。

#### getFlashCapacity()

```js
/**
 * 查询耳机 Flash 存储容量。
 * 适合在 Flash 文件页顶部展示剩余空间。
 */
const capacity = await OleapBle.getFlashCapacity()
console.log('剩余容量', capacity.freeBytes)
```

返回：

- `Promise<OleapFlashCapacity>`。

#### syncAppTime()

```js
/**
 * 将 App 当前时间同步给耳机。
 * 如果离线录音文件需要正确时间戳，建议连接后调用一次。
 */
await OleapBle.syncAppTime()
```

返回：

- `Promise<void>`。

#### 设备状态页完整示例

```js
async function loadDeviceStatus() {
  const connection = OleapBle.getConnectionState()
  if (!connection.connected) {
    throw new Error('请先连接耳机')
  }

  const battery = await OleapBle.getBattery()
  const sn = await OleapBle.getSn()
  const name = await OleapBle.getDeviceName()
  const firmware = await OleapBle.getFirmwareVersion()
  const hardware = await OleapBle.getHardwareVersion()
  const eq = await OleapBle.getEqMode()
  const recordState = await OleapBle.getRecordState()
  const flash = await OleapBle.getFlashCapacity()

  return {
    battery,
    sn,
    name,
    firmware,
    hardware,
    eq,
    recordState,
    flash
  }
}
```

### 23.7 实时录音函数

实时录音的目标是：学生点击“开始录音”，耳机开始发送 OPUS 音频帧；点击“停止录音”，SDK 结束会话并输出 WAV 或 MP3 文件路径。

#### startRecording(options)

```js
/**
 * 开始实时录音。
 * scene 用来告诉耳机当前录音场景。
 * enableRealtimeStream 开启后边录边处理音频流，录音结束无需等待解码。
 */
const started = await OleapBle.startRecording({
  scene: 'personal',
  enableRealtimeStream: true,      // 可选，是否启用实时音频流，默认 false（批量解码）
  format: 'wav',              // 实时音频流时必须是 wav
  realtimeBatchFrames: 25     // 可选，实时音频流每批帧数，默认 25（约 1 秒）
})

console.log('录音会话', started.sessionId)
console.log('解码模式', started.decodeMode)  // 'realtime' 或 'batch'
```

参数：

- `scene`：录音场景，可选 `personal`、`call`、`media`、`ambient`。
- `enableRealtimeStream`：可选，是否启用实时音频流模式，默认 `false`。启用后录音过程中边处理音频流边写入 WAV 文件，停止录音后无需等待解码。
- `format`：可选，输出格式，可选 `wav`、`mp3`，默认 `wav`。实时音频流模式下只支持 `wav`。
- `realtimeBatchFrames`：可选，实时音频流每批积累的帧数，默认 `25`（约 1 秒触发一次解码）。值越小响应越快，建议范围 `10`–`50`。

返回：

- `Promise<any>`，包含 `sessionId`、`decodeMode`（`'realtime'` 或 `'batch'`）等会话信息。

注意：

- 必须先连接耳机。
- 同一时间只能有一个实时录音会话。
- 实时音频流仅支持 Android，iOS 不支持。
- 如果页面离开时仍在录音，建议提示用户先停止录音。

#### stopRecording(options)

```js
/**
 * 停止实时录音，并让 SDK 输出音频文件。
 * format 支持 wav 或 mp3。
 */
const result = await OleapBle.stopRecording({
  format: 'wav'
})

console.log('音频文件路径', result.filePath)
```

参数：

- `format`：输出格式，可选 `wav`、`mp3`。

返回：

- `Promise<OleapRecordingResult>`。

注意：

- 对教学和转写来说，优先用 `wav`，兼容性更好。
- 结束录音后拿到的 `filePath` 可以传给上传接口或转写页面。

#### 实时录音完整示例

```js
import { OleapBle } from '@/uni_modules/oleap-ble-sdk/index.js'
import {
  disposeOleapDisposers,
  ensureOleapReady,
  registerOleapDisposers,
  runOleapAction
} from '@/utils/oleap-page-runtime.js'

export default {
  data() {
    return {
      active: false,
      format: 'wav',
      scene: 'personal',
      progress: {
        durationMs: 0,
        frameCount: 0
      },
      result: null,
      disposers: []
    }
  },
  async onLoad() {
    await runOleapAction(this, async () => {
      await ensureOleapReady()
      registerOleapDisposers(
        this,
        OleapBle.onRecordingProgress((event) => {
          if (event.flash) {
            return
          }
          this.progress = {
            durationMs: event.durationMs || 0,
            frameCount: event.frameCount || 0
          }
        }),
        OleapBle.onDecodeProgress((event) => {
          console.log('解码进度', event.phase, event.progress)
        }),
        OleapBle.onError((error) => {
          console.log('SDK 错误', error.code, error.message)
        })
      )
    })
  },
  onUnload() {
    disposeOleapDisposers(this)
  },
  methods: {
    async start() {
      const connection = OleapBle.getConnectionState()
      if (!connection.connected) {
        uni.showToast({ title: '请先连接耳机', icon: 'none' })
        return
      }

      await runOleapAction(this, async () => {
        await OleapBle.startRecording({ scene: this.scene })
        this.active = true
      })
    },
    async stop() {
      await runOleapAction(this, async () => {
        this.result = await OleapBle.stopRecording({ format: this.format })
        this.active = false
      })

      uni.showToast({
        title: '录音文件已生成',
        icon: 'none'
      })
    }
  }
}
```

### 23.8 Flash 文件函数

Flash 文件指耳机离线存储里的录音文件。典型流程是：

> 查询文件列表 -> 选择一个文件 -> 下载 -> SDK 解码成 WAV/MP3 -> 拿到文件路径

#### listFlashRecordings()

```js
/**
 * 查询耳机 Flash 中的录音文件列表。
 */
const files = await OleapBle.listFlashRecordings()

files.forEach((file) => {
  console.log(file.fileId, file.fileLength, file.sampleRate)
})
```

参数：

- 无。

返回：

- `Promise<Array<OleapFlashRecordingInfo>>`。

注意：

- 必须先连接耳机。
- 如果返回空数组，说明耳机当前没有可下载的离线录音。

#### downloadFlashRecording(options)

```js
/**
 * 下载一个 Flash 录音文件，并输出 wav 或 mp3。
 */
const result = await OleapBle.downloadFlashRecording({
  fileId: 1001,
  format: 'wav',
  deleteAfterSuccess: false
})

console.log('下载完成', result.filePath)
```

参数：

- `fileId`：可选。指定要下载的 Flash 文件 ID；不传时 SDK 会尝试下载队首文件。
- `format`：可选，`wav` 或 `mp3`，默认 `wav`。
- `deleteAfterSuccess`：可选，下载成功后是否删除耳机里的文件，默认 `false`。

返回：

- `Promise<OleapRecordingResult>`。

注意：

- 教学阶段建议 `deleteAfterSuccess: false`，避免误删学生还没处理完的录音。
- 如果要删除，通常只能安全删除队首文件；非队首删除可能被 SDK 拒绝。

#### stopFlashDownload()

```js
/**
 * 停止正在进行的 Flash 下载。
 */
await OleapBle.stopFlashDownload()
```

参数：

- 无。

返回：

- `Promise<void>`。

注意：

- 用户点击“取消下载”或页面卸载时可以调用。

#### Flash 下载完整示例

```js
import { OleapBle } from '@/uni_modules/oleap-ble-sdk/index.js'
import {
  disposeOleapDisposers,
  ensureOleapReady,
  registerOleapDisposers,
  runOleapAction
} from '@/utils/oleap-page-runtime.js'

export default {
  data() {
    return {
      files: [],
      downloading: false,
      progress: 0,
      result: null,
      disposers: []
    }
  },
  async onLoad() {
    await runOleapAction(this, async () => {
      await ensureOleapReady()
      registerOleapDisposers(
        this,
        OleapBle.onRecordingProgress((event) => {
          if (!event.flash) {
            return
          }
          this.progress = event.progress || 0
        })
      )
    })
  },
  onUnload() {
    disposeOleapDisposers(this)
  },
  methods: {
    async refreshFiles() {
      await runOleapAction(this, async () => {
        this.files = await OleapBle.listFlashRecordings()
      })
    },
    async download(file) {
      this.downloading = true
      try {
        await runOleapAction(this, async () => {
          this.result = await OleapBle.downloadFlashRecording({
            fileId: file.fileId,
            format: 'wav',
            deleteAfterSuccess: false
          })
        })
      } finally {
        this.downloading = false
      }
    },
    async cancelDownload() {
      await OleapBle.stopFlashDownload()
      this.downloading = false
    }
  }
}
```

### 23.9 事件订阅函数

所有 `onXxx` 函数都有同一个规则：

- 参数是一个回调函数。
- 返回值是一个取消订阅函数。
- 页面销毁时必须调用取消订阅函数。

通用写法：

```js
import {
  disposeOleapDisposers,
  registerOleapDisposers
} from '@/utils/oleap-page-runtime.js'

export default {
  data() {
    return {
      disposers: []
    }
  },
  onLoad() {
    registerOleapDisposers(
      this,
      OleapBle.onDeviceFound((device) => {}),
      OleapBle.onConnectionChanged((event) => {})
    )
  },
  onUnload() {
    disposeOleapDisposers(this)
  }
}
```

#### onDeviceFound(callback)

```js
/**
 * 监听扫描到的设备。
 */
const dispose = OleapBle.onDeviceFound((device) => {
  console.log(device.deviceId, device.name, device.rssi)
})

dispose()
```

回调参数：

- `OleapDevice`。

常用页面：

- 首页扫描结果列表。

#### onConnectionChanged(callback)

```js
/**
 * 监听连接状态变化。
 */
const dispose = OleapBle.onConnectionChanged((event) => {
  if (event.connected) {
    console.log('已连接', event.device?.deviceId || '未知设备')
  } else {
    console.log('已断开')
  }
})
```

回调参数：

- `OleapConnectionState`。

常用页面：

- 首页、录音页、设备状态页。

#### onDpReport(callback)

```js
/**
 * 监听设备 DP 主动上报。
 * 例如电量、录音状态、EQ 等设备侧主动变化。
 */
const dispose = OleapBle.onDpReport((report) => {
  console.log(report.dpId, report.name, report.value)
})
```

回调参数：

- `OleapDpReport`。

常用页面：

- 设备状态页。
- 需要实时感知耳机状态变化的业务页。

#### onShortcutKey(callback)

```js
/**
 * 监听特殊固件快捷键主动上报。
 * SDK 只发布事件，不会自动启动或停止录音。
 */
const dispose = OleapBle.onShortcutKey(async (event) => {
  console.log(event.value.raw)

  // 业务层按需决定是否启动录音，并自行做防重复触发保护。
  await OleapBle.startRecording({ scene: 'personal' })
})
```

回调参数：

- `OleapShortcutKeyEvent`。

常用页面：

- 需要把耳机快捷键映射成业务动作的页面。

#### onRecordingProgress(callback)

```js
/**
 * 监听实时录音或 Flash 下载进度。
 */
const dispose = OleapBle.onRecordingProgress((event) => {
  if (event.flash) {
    console.log('Flash 下载进度', event.progress)
  } else {
    console.log('实时录音帧数', event.frameCount)
  }
})
```

回调参数：

- `OleapRecordingProgress`。

常用页面：

- 实时录音页。
- Flash 文件页。

#### onDecodeProgress(callback)

```js
/**
 * 监听 OPUS 转 WAV/MP3 的解码进度。
 */
const dispose = OleapBle.onDecodeProgress((event) => {
  console.log(event.phase, event.progress)
})
```

回调参数：

- `OleapDecodeProgress`。

常用页面：

- 实时录音页。
- Flash 文件页。

#### onWaveformData(callback)

```js
/**
 * 监听实时音频流的波形样本数据，用于绘制波形图。
 * 每批解码完成后触发一次（默认约 1 秒）。
 * 仅在 startRecording 传入 enableRealtimeStream: true 时有效。
 */
const dispose = OleapBle.onWaveformData((event) => {
  console.log(event.sessionId)
  console.log(event.samples)     // number[]，已归一化的 PCM 样本值（有符号 16-bit）
  console.log(event.sampleCount) // 样本数量，默认约 250 个点（25帧 × 10点）
})

// 页面卸载时取消订阅
onUnmounted(() => dispose())
```

回调参数：

- `sessionId`：当前录音会话 ID。
- `samples`：`number[]`，每批解码后提取的 PCM 样本，可直接用于 Canvas 波形绘制。
- `sampleCount`：样本数量。

常用页面：

- 实时录音页（波形图展示）。

#### onRealtimePcmData(callback, perFrame?)

```js
/**
 * 监听实时音频流的 PCM 原始数据，用于 ASR 等需要原始音频的场景。
 * 仅在 startRecording 传入 enableRealtimeStream: true 时有效。
 *
 * perFrame 默认 false（按批次回调，约 1 秒一次）。
 * perFrame 传 true 时每帧回调一次（约 40ms 一次）。
 */

// 按批次（推荐，适合 ASR）
const dispose = OleapBle.onRealtimePcmData((event) => {
  console.log(event.pcmBase64)    // base64 编码的 PCM 字节，可直接发给 ASR 接口
  console.log(event.byteLength)   // 字节数
  console.log(event.durationMs)   // 这批音频时长（ms），批次模式约 1000ms
  console.log(event.sampleRate)   // 16000
  console.log(event.channels)     // 1
  console.log(event.bitsPerSample) // 16
})

// 单帧模式（适合需要极低延迟的场景）
const dispose = OleapBle.onRealtimePcmData((event) => {
  console.log(event.pcmBase64)    // 单帧 PCM，约 1280 字节
  console.log(event.durationMs)   // 固定 40ms
}, true)

// 页面卸载时取消订阅
onUnmounted(() => dispose())
```

回调参数：

- `sessionId`：当前录音会话 ID。
- `pcmBase64`：base64 编码的 PCM 字节（16-bit 小端序，单声道，16000Hz）。
- `byteLength`：PCM 字节数。批次模式下约 `32000`（25帧 × 1280字节），单帧模式固定 `1280`。
- `durationMs`：音频时长（ms）。批次模式约 `1000`，单帧模式固定 `40`。
- `sampleRate`：采样率，固定 `16000`。
- `channels`：声道数，固定 `1`。
- `bitsPerSample`：位深，固定 `16`。

注意：

- 仅 Android 支持，iOS 不支持实时音频流。
- 没有注册监听器时不会做 base64 编码，不影响录音性能。
- 发给 ASR 接口时通常需要告知 `encoding=LINEAR16`、`sampleRate=16000`、`channels=1`。

常用页面：

- 实时录音页（接 ASR 实时转写）。

#### onError(callback)

```js
/**
 * 监听 SDK 内部主动抛出的错误。
 * 注意：try/catch 仍然要写，onError 不能替代 Promise 的 catch。
 */
const dispose = OleapBle.onError((error) => {
  console.log(error.area, error.code, error.message)
})
```

回调参数：

- `OleapBleError`。

常用页面：

- 所有调试页面。

### 23.10 诊断函数

#### getDiagnostics()

```js
/**
 * 获取 SDK 诊断信息。
 * 适合在页面上展示最近的连接、服务发现、特征值、写入、notify、录音事件。
 */
const diagnostics = OleapBle.getDiagnostics()
console.log(diagnostics.events)
```

参数：

- 无。

返回：

- `any`，通常包含 `version`、`platform`、`connected`、`channels`、`events` 等字段。

注意：

- 它是同步函数，不需要 `await`。
- 诊断信息不会记录完整音频 payload。
- 遇到“连接成功但控制协议超时”时，优先看 `channels` 是否完整。

#### clearDiagnostics()

```js
/**
 * 清空 SDK 诊断事件。
 */
OleapBle.clearDiagnostics()
```

参数：

- 无。

返回：

- `void`。

### 23.11 所有函数总表

| 函数 | 类型 | 作用 | 常用页面 |
| --- | --- | --- | --- |
| `init(options)` | 异步 | 初始化 SDK | 所有用到耳机的页面 |
| `requestPermissions()` | 异步 | 请求蓝牙和定位相关权限 | 首页 |
| `getBluetoothState()` | 异步 | 读取系统蓝牙和权限状态 | 首页 |
| `listKnownDevices()` | 异步 | 获取已知或已配对 Oleap 设备 | 首页自动连接 |
| `startScan(options)` | 异步 | 开始扫描附近耳机 | 首页 |
| `stopScan()` | 异步 | 停止扫描 | 首页 |
| `connect(options)` | 异步 | 连接指定耳机 | 首页 |
| `disconnect()` | 异步 | 断开当前连接 | 首页 |
| `getConnectionState()` | 同步 | 读取当前连接状态 | 所有业务页 |
| `getBattery()` | 异步 | 查询电量 | 设备状态页 |
| `getSn()` | 异步 | 查询 SN | 设备状态页 |
| `getDeviceName()` | 异步 | 查询设备名 | 设备状态页 |
| `getFirmwareVersion()` | 异步 | 查询固件版本 | 设备状态页 |
| `getHardwareVersion()` | 异步 | 查询硬件版本 | 设备状态页 |
| `getEqMode()` | 异步 | 查询 EQ 模式 | 设备状态页 |
| `setEqMode(options)` | 异步 | 设置 EQ 模式 | 设备状态页 |
| `getRecordState()` | 异步 | 查询设备录音状态 | 设备状态页 |
| `getFlashCapacity()` | 异步 | 查询 Flash 容量 | 设备状态页 / Flash 页 |
| `syncAppTime()` | 异步 | 同步 App 时间给耳机 | 连接后 |
| `startRecording(options)` | 异步 | 开始实时录音 | 实时录音页 |
| `stopRecording(options)` | 异步 | 停止实时录音并输出音频文件 | 实时录音页 |
| `listFlashRecordings()` | 异步 | 查询 Flash 离线录音列表 | Flash 页 |
| `downloadFlashRecording(options)` | 异步 | 下载 Flash 录音并输出音频文件 | Flash 页 |
| `stopFlashDownload()` | 异步 | 停止 Flash 下载 | Flash 页 |
| `onDeviceFound(callback)` | 订阅 | 监听扫描结果 | 首页 |
| `onConnectionChanged(callback)` | 订阅 | 监听连接变化 | 所有业务页 |
| `onDpReport(callback)` | 订阅 | 监听设备主动上报 | 设备状态页 |
| `onShortcutKey(callback)` | 订阅 | 监听特殊固件快捷键主动上报 | 录音页 / 业务页 |
| `onRecordingProgress(callback)` | 订阅 | 监听录音或 Flash 进度 | 录音页 / Flash 页 |
| `onDecodeProgress(callback)` | 订阅 | 监听解码进度 | 录音页 / Flash 页 |
| `onWaveformData(callback)` | 订阅 | 监听实时音频流波形样本，用于波形图绘制 | 实时录音页 |
| `onRealtimePcmData(callback, perFrame?)` | 订阅 | 监听实时音频流 PCM 数据，用于 ASR 等 | 实时录音页 |
| `onError(callback)` | 订阅 | 监听 SDK 错误事件 | 所有调试页面 |
| `getDiagnostics()` | 同步 | 获取 SDK 诊断信息 | 调试面板 |
| `clearDiagnostics()` | 同步 | 清空 SDK 诊断信息 | 调试面板 |

### 23.12 课堂项目最常用的 4 条链路

#### 链路 1：扫描并连接

```js
await ensureOleapReady()
await OleapBle.requestPermissions()

const off = OleapBle.onDeviceFound(async (device) => {
  if (device.name.indexOf('OLEAP') >= 0) {
    await OleapBle.stopScan()
    await OleapBle.connect({
      deviceId: device.deviceId,
      name: device.name
    })
    off()
  }
})

await OleapBle.startScan({ timeoutMs: 3000 })
```

#### 链路 2：连接后读取设备信息

```js
const connection = OleapBle.getConnectionState()
if (!connection.connected) {
  throw new Error('请先连接耳机')
}

const status = {
  battery: await OleapBle.getBattery(),
  sn: await OleapBle.getSn(),
  name: await OleapBle.getDeviceName(),
  firmware: await OleapBle.getFirmwareVersion(),
  hardware: await OleapBle.getHardwareVersion(),
  eq: await OleapBle.getEqMode()
}
```

#### 链路 3：实时录音拿到 WAV

```js
await OleapBle.startRecording({
  scene: 'personal'
})

// 这里可以等待用户点击“结束录音”

const audio = await OleapBle.stopRecording({
  format: 'wav'
})

console.log('把这个路径交给转写接口', audio.filePath)
```

#### 链路 4：下载 Flash 离线录音

```js
const files = await OleapBle.listFlashRecordings()

if (files.length > 0) {
  const audio = await OleapBle.downloadFlashRecording({
    fileId: files[0].fileId,
    format: 'wav',
    deleteAfterSuccess: false
  })

  console.log('离线录音文件', audio.filePath)
}
```

### 23.13 错误处理模板

页面里不要让 Promise 错误直接飘到控制台。Demo 页面推荐用 `runOleapAction()` 统一收口。

```js
import { runOleapAction } from '@/utils/oleap-page-runtime.js'

await runOleapAction(this, async () => {
  await OleapBle.startScan({ timeoutMs: 3000 })
})
```

常见错误处理建议：

- `permission_denied`：提示用户授权蓝牙权限。
- `bluetooth_off`：提示用户打开系统蓝牙。
- `connect_timeout`：提示靠近耳机后重试，或重新扫描。
- `control_timeout`：检查是否真的已连接、特征值是否就绪。
- `recording_command_timeout`：检查录音通道是否就绪，必要时断开重连。
- `flash_file_missing`：提示耳机里没有可下载的离线录音。

### 23.14 学生做业务时最应该记住的点

- 所有硬件能力都从 `OleapBle` 入口调用。
- 先连接，再做设备状态、录音、Flash。
- 扫描结果来自 `onDeviceFound`，不是 `startScan` 的返回值。
- `getConnectionState()`、`getDiagnostics()`、`clearDiagnostics()` 是同步函数，不需要 `await`。
- 所有 `onXxx` 都要在页面卸载时取消订阅。
- 做转写、会议助手、课堂笔记助手时，最关键的数据是 `OleapRecordingResult.filePath`。
