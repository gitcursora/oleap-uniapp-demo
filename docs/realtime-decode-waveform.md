# 实时音频流与波形图

## 概览

在原有**批量解码**（录音结束后统一解码）的基础上，新增了**实时音频流**模式：录音过程中每积累一定帧数就立即解码，并将 PCM 数据转换为波形图实时展示。

---

## 架构

```
BLE 音频帧
  │
  ▼
appendRecordingFramesToSession()
  │  批量解码模式：写入 .oleapframes 文件
  │  实时音频流模式：同时维护 realtimePendingFrames 队列
  │
  ▼（积累 12 帧 ≈ 480ms）
批量 Opus 解码
  │
  ├─► 写入 WAV 文件（边录边写）
  │
  ├─► emitDecodeProgress（进度事件）
  │
  └─► emitWaveformData（PCM 样本 → JS 层）
          │
          ▼
        updateWaveform()（RMS 计算）
          │
          ▼
        pendingQueue（动画队列）
          │
          ▼（每 20ms 消费一个柱子）
        AudioWaveform Canvas 绘制
```

---

## 文件改动

### `uni_modules/oleap-ble-sdk/utssdk/app-android/index.uts`

#### 新增常量
```typescript
const REALTIME_DECODE_BATCH_FRAMES = 12  // 每 12 帧（≈480ms）解码一次
```

#### RecordingSession 新增字段
| 字段 | 类型 | 说明 |
|---|---|---|
| `enableRealtimeStream` | `boolean` | 是否启用实时音频流 |
| `realtimeFormat` | `string` | 输出格式（仅支持 wav） |
| `realtimeDecoder` | `OpusDecoder?` | 解码器实例 |
| `realtimeOutputPath` | `string` | 输出文件路径 |
| `realtimeOutputStream` | `FileOutputStream?` | 输出流 |
| `realtimePcmBytes` | `Int` | 已写入 PCM 字节数 |
| `realtimeDecodedFrames` | `Int` | 已解码帧数 |
| `realtimeFailedFrames` | `Int` | 解码失败帧数 |
| `realtimePendingFrames` | `Array<ByteArray>` | 待解码帧队列 |

#### 新增函数
- **`initRealtimeDecoder(session)`** — 初始化解码器，创建输出文件并写入 44 字节 WAV 占位头
- **`finalizeRealtimeDecoding(session)`** — 录音结束时处理剩余帧、回写 WAV 头、返回 RecordingResult
- **`emitWaveformData(event)`** — 向 JS 层广播波形样本数据

#### 关键逻辑：PCM 样本提取
```typescript
// 每 64 个样本取 1 个（每帧 10 个点，12 帧 = 120 个点）
const sampleStep = 64
for (let i: Int = 0; i < pcm.size; i += 2) {
  if (i % (sampleStep * 2) == 0) {
    const sample = (pcm[i] & 0xff) | ((pcm[i + 1] & 0xff) << 8)
    const signedSample = sample > 32767 ? sample - 65536 : sample
    waveformSamples.push(signedSample)
  }
}
```

#### RecordingCommandRequest 新增字段
- `options: any | null` — 透传 startRecording 的原始参数，供 handleRecordingStartResponse 读取

#### 新增订阅方法
```typescript
export function onWaveformData(callback: NativeProgressCallback): () => void
```

---

### `uni_modules/oleap-ble-sdk/index.js`

新增方法和导出：
```javascript
onWaveformData(callback) {
  return nativeSubscribe('onWaveformData', callback)
}

export const onWaveformData = OleapBle.onWaveformData.bind(OleapBle)
```

---

### `components/audio-waveform.vue`

独立的波形图组件，基于 `uni.createCanvasContext` 绘制柱状波形。

#### Props
| Prop | 默认值 | 说明 |
|---|---|---|
| `canvasId` | `'waveform-canvas'` | Canvas ID，同一页面多个实例时需唯一 |
| `width` | `700` | 画布逻辑宽度（px） |
| `height` | `160` | 画布逻辑高度（px） |
| `barWidth` | `3` | 柱子宽度（px） |
| `barGap` | `1` | 柱子间距（px） |
| `barColor` | `'#007aff'` | 柱子颜色 |
| `backgroundColor` | `'#f0f0f0'` | 背景颜色 |

#### 对外方法
| 方法 | 说明 |
|---|---|
| `updateWaveform(data)` | 追加波形数据到动画队列，自动启动滚入动画 |
| `setWaveform(data)` | 直接设置完整波形数据（批量解码后用） |
| `stopAnimation()` | 立即停止动画并清空队列 |
| `reset()` | 重置波形图 |

#### 动画机制
- `updateWaveform` 只负责将新数据推入 `pendingQueue`
- `setInterval(20ms)` 每次从队列取出 1 个值绘制，形成平滑滚入效果
- 队列为空时自动停止定时器
- 画布宽度由 `uni.getSystemInfoSync().windowWidth - 32` 动态计算，避免画到屏幕外导致停顿

---

### `pages/record/record.vue`

#### 新增 UI
- **解码方式选择**：批量解码 / 实时音频流
- **解码模式标识**：绿色（实时）/ 蓝色（批量）
- **波形图面板**：录音中或录音完成后显示

#### 数据流
```javascript
// 订阅波形数据
OleapBle.onWaveformData((event) => {
  this.updateWaveform(event.samples)
})

// JS 层 RMS 计算（每 10 个样本为一组）
updateWaveform(samples) {
  const chunkSize = 10
  // ... RMS = sqrt(sum(x²) / n)
  this.$refs.waveform.updateWaveform(waveformData)
}

// 结束录音时立即停止动画
this.$refs.waveform.stopAnimation()
```

---

## 参数调优

| 参数 | 位置 | 当前值 | 说明 |
|---|---|---|---|
| `REALTIME_DECODE_BATCH_FRAMES` | `app-android/index.uts` | `12` | 每批解码帧数，值越小响应越快（≥5） |
| `sampleStep` | `app-android/index.uts` | `64` | PCM 采样间隔，越大传输数据越少 |
| `chunkSize` | `record.vue` | `10` | JS 层每组 RMS 样本数，影响柱子密度 |
| `setInterval` | `audio-waveform.vue` | `20ms` | 动画速度，越小滚动越快 |

**平衡公式**：`BATCH_FRAMES × 40ms ÷ chunkSize × animInterval ≈ BATCH_FRAMES × 40ms`，保持动画消费速度 ≈ 数据产生速度，可避免停顿或积压。

---

## 限制

- 实时音频流仅支持 **Android**（iOS 的 `opus2wav` 是 native 一次性处理，无法逐帧调用）
- 实时音频流仅支持 **WAV** 格式（MP3 需要编码器，不适合逐帧输出）
- Flash 下载录音不支持实时音频流
