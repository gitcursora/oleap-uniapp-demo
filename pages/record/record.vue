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
        <text>阶段</text>
        <text class="value">{{ decode.phase }}</text>
      </view>
      <view class="row">
        <text>进度</text>
        <text class="value">{{ decodePercent }}%</text>
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
  data() {
    return {
      connection: {
        connected: false,
        device: null
      },
      scene: 'personal',
      format: 'wav',
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
    canStart() {
      return this.connection.connected && !this.active && !this.busy
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
          const started = await OleapBle.startRecording({ scene: this.scene })
          this.progress.sessionId = started?.sessionId || ''
          this.decode = {
            phase: 'recording',
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
</style>
