<template>
  <view class="page">
    <view class="panel">
      <view class="title">Flash 文件</view>
      <view class="button-row">
        <button class="primary-button" @click="loadFiles">刷新</button>
        <button class="secondary-button" @click="stopDownload">停止</button>
      </view>
      <view v-if="error" class="muted">{{ error }}</view>
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
        <button class="secondary-button" @click="download(file)">下载</button>
      </view>
    </view>

    <view class="panel">
      <view class="section-title">进度</view>
      <view class="row">
        <text>下载</text>
        <text class="value">{{ progress }}%</text>
      </view>
      <view v-if="result" class="row">
        <text>文件</text>
        <text class="value">{{ result.filePath }}</text>
      </view>
    </view>
  </view>
</template>

<script>
import { OleapBle } from '@/uni_modules/oleap-ble-sdk/index.js'

export default {
  data() {
    return {
      files: [],
      progress: 0,
      result: null,
      error: '',
      disposers: []
    }
  },
  async onLoad() {
    await OleapBle.init({ mock: true, logLevel: 'debug' })
    this.disposers.push(
      OleapBle.onRecordingProgress((event) => {
        if (!event.flash) return
        this.progress = event.progress || 0
      })
    )
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
        this.progress = 0
        this.result = await OleapBle.downloadFlashRecording({
          fileId: file.fileId,
          format: 'wav',
          deleteAfterSuccess: false
        })
      })
    },
    async stopDownload() {
      await this.safeRun(async () => {
        await OleapBle.stopFlashDownload()
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
