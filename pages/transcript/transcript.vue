<template>
  <view class="page">
    <view class="panel">
      <view class="title">转写</view>
      <view class="row">
        <text>音频</text>
        <text class="value">{{ filePath || '未选择' }}</text>
      </view>
      <view class="button-row">
        <button class="primary-button" :disabled="uploading" @click="transcribe">
          {{ uploading ? '上传中…' : '上传' }}
        </button>
      </view>
      <view v-if="errorMsg" class="error-text">{{ errorMsg }}</view>
    </view>

    <view class="panel">
      <view class="section-title">结果</view>
      <text>{{ text }}</text>
    </view>
  </view>
</template>

<script>
import { uploadAudio } from '@/utils/api.js'

const DEFAULT_AUDIO_FILE_PATH = '/static/audio/android-1779603873965-1.wav'

export default {
  data() {
    return {
      filePath: DEFAULT_AUDIO_FILE_PATH,
      uploading: false,
      text: '',
      errorMsg: ''
    }
  },
  onLoad(query) {
    this.filePath = query.filePath ? decodeURIComponent(query.filePath) : DEFAULT_AUDIO_FILE_PATH
  },
  methods: {
    async transcribe() {
      if (this.uploading) return
      this.uploading = true
      this.errorMsg = ''
      this.text = ''
      try {
        const data = await uploadAudio(this.filePath)
        this.text = data.result?.transcript?.text || JSON.stringify(data.result)
      } catch (err) {
        this.errorMsg = err.message || '上传失败'
      } finally {
        this.uploading = false
      }
    }
  }
}
</script>
