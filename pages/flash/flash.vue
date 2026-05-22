<template>
  <view class="page">
    <view class="panel">
      <view class="title">Flash 文件</view>
      <view class="row">
        <text>模式</text>
        <text class="value">{{ mock ? 'Mock' : 'Native' }}</text>
      </view>
      <view class="row">
        <text>状态</text>
        <text class="value">{{ busy ? '下载中' : '空闲' }}</text>
      </view>

      <view class="section-title control-title">输出</view>
      <view class="button-row option-row">
        <button
          v-for="item in formatOptions"
          :key="item.value"
          :class="format === item.value ? 'primary-button' : 'secondary-button'"
          :disabled="busy"
          @click="format = item.value"
        >
          {{ item.label }}
        </button>
      </view>

      <view class="button-row option-row">
        <button
          :class="deleteAfterSuccess ? 'primary-button' : 'secondary-button'"
          :disabled="busy"
          @click="deleteAfterSuccess = !deleteAfterSuccess"
        >
          下载后删除队首
        </button>
      </view>

      <view class="button-row">
        <button class="primary-button" :disabled="busy" @click="loadFiles">刷新</button>
        <button class="secondary-button" :disabled="!busy" @click="stopDownload">停止</button>
      </view>
      <view v-if="error" class="muted error-text">{{ error }}</view>
    </view>

    <view class="panel">
      <view v-if="files.length === 0" class="muted">暂无文件</view>
      <view v-for="file in files" :key="file.fileId" class="list-item">
        <view class="row">
          <text>#{{ file.fileId }}</text>
          <text class="value">{{ Math.round(file.fileLength / 1024) }} KB</text>
        </view>
        <view class="row">
          <text>采样</text>
          <text class="value">{{ file.sampleRate }} Hz / {{ file.channels }} ch</text>
        </view>
        <view class="row">
          <text>时间</text>
          <text class="value">{{ file.recordTime || '-' }}</text>
        </view>
        <button class="secondary-button" :disabled="busy" @click="download(file)">下载</button>
      </view>
    </view>

    <view class="panel">
      <view class="section-title">进度</view>
      <view class="row">
        <text>下载</text>
        <text class="value">{{ progress }}%</text>
      </view>
      <view class="row">
        <text>帧数</text>
        <text class="value">{{ frameCount }}</text>
      </view>
      <view class="row">
        <text>坏帧</text>
        <text class="value">{{ badFrames }}</text>
      </view>
      <view v-if="result" class="row">
        <text>文件</text>
        <text class="value path-value">{{ result.filePath }}</text>
      </view>
      <view v-if="result" class="button-row result-actions">
        <button class="secondary-button" @click="copyPath">复制路径</button>
        <button class="secondary-button" @click="goTranscript">转写</button>
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
      files: [],
      format: 'wav',
      formatOptions: [
        { label: 'WAV', value: 'wav' },
        { label: 'MP3', value: 'mp3' }
      ],
      deleteAfterSuccess: false,
      busy: false,
      progress: 0,
      frameCount: 0,
      badFrames: 0,
      result: null,
      error: '',
      disposers: []
    }
  },
  async onLoad() {
    this.mock = getDemoMockMode()
    await this.safeRun(async () => {
      await OleapBle.init({ mock: this.mock, logLevel: 'debug' })
      this.disposers.push(
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
    this.disposers.forEach((dispose) => dispose())
    this.disposers = []
  },
  methods: {
    async loadFiles() {
      await this.safeRun(async () => {
        this.files = await OleapBle.listFlashRecordings()
      })
    },
    async download(file) {
      await this.safeRun(async () => {
        this.busy = true
        this.progress = 0
        this.frameCount = 0
        this.badFrames = 0
        this.result = null
        try {
          this.result = await OleapBle.downloadFlashRecording({
            fileId: file.fileId,
            format: this.format,
            deleteAfterSuccess: this.deleteAfterSuccess
          })
          this.progress = 100
          if (this.deleteAfterSuccess) {
            await this.loadFiles()
          }
        } finally {
          this.busy = false
        }
      })
    },
    async stopDownload() {
      await this.safeRun(async () => {
        await OleapBle.stopFlashDownload()
        this.busy = false
      })
    },
    copyPath() {
      if (!this.result?.filePath) {
        return
      }
      uni.setClipboardData({
        data: this.result.filePath
      })
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
  margin-bottom: 12rpx;
}

.result-actions {
  margin-top: 16rpx;
}

.path-value {
  max-width: 520rpx;
}

.error-text {
  margin-top: 12rpx;
}
</style>
