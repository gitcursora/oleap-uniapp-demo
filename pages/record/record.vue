<template>
  <view class="page">
    <view class="panel">
      <view class="title">实时录音</view>
      <view class="row">
        <text>连接</text>
        <text class="value">{{ connectionLabel }}</text>
      </view>
      <view class="row">
        <text>设备 ID</text>
        <text class="value path-value">{{ connectedDeviceId }}</text>
      </view>
      <view class="row">
        <text>录音通道</text>
        <text class="value">{{ recordChannelLabel }}</text>
      </view>
      <view class="row">
        <text>状态</text>
        <text class="value">{{ statusLabel }}</text>
      </view>

      <view class="section-title control-title">场景</view>
      <view class="button-row option-row">
        <button
          v-for="item in sceneOptions"
          :key="item.value"
          :class="scene === item.value ? 'primary-button' : 'secondary-button'"
          :disabled="active || busy"
          @click="scene = item.value"
        >
          {{ item.label }}
        </button>
      </view>

      <view class="section-title control-title">输出</view>
      <view class="button-row option-row">
        <button
          v-for="item in formatOptions"
          :key="item.value"
          :class="format === item.value ? 'primary-button' : 'secondary-button'"
          :disabled="active || busy"
          @click="format = item.value"
        >
          {{ item.label }}
        </button>
      </view>

      <view class="section-title control-title">解码方式</view>
      <view class="button-row option-row">
        <button
          v-for="item in decodeModeOptions"
          :key="item.value"
          :class="decodeMode === item.value ? 'primary-button' : 'secondary-button'"
          :disabled="active || busy"
          @click="decodeMode = item.value"
        >
          {{ item.label }}
        </button>
      </view>
      <view v-if="decodeMode === 'realtime' && format !== 'wav'" class="muted hint-text">
        实时音频流仅支持 WAV 格式
      </view>

      <view class="button-row action-row">
        <button class="primary-button" :disabled="!canStart" @click="start">开始</button>
        <button class="danger-button" :disabled="!canStop" @click="stop">结束</button>
      </view>
      <view v-if="error" class="muted error-text">{{ error }}</view>
    </view>

    <view class="panel">
      <view class="section-title">诊断</view>
      <view class="row">
        <text>命令</text>
        <text class="value">{{ recordingDiagnosticLabel }}</text>
      </view>
      <view class="button-row diagnostic-actions">
        <button class="secondary-button" @click="copyDiagnostics">复制</button>
      </view>
      <view v-for="item in recentDiagnostics" :key="item.key" class="list-item">
        <view class="row">
          <text>{{ item.event }}</text>
          <text class="value">{{ item.time }}</text>
        </view>
        <view class="code">{{ item.details }}</view>
      </view>
    </view>

    <view class="panel">
      <view class="section-title">录音流</view>
      <view class="row">
        <text>时长</text>
        <text class="value">{{ durationSeconds }}s</text>
      </view>
      <view class="row">
        <text>帧数</text>
        <text class="value">{{ progress.frameCount }}</text>
      </view>
      <view class="row">
        <text>帧长</text>
        <text class="value">{{ progress.frameLen || '-' }}</text>
      </view>
      <view class="row">
        <text>采样</text>
        <text class="value">{{ progress.sampleRate || '-' }} Hz / {{ progress.channels || '-' }} ch</text>
      </view>
      <view class="row">
        <text>丢包</text>
        <text class="value">{{ progress.lostFrames }}</text>
      </view>
      <view class="row">
        <text>乱序</text>
        <text class="value">{{ progress.outOfOrderFrames }}</text>
      </view>
      <view class="row">
        <text>坏帧</text>
        <text class="value">{{ progress.badFrames }}</text>
      </view>
    </view>

    <view class="panel">
      <view class="section-title">解码</view>
      <view class="row">
        <text>模式</text>
        <text class="value" :class="decodeModeClass">{{ decodeModeLabel }}</text>
      </view>
      <view class="row">
        <text>阶段</text>
        <text class="value">{{ decode.phase }}</text>
      </view>
      <view class="row">
        <text>进度</text>
        <text class="value">{{ decodePercent }}%</text>
      </view>
    </view>

    <view v-if="active || result" class="panel">
      <view class="section-title">波形图</view>
      <audio-waveform
        ref="waveform"
        canvas-id="recording-waveform"
        :width="700"
        :height="160"
        :bar-width="3"
        :bar-gap="1"
        :bar-color="decodeMode === 'realtime' ? '#34c759' : '#007aff'"
      ></audio-waveform>
    </view>

    <view v-if="decodeMode === 'realtime' && (active || pcmLog.length > 0)" class="panel">
      <view class="section-title">PCM 回调（最近 10 次）</view>
      <view v-if="pcmLog.length === 0" class="muted">等待数据...</view>
      <view v-for="item in pcmLog" :key="item.key" class="list-item">
        <view class="row">
          <text>{{ item.durationMs }}ms</text>
          <text class="value">{{ item.byteLength }} 字节</text>
        </view>
        <view class="code">{{ item.preview }}</view>
      </view>
    </view>

    <view v-if="result" class="panel">
      <view class="section-title">文件</view>
      <view class="row">
        <text>格式</text>
        <text class="value">{{ result.format }}</text>
      </view>
      <view class="row">
        <text>时长</text>
        <text class="value">{{ Math.floor((result.durationMs || 0) / 1000) }}s</text>
      </view>
      <view class="row">
        <text>大小</text>
        <text class="value">{{ resultSizeKb }} KB</text>
      </view>
      <view class="row">
        <text>路径</text>
        <text class="value path-value">{{ result.filePath }}</text>
      </view>
      <view class="button-row">
        <button class="secondary-button" @click="copyPath">复制路径</button>
        <button class="secondary-button" @click="goTranscript">转写</button>
        <button class="secondary-button" @click="clearResult">清除</button>
      </view>
    </view>
  </view>
</template>

<script>
import { OleapBle } from '@/uni_modules/oleap-ble-sdk/index.js'
import AudioWaveform from '@/components/audio-waveform.vue'
import {
  copyOleapDiagnostics,
  disposeOleapDisposers,
  ensureOleapReady,
  formatOleapError,
  refreshOleapDiagnostics,
  registerOleapDisposers,
  runOleapAction,
  shortTime,
  stringifyDetails
} from '@/utils/oleap-page-runtime.js'

export default {
  components: { AudioWaveform },
  data() {
    return {
      connection: {
        connected: false,
        device: null
      },
      scene: 'personal',
      format: 'wav',
      decodeMode: 'batch',
      sceneOptions: [
        { label: '个人', value: 'personal' },
        { label: '通话', value: 'call' },
        { label: '媒体', value: 'media' },
        { label: '环境', value: 'ambient' }
      ],
      formatOptions: [
        { label: 'WAV', value: 'wav' },
        { label: 'MP3', value: 'mp3' }
      ],
      decodeModeOptions: [
        { label: '批量解码', value: 'batch' },
        { label: '实时音频流', value: 'realtime' }
      ],
      active: false,
      busy: false,
      progress: {
        sessionId: '',
        durationMs: 0,
        frameCount: 0,
        frameLen: 0,
        lostFrames: 0,
        outOfOrderFrames: 0,
        badFrames: 0,
        sampleRate: 0,
        channels: 0,
        bitrate: 0
      },
      decode: {
        phase: 'idle',
        progress: 0
      },
      result: null,
      error: '',
      pcmLog: [],
      diagnostics: {
        events: []
      },
      disposers: []
    }
  },
  computed: {
    connectionLabel() {
      if (!this.connection.connected) {
        return '未连接'
      }
      return this.connection.device?.name || this.connection.device?.deviceId || '已连接'
    },
    connectedDeviceId() {
      return this.connection.device?.deviceId || '-'
    },
    recordChannelLabel() {
      const channels = this.connection.channels || this.diagnostics?.channels || {}
      if (channels.recordReady && channels.notificationsReady) {
        return '可用'
      }
      if (channels.recordReady) {
        return '等待 Notify'
      }
      return '未就绪'
    },
    statusLabel() {
      if (this.busy) {
        return this.active ? '停止中' : '准备中'
      }
      return this.active ? '录音中' : '空闲'
    },
    durationSeconds() {
      return Math.floor((this.progress.durationMs || 0) / 1000)
    },
    decodePercent() {
      const raw = Number(this.decode.progress || 0)
      if (!Number.isFinite(raw)) {
        return 0
      }
      const percent = raw > 1 ? raw : raw * 100
      return Math.max(0, Math.min(100, Math.round(percent)))
    },
    decodeModeLabel() {
      if (!this.active && !this.result) {
        return this.decodeMode === 'realtime' ? '实时音频流' : '批量解码'
      }
      // 录音中或已完成，显示实际使用的模式
      if (this.decode.phase === 'realtime' || this.decode.phase === 'decoding') {
        return '实时音频流'
      }
      return '批量解码'
    },
    decodeModeClass() {
      return this.decodeMode === 'realtime' ? 'realtime-mode' : 'batch-mode'
    },
    canStart() {
      if (!this.connection.connected || this.active || this.busy) return false
      if (this.decodeMode === 'realtime' && this.format !== 'wav') return false
      return true
    },
    canStop() {
      return this.active && !this.busy
    },
    resultSizeKb() {
      return Math.max(1, Math.round((this.result?.size || 0) / 1024))
    },
    recordingDiagnosticLabel() {
      const recording = this.diagnostics?.recording || {}
      if (recording.pending) {
        return `等待 ${recording.pending.kind}`
      }
      if (recording.active) {
        return recording.active.sessionId || '录音中'
      }
      return '空闲'
    },
    recentDiagnostics() {
      const events = Array.isArray(this.diagnostics?.events) ? this.diagnostics.events : []
      return events
        .filter((event) => {
          const name = event.event || ''
          return name.indexOf('record') >= 0 || name.indexOf('write') >= 0 || name.indexOf('notify') >= 0
        })
        .slice(-8)
        .reverse()
        .map((event, index) => ({
          key: `${event.timestamp || index}-${event.event || index}`,
          event: event.event || 'event',
          time: this.shortTime(event.timestamp),
          details: this.stringifyDetails(event.details)
        }))
    }
  },
  async onLoad() {
    await runOleapAction(this, async () => {
      await ensureOleapReady()
      this.connection = OleapBle.getConnectionState()
      this.refreshDiagnostics()
      this.installSubscriptions()
    }, {
      after: () => {
        this.refreshDiagnostics()
      }
    })
  },
  onUnload() {
    disposeOleapDisposers(this)
  },
  methods: {
    installSubscriptions() {
      disposeOleapDisposers(this)
      registerOleapDisposers(
        this,
        OleapBle.onConnectionChanged((event) => {
          this.connection = {
            connected: event.connected,
            device: event.device || null,
            channels: event.channels || null
          }
          this.refreshDiagnostics()
        }),
        OleapBle.onRecordingProgress((event) => {
          if (event.flash) return
          this.progress = {
            ...this.progress,
            sessionId: event.sessionId || this.progress.sessionId,
            durationMs: event.durationMs || this.progress.durationMs || 0,
            frameCount: event.frameCount || this.progress.frameCount || 0,
            frameLen: event.frameLen || this.progress.frameLen || 0,
            lostFrames: event.lostFrames || 0,
            outOfOrderFrames: event.outOfOrderFrames || 0,
            badFrames: event.badFrames || 0,
            sampleRate: event.sampleRate || this.progress.sampleRate || 0,
            channels: event.channels || this.progress.channels || 0,
            bitrate: event.bitrate || this.progress.bitrate || 0
          }
          this.refreshDiagnostics()
        }),
        OleapBle.onDecodeProgress((event) => {
          this.decode = {
            phase: event.phase || 'decoding',
            progress: event.progress || 0
          }
        }),
        OleapBle.onWaveformData((event) => {
          if (this.$refs.waveform && event.samples) {
            this.updateWaveform(event.samples)
          }
        }),
        OleapBle.onRealtimePcmData((event) => {
          this.pcmLog.unshift({
            key: Date.now(),
            byteLength: event.byteLength,
            durationMs: event.durationMs,
            preview: event.pcmBase64 ? event.pcmBase64.slice(0, 24) + '...' : ''
          })
          if (this.pcmLog.length > 10) this.pcmLog.pop()
        }),
        OleapBle.onError((error) => {
          this.error = formatOleapError(error)
          this.refreshDiagnostics()
        })
      )
    },
    refreshDiagnostics() {
      refreshOleapDiagnostics(this)
    },
    resetSessionState() {
      this.progress = {
        sessionId: '',
        durationMs: 0,
        frameCount: 0,
        frameLen: 0,
        lostFrames: 0,
        outOfOrderFrames: 0,
        badFrames: 0,
        sampleRate: 0,
        channels: 0,
        bitrate: 0
      }
      this.decode = {
        phase: 'idle',
        progress: 0
      }
      this.result = null
      this.pcmLog = []
      // 重置波形图
      if (this.$refs.waveform) {
        this.$refs.waveform.reset()
      }
    },
    updateWaveform(samples) {
      if (!this.$refs.waveform || !Array.isArray(samples)) return

      // chunkSize=10 → 250샘플/10 = 25바, 40ms×25 = 1000ms = 배치 간격과 일치
      const chunkSize = 10
      const waveformData = []

      for (let i = 0; i < samples.length; i += chunkSize) {
        const chunk = samples.slice(i, Math.min(i + chunkSize, samples.length))
        let sum = 0
        for (let j = 0; j < chunk.length; j++) {
          const normalized = chunk[j] / 32768.0
          sum += normalized * normalized
        }
        const rms = Math.sqrt(sum / chunk.length)
        waveformData.push(rms)
      }

      this.$refs.waveform.updateWaveform(waveformData)
    },
    async start() {
      if (!this.connection.connected) {
        this.error = '请先在首页连接设备'
        return
      }
      await runOleapAction(this, async () => {
        this.busy = true
        this.resetSessionState()
        try {
          const enableRealtimeStream = this.decodeMode === 'realtime'
          const started = await OleapBle.startRecording({
            scene: this.scene,
            enableRealtimeStream: enableRealtimeStream,
            format: this.format
          })
          this.progress.sessionId = started?.sessionId || ''
          this.decode = {
            phase: enableRealtimeStream ? 'realtime' : 'recording',
            progress: 0
          }
          this.active = true
          this.refreshDiagnostics()
        } finally {
          this.busy = false
        }
      }, {
        after: () => {
          this.refreshDiagnostics()
        }
      })
    },
    async stop() {
      if (!this.active) {
        return
      }
      await runOleapAction(this, async () => {
        this.busy = true
        this.decode = {
          phase: 'stopping',
          progress: 0
        }
        try {
          this.result = await OleapBle.stopRecording({ format: this.format })
          this.active = false
          // 停止波形动画，清空未显示的队列
          if (this.$refs.waveform) {
            this.$refs.waveform.stopAnimation()
          }
          this.decode = {
            phase: 'completed',
            progress: 100
          }
          this.refreshDiagnostics()
        } catch (error) {
          if (this.shouldClearActiveAfterStopError(error)) {
            this.active = false
          }
          throw error
        } finally {
          this.busy = false
        }
      }, {
        after: () => {
          this.refreshDiagnostics()
        }
      })
    },
    shouldClearActiveAfterStopError(error) {
      const code = error?.code || ''
      return code === 'recording_not_active' || code.indexOf('decode') >= 0 || code.indexOf('opus_') === 0
    },
    copyPath() {
      if (!this.result?.filePath) {
        return
      }
      uni.setClipboardData({
        data: this.result.filePath
      })
    },
    clearResult() {
      this.result = null
    },
    copyDiagnostics() {
      copyOleapDiagnostics(this.diagnostics)
    },
    shortTime(value) {
      return shortTime(value)
    },
    stringifyDetails(value) {
      return stringifyDetails(value)
    },
    goTranscript() {
      if (!this.result?.filePath) {
        return
      }
      uni.navigateTo({
        url: `/pages/transcript/transcript?filePath=${encodeURIComponent(this.result.filePath)}`
      })
    }
  }
}
</script>

<style scoped>
.control-title {
  margin-top: 20rpx;
}

.option-row {
  margin-bottom: 8rpx;
}

.action-row {
  margin-top: 24rpx;
}

.path-value {
  max-width: 520rpx;
}

.diagnostic-actions {
  margin-top: 12rpx;
}

.error-text {
  margin-top: 12rpx;
}

.hint-text {
  margin-top: 8rpx;
  font-size: 24rpx;
  color: #ff9500;
}

.realtime-mode {
  color: #34c759;
  font-weight: 600;
}

.batch-mode {
  color: #007aff;
  font-weight: 600;
}
</style>
