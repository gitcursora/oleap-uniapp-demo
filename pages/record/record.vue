<template>
  <view class="page">
    <view class="panel">
      <view class="title">实时录音</view>
      <view class="row">
        <text>状态</text>
        <text class="value">{{ active ? '录音中' : '空闲' }}</text>
      </view>
      <view class="row">
        <text>时长</text>
        <text class="value">{{ Math.floor(progress.durationMs / 1000) }}s</text>
      </view>
      <view class="row">
        <text>帧数</text>
        <text class="value">{{ progress.frameCount }}</text>
      </view>
      <view class="button-row">
        <button class="primary-button" @click="start">开始</button>
        <button class="danger-button" @click="stop">结束</button>
      </view>
      <view v-if="error" class="muted">{{ error }}</view>
    </view>

    <view class="panel">
      <view class="section-title">解码</view>
      <view class="row">
        <text>阶段</text>
        <text class="value">{{ decode.phase }}</text>
      </view>
      <view class="row">
        <text>进度</text>
        <text class="value">{{ Math.round((decode.progress || 0) * 100) }}%</text>
      </view>
    </view>

    <view v-if="result" class="panel">
      <view class="section-title">文件</view>
      <view class="row">
        <text>格式</text>
        <text class="value">{{ result.format }}</text>
      </view>
      <view class="row">
        <text>路径</text>
        <text class="value">{{ result.filePath }}</text>
      </view>
      <view class="button-row">
        <button class="secondary-button" @click="goTranscript">转写</button>
      </view>
    </view>
  </view>
</template>

<script>
import { OleapBle } from '@/uni_modules/oleap-ble-sdk/index.js'

export default {
  data() {
    return {
      active: false,
      progress: {
        durationMs: 0,
        frameCount: 0
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
  async onLoad() {
    await OleapBle.init({ mock: true, logLevel: 'debug' })
    this.disposers.push(
      OleapBle.onRecordingProgress((event) => {
        if (event.flash) return
        this.progress = {
          durationMs: event.durationMs || 0,
          frameCount: event.frameCount || 0
        }
      }),
      OleapBle.onDecodeProgress((event) => {
        this.decode = event
      })
    )
  },
  onUnload() {
    this.disposers.forEach((dispose) => dispose())
    this.disposers = []
  },
  methods: {
    async start() {
      await this.safeRun(async () => {
        await OleapBle.startRecording({ scene: 'meeting' })
        this.result = null
        this.active = true
      })
    },
    async stop() {
      await this.safeRun(async () => {
        this.result = await OleapBle.stopRecording({ format: 'wav' })
        this.active = false
      })
    },
    goTranscript() {
      uni.navigateTo({
        url: `/pages/transcript/transcript?filePath=${encodeURIComponent(this.result.filePath)}`
      })
    },
    async safeRun(action) {
      try {
        this.error = ''
        await action()
      } catch (error) {
        this.error = error.message || error.code || '操作失败'
      }
    }
  }
}
</script>
