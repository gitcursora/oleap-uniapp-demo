# Oleap Vibe Coding 二次开发实操指南

面向学生版本。
适用项目：

```text
oleap-class-workspace/
├── oleap-uniapp-demo/       # uni-app 手机端，连接 Oleap 耳机、录音、展示结果
└── oleap-fastify-demo/      # Fastify 后端，接收请求、处理音频、返回业务结果
```

这份指南会把你当作第一次做 App、第一次写后端、第一次做软硬件结合项目的同学来写。
你不需要一开始看懂蓝牙底层，也不需要一开始做出完整商业产品。你要先完成一条真实可演示的链路：

```text
Oleap 耳机
  -> uni-app 扫描连接
  -> 实时录音或下载 Flash 录音
  -> 拿到音频文件 filePath
  -> 调用 Fastify 后端
  -> 后端返回转写 / 摘要 / 翻译 / 分析 / 生成结果
  -> uni-app 页面展示结果
```

## 1. 你最终要交付什么

一周后，你的小组至少要交付一个可以现场演示的 MVP。

MVP 的意思是：功能可以简单，但主流程必须跑通。

最低要求：

- App 能在 Android 真机运行。
- App 能扫描并连接 Oleap 耳机。
- App 能开始录音、停止录音，并拿到 `audio.filePath`。
- App 能调用你电脑本地启动的 Fastify 后端。
- 后端能返回和你选题相关的业务结果。
- App 能把业务结果展示在页面上。
- 你能讲清楚哪些代码是 AI 辅助生成的，哪些是你自己理解和修改的。

不要只做一个漂亮但没有真实录音链路的假页面。
这个项目的重点是：

```text
真实硬件输入 + App 页面 + 后端接口 + AI 辅助开发 + 场景化产品
```

## 2. 你可以选择哪些实战命题

请从 `oleap-uniapp-demo/README.md` 里的实战命题中选择一个方向。

建议优先选择下面这些，难度更适合一周完成：

| 序号 | 命题 | 适合做什么 |
| --- | --- | --- |
| 1 | 黄鹂智声 App 功能重构 | 优化首页、录音入口、转写页、记录页、会议页 |
| 2 | 语音翻译助手 | 录音转文字，再做翻译和双语展示 |
| 3 | 语音知识库系统 | 课堂、会议、访谈录音整理成知识点、摘要、标签 |
| 4 | 语音内容生成工具 | 把口述内容生成文章、脚本、文案、报告 |
| 5 | 语音客服 / 销售助手 | 识别沟通内容，生成客户需求、问题摘要、跟进计划 |
| 6 | 语音情绪分析工具 | 根据语音转写文本做情绪标签和可视化展示 |
| 7 | 开放创新命题 | 自己设计新场景，例如无障碍、文旅、健康、运动、日记 |

选择命题后，请先写清楚 5 句话：

```text
我们选择的命题是：
目标用户是：
用户在什么场景下使用：
耳机录音会变成什么结果：
最终页面要展示什么：
```

示例：

```text
我们选择的命题是：语音知识库系统
目标用户是：上课来不及记笔记的学生
用户在什么场景下使用：课后整理课堂录音
耳机录音会变成什么结果：转写文本、摘要、关键词、复习问题
最终页面要展示什么：课程记录、知识点、待复习问题、原始音频路径
```

## 3. 两个项目分别做什么

### 3.1 oleap-uniapp-demo 是手机端

它负责：

- 运行在手机上。
- 请求蓝牙权限。
- 扫描 Oleap 耳机。
- 连接耳机。
- 读取设备信息。
- 实时录音。
- 下载耳机 Flash 里的离线录音。
- 拿到 WAV 或 MP3 文件路径。
- 调用后端接口。
- 展示后端返回的结果。

你主要会改这些位置：

```text
oleap-uniapp-demo/
├── pages/
│   ├── index/index.vue          # 首页，扫描连接入口
│   ├── record/record.vue        # 实时录音页
│   ├── flash/flash.vue          # Flash 文件页
│   └── transcript/transcript.vue # 转写/业务结果页，最适合二次开发
├── utils/
│   ├── demo-runtime.js
│   └── oleap-page-runtime.js
└── docs/
```

初学者暂时不要改：

```text
oleap-uniapp-demo/uni_modules/oleap-ble-sdk/utssdk/
```

这里是 SDK 原生实现，里面有 Android/iOS 蓝牙、协议、录音解码等底层逻辑。
如果你还没有明确知道自己在做什么，不要直接改它。

### 3.2 oleap-fastify-demo 是后端

它负责：

- 启动一个本地 HTTP 服务。
- 接收 App 请求。
- 接收 App 上传的音频文件。
- 返回 mock 转写、摘要、关键词、翻译、分析结果。
- 保存本地课堂记录。
- 让你学习如何新增自己的后端接口。

你主要会改这些位置：

```text
oleap-fastify-demo/
├── src/
│   ├── app.js              # 注册插件和路由
│   ├── server.js           # 启动服务
│   ├── routes/             # 后端接口
│   │   ├── health.js
│   │   ├── audio.js
│   │   ├── ai.js
│   │   └── records.js
│   ├── services/           # 业务处理逻辑
│   │   └── mock-ai.js
│   └── storage/            # 本地记录存储
│       └── record-store.js
├── scripts/
│   ├── lan-ip.js           # 查看局域网 IP
│   └── check.js            # 后端自检
├── uploads/audio/          # 上传音频保存位置
├── data/                   # 本地记录保存位置
└── README.md
```

初学者不要改：

```text
oleap-fastify-demo/node_modules/
oleap-fastify-demo/package-lock.json
```

除非老师要求，否则也不要把 `.env`、上传音频和运行时记录提交给别人。

## 4. 环境准备

你需要：

- HBuilderX，用来运行 `oleap-uniapp-demo`。
- VSCode，用来看两个项目、写后端、写页面。
- Node.js 20 或更新版本，用来运行 `oleap-fastify-demo`。
- Android 手机。
- Oleap 耳机。
- 手机和电脑连接同一个 WiFi。

检查 Node.js：

```sh
node -v
npm -v
```

如果 `node -v` 显示的是 `v20.x` 或更高，基本可以继续。

## 5. 第一次启动后端

进入后端项目：

```sh
cd oleap-fastify-demo
npm install
npm run check
```

看到：

```text
oleap-fastify-demo check passed
```

说明后端基础接口没问题。

然后查看电脑局域网地址：

```sh
npm run ip
```

你会看到类似：

```text
可用于手机访问的后端地址：
- en0: http://192.168.2.118:3000
```

记住这个地址。
下面用 `http://192.168.2.118:3000` 举例，你实际要换成你自己电脑显示的地址。

启动后端：

```sh
npm run dev
```

不要关闭这个终端窗口。
它就是你的后端服务。

然后用手机浏览器打开：

```text
http://192.168.2.118:3000/health
```

如果手机能看到类似：

```json
{
  "ok": true,
  "service": "oleap-fastify-demo"
}
```

说明手机可以访问电脑后端。

## 6. 为什么手机不能写 localhost

这是很多同学第一次联调都会踩的坑。

在电脑上：

```text
http://localhost:3000
```

表示访问电脑自己。

但在手机 App 里：

```text
http://localhost:3000
```

表示访问手机自己，不是你的电脑。

所以 uni-app 真机调后端时，不能写 `localhost`，要写电脑的局域网 IP：

```js
const API_BASE_URL = 'http://192.168.2.118:3000'
```

如果你换了教室、换了 WiFi、开了热点，IP 可能会变。
重新执行：

```sh
npm run ip
```

## 7. 第一次运行 uni-app 项目

用 HBuilderX 打开：

```text
oleap-uniapp-demo/
```

然后：

1. 连接 Android 手机。
2. 使用 HBuilderX 运行到 Android App 真机。
3. 手机上授权蓝牙权限。
4. 在首页扫描 Oleap 耳机。
5. 连接耳机。
6. 进入录音页。
7. 点击开始录音。
8. 说一句话。
9. 点击结束录音。
10. 查看页面上的输出文件路径。

你最终要拿到的是一个类似这样的数据：

```js
const audio = await OleapBle.stopRecording({
  format: 'wav'
})

console.log(audio.filePath)
```

`audio.filePath` 是最关键的数据。

你可以把它理解为：

```text
耳机录音生成的音频文件在手机里的路径
```

后面转写、摘要、翻译、知识库、客服分析、情绪分析，都从这个路径开始。

## 8. SDK 最小调用链路

你不需要一开始看懂全部 SDK。
先记住下面几条。

### 8.1 初始化和权限

```js
await ensureOleapReady()
await OleapBle.requestPermissions()
```

### 8.2 扫描并连接

```js
await OleapBle.startScan({ timeoutMs: 3000 })

await OleapBle.connect({
  deviceId: device.deviceId,
  name: device.name
})
```

### 8.3 实时录音

```js
await OleapBle.startRecording({
  scene: 'personal'
})

const audio = await OleapBle.stopRecording({
  format: 'wav'
})

console.log(audio.filePath)
```

### 8.4 Flash 离线录音

```js
const files = await OleapBle.listFlashRecordings()

const audio = await OleapBle.downloadFlashRecording({
  fileId: files[0].fileId,
  format: 'wav',
  deleteAfterSuccess: false
})

console.log(audio.filePath)
```

## 9. 你应该优先改哪个页面

最推荐你先改：

```text
oleap-uniapp-demo/pages/transcript/transcript.vue
```

因为录音页和 Flash 页已经会把 `filePath` 带到转写页：

```text
/pages/transcript/transcript?filePath=...
```

在 `transcript.vue` 里，可以读取：

```js
onLoad(query) {
  this.filePath = query.filePath ? decodeURIComponent(query.filePath) : ''
}
```

这表示：
只要你从录音页或 Flash 页跳到转写页，就能拿到音频路径。

所以二次开发可以先从这个页面开始：

- 显示音频路径。
- 增加“调用后端处理”按钮。
- 展示转写文本。
- 展示摘要。
- 展示关键词。
- 展示翻译、建议、情绪、待办等你的业务结果。

## 10. 先跑通 uni.request，再做上传

很多同学会一上来就做上传音频，结果卡在文件、网络、路径、权限上。
推荐顺序是：

```text
第一步：App 用 uni.request 调后端 mock 接口，只传 filePath 字符串
第二步：确认页面能展示结果
第三步：再用 uni.uploadFile 真实上传音频文件
```

### 10.1 用 uni.request 跑通业务结果

在 `transcript.vue` 里可以先写：

```js
const API_BASE_URL = 'http://192.168.2.118:3000'

uni.request({
  url: `${API_BASE_URL}/api/ai/process`,
  method: 'POST',
  data: {
    topic: '语音知识库系统',
    scene: 'classroom',
    filePath: this.filePath
  },
  success: (res) => {
    const result = res.data.data
    this.transcript = result.transcript.text
    this.summary = result.summary
    this.keywords = result.keywords
    this.suggestions = result.suggestions
  },
  fail: (error) => {
    console.log('请求后端失败', error)
  }
})
```

如果这一步成功，说明：

```text
App -> Fastify 后端 -> App
```

这条链路已经通了。

### 10.2 用 uni.uploadFile 上传录音文件

等 `uni.request` 跑通后，再做真实文件上传：

```js
uni.uploadFile({
  url: `${API_BASE_URL}/api/audio/upload`,
  filePath: this.filePath,
  name: 'audio',
  formData: {
    topic: '语音知识库系统',
    scene: 'classroom'
  },
  success: (res) => {
    const body = JSON.parse(res.data)
    const result = body.data.result
    this.transcript = result.transcript.text
    this.summary = result.summary
    this.keywords = result.keywords
    this.suggestions = result.suggestions
  },
  fail: (error) => {
    console.log('上传失败', error)
  }
})
```

注意：

- `name: 'audio'` 必须和后端上传接口字段名一致。
- `filePath` 必须是 Oleap 录音返回的真实路径。
- 如果上传失败，先确认手机浏览器能访问 `/health`。

## 11. Fastify 现有接口说明

### 11.1 GET /health

检查后端是否启动。

```sh
curl http://127.0.0.1:3000/health
```

手机检查：

```text
http://192.168.2.118:3000/health
```

### 11.2 POST /api/ai/process

给 App 返回 mock 业务结果。

请求：

```json
{
  "topic": "语音知识库系统",
  "scene": "classroom",
  "filePath": "/mock/audio.wav"
}
```

返回里常用字段：

```js
result.transcript.text
result.summary
result.keywords
result.suggestions
result.translation
result.emotion
result.recordId
```

### 11.3 POST /api/audio/upload

接收 App 上传的音频文件，并返回 mock 业务处理结果。

uni-app 调用时用：

```js
uni.uploadFile(...)
```

后端会把文件保存到：

```text
oleap-fastify-demo/uploads/audio/
```

### 11.4 GET /api/records

查看本地保存的记录。

```sh
curl http://127.0.0.1:3000/api/records
```

后端会把记录保存到：

```text
oleap-fastify-demo/data/records.json
```

## 12. 如何新增一个自己的后端接口

假设你要做“语音知识库系统”，想新增接口：

```text
POST /api/knowledge/create
```

作用：
接收转写文本或音频路径，返回知识点、关键词、复习问题。

### 12.1 新建路由文件

新建：

```text
oleap-fastify-demo/src/routes/knowledge.js
```

写入：

```js
export async function knowledgeRoutes(app) {
  app.post('/create', async (request) => {
    const body = request.body || {}
    const text = body.text || '这是一段模拟课堂转写文本。'
    const course = body.course || '未命名课程'

    return {
      ok: true,
      data: {
        course,
        sourceText: text,
        summary: '本节内容主要介绍了项目开发流程、前后端联调和语音数据处理。',
        keywords: ['uni-app', 'Fastify', '录音', '转写', '知识库'],
        reviewQuestions: [
          'uni-app 在这个项目中负责什么？',
          'Fastify 后端负责什么？',
          '为什么手机不能访问 localhost？'
        ],
        createdAt: new Date().toISOString()
      }
    }
  })
}
```

### 12.2 在 app.js 注册

打开：

```text
oleap-fastify-demo/src/app.js
```

顶部加：

```js
import { knowledgeRoutes } from './routes/knowledge.js'
```

路由注册区域加：

```js
await app.register(knowledgeRoutes, { prefix: '/api/knowledge' })
```

最终路径就是：

```text
/api/knowledge/create
```

### 12.3 用 curl 测试

```sh
curl -X POST http://127.0.0.1:3000/api/knowledge/create \
  -H "Content-Type: application/json" \
  -d '{"course":"移动应用开发","text":"今天学习了 uni-app 和 Fastify 联调。"}'
```

如果返回 `ok: true`，说明接口成功。

### 12.4 在 uni-app 里调用

```js
uni.request({
  url: `${API_BASE_URL}/api/knowledge/create`,
  method: 'POST',
  data: {
    course: '移动应用开发',
    text: this.transcript || '今天学习了 uni-app 和 Fastify 联调。'
  },
  success: (res) => {
    const data = res.data.data
    this.summary = data.summary
    this.keywords = data.keywords
    this.reviewQuestions = data.reviewQuestions
  }
})
```

## 13. 不同命题可以新增哪些接口

### 13.1 语音知识库系统

建议接口：

```text
POST /api/knowledge/create
GET  /api/knowledge/list
GET  /api/knowledge/:id
```

建议返回：

```js
{
  summary: '课堂摘要',
  keywords: ['关键词1', '关键词2'],
  reviewQuestions: ['复习问题1', '复习问题2'],
  actionItems: ['课后任务1', '课后任务2']
}
```

### 13.2 语音翻译助手

建议接口：

```text
POST /api/translate/create
```

建议返回：

```js
{
  sourceText: '原文',
  targetLanguage: 'en',
  translatedText: 'English translation',
  importantSentences: [
    {
      source: '重点原句',
      target: 'Translated sentence'
    }
  ]
}
```

### 13.3 语音内容生成工具

建议接口：

```text
POST /api/content/generate
```

建议返回：

```js
{
  title: '生成标题',
  outline: ['第一部分', '第二部分'],
  article: '生成正文',
  publishTips: ['发布建议1', '发布建议2']
}
```

### 13.4 语音客服 / 销售助手

建议接口：

```text
POST /api/sales/analyze
```

建议返回：

```js
{
  customerNeeds: ['客户需求1', '客户需求2'],
  painPoints: ['痛点1', '痛点2'],
  followUpPlan: ['跟进动作1', '跟进动作2'],
  suggestedReply: '建议回复话术'
}
```

### 13.5 语音情绪分析工具

建议接口：

```text
POST /api/emotion/analyze
```

建议返回：

```js
{
  label: '积极',
  score: 0.78,
  evidence: ['出现了积极词汇', '表达比较明确'],
  chartData: [
    { name: '积极', value: 78 },
    { name: '中性', value: 18 },
    { name: '消极', value: 4 }
  ],
  note: '课堂演示结果，不作为专业心理判断。'
}
```

## 14. 如何使用 Vibe Coding

Vibe Coding 不是“把任务全部丢给 AI 就结束”。
正确流程应该是：

```text
描述目标 -> 让 AI 给方案 -> 让 AI 改一小块 -> 自己运行验证 -> 把错误发给 AI -> 继续修改
```

不要一次让 AI 重写整个项目。
一次只改一个页面、一个接口、一个函数，成功率会高很多。

### 14.1 向 AI 说明项目背景

你可以这样开场：

```text
我正在基于两个项目做二次开发：
1. oleap-uniapp-demo：uni-app 手机端，可以连接 Oleap 耳机并拿到录音 filePath。
2. oleap-fastify-demo：Fastify 后端，可以提供 /api/ai/process 和 /api/audio/upload。

我选择的实战命题是「语音知识库系统」。
目标是：把课堂录音变成摘要、关键词和复习问题。

请先帮我设计一个一周内能完成的 MVP，不要修改 Oleap BLE SDK 底层。
```

### 14.2 让 AI 设计页面

```text
请帮我设计 pages/transcript/transcript.vue 的页面结构。
要求：
1. 保留从 query.filePath 读取音频路径。
2. 有按钮调用 Fastify 后端。
3. 展示转写文本、摘要、关键词、复习问题。
4. 给出 data、methods、template 的设计。
5. 使用 uni-app Vue 写法。
6. 不修改 uni_modules/oleap-ble-sdk。
```

### 14.3 让 AI 写后端接口

```text
请帮我在 Fastify 项目里新增一个接口：
POST /api/knowledge/create

要求：
1. 新建 src/routes/knowledge.js。
2. 在 src/app.js 注册。
3. 接收 course、text、filePath。
4. 返回 summary、keywords、reviewQuestions。
5. 先用 mock 数据，不接真实大模型。
6. 代码适合初学者理解。
```

### 14.4 让 AI 帮你排错

如果报错，不要只说“不能运行”。
要把关键信息发给 AI：

```text
我在运行 npm run dev 时遇到错误。
错误信息如下：
......

相关文件：
src/app.js
src/routes/knowledge.js

我刚刚新增了 /api/knowledge/create 接口。
请帮我判断错误原因，并给出最小修改方案。
```

如果 uni-app 请求失败：

```text
我在 Android 真机 uni-app 里调用 Fastify 后端失败。
后端地址是：http://192.168.2.118:3000
手机浏览器能 / 不能打开 /health。
uni.request fail 输出如下：
......

请帮我排查是 IP、端口、防火墙、HTTP 明文请求，还是代码问题。
```

## 15. 一周开发计划

### 第 0 天：课堂当天

目标：跟上老师，不追求做完整项目。

完成：

- 两个项目都能打开。
- Fastify 能启动。
- 手机能访问 `/health`。
- uni-app 能连接耳机。
- 能录音并拿到 `audio.filePath`。
- 选定实战命题。
- 能用 `uni.request` 调 `/api/ai/process`。

### 第 1 天：确定 MVP

完成一页项目说明：

```text
项目名称：
选题方向：
目标用户：
使用场景：
核心流程：
页面列表：
后端接口列表：
最低演示链路：
```

不要设计太多功能。
先保证一周内能做完。

### 第 2 天：改造前端页面

建议优先改：

```text
pages/transcript/transcript.vue
```

完成：

- 显示 `filePath`。
- 增加“调用后端处理”按钮。
- 展示 mock 转写文本。
- 展示摘要、关键词、建议。
- 处理 loading 和 error 状态。

### 第 3 天：新增后端接口

完成：

- 在 `src/routes/` 下新增自己的业务路由。
- 在 `src/app.js` 注册。
- 用 `curl` 测试通过。
- 返回结构和前端页面字段一致。

### 第 4 天：前后端联调

完成：

- App 能请求你新增的接口。
- 后端能收到参数。
- App 能展示后端返回结果。
- 手机浏览器和 uni-app 都能访问后端。

### 第 5 天：真实音频上传

完成：

- 用 `uni.uploadFile` 上传 `filePath`。
- 后端保存文件到 `uploads/audio/`。
- 后端返回处理结果。
- App 展示处理结果。

如果上传实在卡住，也要至少保证 `uni.request + filePath` 的 mock 业务链路可以演示。

### 第 6 天：完善体验

完成：

- 页面排版更清楚。
- 错误提示更友好。
- 结果页更像你的命题场景。
- 增加历史记录或复制结果。
- 准备演示数据。

### 第 7 天：准备答辩

准备 5 分钟演示：

```text
1. 我们选了什么命题
2. 目标用户是谁
3. 现场连接耳机
4. 现场录音
5. 展示 filePath
6. 调用后端
7. 展示业务结果
8. 说明代码结构和 AI 辅助过程
```

## 16. 小组分工建议

如果 3 人一组：

| 角色 | 负责内容 |
| --- | --- |
| 前端同学 | 改 uni-app 页面、调用接口、展示结果 |
| 后端同学 | 写 Fastify 路由、mock 业务逻辑、保存记录 |
| 产品/联调同学 | 选题、流程、提示词、测试真机、准备演示 |

如果 4 人一组，可以多一个“测试和演示负责人”。

每个人都要理解主链路：

```text
耳机录音 -> filePath -> 后端接口 -> 业务结果 -> 页面展示
```

不能只有一个人会运行项目。

## 17. 前端页面建议结构

一个清楚的业务结果页可以包含：

```text
顶部：项目名称、当前命题
音频区：filePath、上传状态、重新处理按钮
转写区：转写文本
结果区：摘要、关键词、翻译、建议、复习问题等
记录区：保存结果、查看历史
错误区：请求失败时显示错误
```

前端状态可以这样设计：

```js
data() {
  return {
    filePath: '',
    topic: '语音知识库系统',
    loading: false,
    error: '',
    transcript: '',
    summary: '',
    keywords: [],
    suggestions: [],
    reviewQuestions: []
  }
}
```

请求时建议：

```js
async processAudio() {
  if (!this.filePath) {
    this.error = '请先从录音页进入，并带上音频文件路径'
    return
  }

  this.loading = true
  this.error = ''

  uni.request({
    url: `${API_BASE_URL}/api/ai/process`,
    method: 'POST',
    data: {
      topic: this.topic,
      filePath: this.filePath
    },
    success: (res) => {
      const result = res.data.data
      this.transcript = result.transcript.text
      this.summary = result.summary
      this.keywords = result.keywords || []
      this.suggestions = result.suggestions || []
    },
    fail: (error) => {
      this.error = '请求后端失败，请检查 IP、WiFi 和后端是否启动'
      console.log(error)
    },
    complete: () => {
      this.loading = false
    }
  })
}
```

## 18. 后端接口建议结构

一个简单 Fastify 路由通常长这样：

```js
export async function demoRoutes(app) {
  app.post('/create', async (request) => {
    const body = request.body || {}

    return {
      ok: true,
      data: {
        input: body,
        message: '处理成功',
        createdAt: new Date().toISOString()
      }
    }
  })
}
```

然后在 `src/app.js` 注册：

```js
import { demoRoutes } from './routes/demo.js'

await app.register(demoRoutes, { prefix: '/api/demo' })
```

最终接口：

```text
POST /api/demo/create
```

记住：

```text
prefix + 路由路径 = 最终接口路径
```

## 19. 如何从 mock 走向真实 AI 接口

课堂和一周作业可以先用 mock。
如果你要接真实 ASR 或大模型接口，建议后期再做。

原则：

- 不要把 API Key 写死在前端。
- 不要把 API Key 提交到 Git。
- API Key 应该放在后端 `.env` 文件里。
- 前端只请求自己的 Fastify 后端。
- 后端再去请求第三方 AI 服务。

错误示范：

```js
// 不要这样：把密钥写进 uni-app 前端
const API_KEY = 'sk-xxxx'
```

更合理的方向：

```text
uni-app -> Fastify 后端 -> 第三方 ASR / 大模型接口
```

## 20. 常见问题排查

### 20.1 手机打不开 /health

检查：

- 手机和电脑是否在同一个 WiFi。
- 后端是否正在 `npm run dev`。
- 后端是否监听 `0.0.0.0`。
- 访问地址是否是电脑 IP，不是 `localhost`。
- Windows 防火墙是否允许 Node.js。
- 学校 WiFi 是否开启客户端隔离。

如果学校 WiFi 不行，可以用手机热点。

### 20.2 uni-app 请求失败，但手机浏览器能打开 /health

检查：

- `API_BASE_URL` 是否写对。
- 接口路径是否写对。
- 请求方法是否正确，GET 和 POST 不要写反。
- 后端终端有没有报错。
- Android 是否允许 HTTP 明文请求。

### 20.3 后端接口返回 404

通常是路径没注册对。

检查：

```js
await app.register(yourRoutes, { prefix: '/api/xxx' })
```

以及路由里：

```js
app.post('/create', ...)
```

最终路径应该是：

```text
/api/xxx/create
```

### 20.4 后端接口返回 500

看后端终端日志。
常见原因：

- JS 变量名写错。
- `request.body` 里没有你以为的字段。
- JSON 写法错误。
- import 路径错误。
- 忘记导出路由函数。

### 20.5 上传失败

检查：

- `uni.uploadFile` 的 `filePath` 是否为空。
- `name` 是否是 `audio`。
- 后端 `/api/audio/upload` 是否正常。
- 上传文件是否太大。
- 后端 `uploads/audio/` 目录是否存在。

### 20.6 录音没有 filePath

检查：

- 是否已经连接耳机。
- 是否真的点击了开始录音。
- 是否等待了一会再停止。
- stopRecording 是否报错。
- 是否选择了 `wav` 或 `mp3` 输出。

## 21. 提交内容要求

最终建议提交：

```text
1. 项目源码
2. 项目说明文档
3. 演示视频或现场演示
4. Vibe Coding 过程记录
5. 关键问题和解决记录
```

项目说明文档建议包含：

```text
项目名称：
选择命题：
小组成员：
目标用户：
核心功能：
前端页面：
后端接口：
运行方式：
演示流程：
AI 辅助开发过程：
未完成和可改进点：
```

Vibe Coding 过程记录建议包含：

```text
使用过的关键提示词：
AI 生成了哪些代码：
我们自己修改了哪些地方：
遇到的 bug：
如何验证修复成功：
```

## 22. 最后提醒

这次项目不是比赛谁让 AI 写得最多。
真正重要的是：

```text
你能不能把一个真实硬件能力，变成一个能解决具体问题/场景的应用。
```

请始终围绕这条链路开发：

```text
连接耳机
  -> 获取录音
  -> 得到 filePath
  -> 调用后端
  -> 返回业务结果
  -> 页面展示
```

如果某个功能会让你偏离这条主线，比如复杂登录、复杂数据库、过度动画、过度页面美化，可以先放到最后。
先让主流程跑起来，再让它变好看、变完整。
