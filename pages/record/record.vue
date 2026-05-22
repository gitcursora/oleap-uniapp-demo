<template>
  <view class="page">
    <view class="panel">
      <view class="title">实时录音</view>
      <view class="row">
        <text>模式</text>
        <text class="value">{{ mock ? 'Mock' : 'Native' }}</text>
      </view>
      <view class="row">
        <text>连接</text>
        <text class="value">{{ connectionLabel }}</text>
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
import { formatSdkError, getDemoMockMode } from '@/utils/demo-runtime.js'

export default {
  data() {
    return {
      mock: true,
      connection: {
        connected: false,
        device: null
      },
      scene: 'meeting',
      format: 'wav',
      sceneOptions: [
        { label: '会议', value: 'meeting' },
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
    }
  },
  async onLoad() {
    this.mock = getDemoMockMode()
    await this.safeRun(async () => {
      await OleapBle.init({ mock: this.mock, logLevel: 'debug' })
      this.connection = OleapBle.getConnectionState()
      this.installSubscriptions()
    })
  },
  onUnload() {
    this.disposeSubscriptions()
  },
  methods: {
    installSubscriptions() {
      this.disposeSubscriptions()
      this.disposers.push(
        OleapBle.onConnectionChanged((event) => {
          this.connection = {
            connected: event.connected,
            device: event.device || null
          }
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
        }),
        OleapBle.onDecodeProgress((event) => {
          this.decode = {
            phase: event.phase || 'decoding',
            progress: event.progress || 0
          }
        }),
        OleapBle.onError((error) => {
          this.error = formatSdkError(error)
        })
      )
    },
    disposeSubscriptions() {
      this.disposers.forEach((dispose) => dispose())
      this.disposers = []
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
      await this.safeRun(async () => {
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
        } finally {
          this.busy = false
        }
      })
    },
    async stop() {
      if (!this.active) {
        return
      }
      await this.safeRun(async () => {
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
        } catch (error) {
          if (this.shouldClearActiveAfterStopError(error)) {
            this.active = false
          }
          throw error
        } finally {
          this.busy = false
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
    goTranscript() {
      if (!this.result?.filePath) {
        return
      }
      uni.navigateTo({
        url: `/pages/transcript/transcript?filePath=${encodeURIComponent(this.result.filePath)}`
      })
    },
    async safeRun(action) {
      try {
        this.error = ''
        await action()
      } catch (error) {
        this.error = formatSdkError(error) || '操作失败'
      }
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

.error-text {
  margin-top: 12rpx;
}
</style>
