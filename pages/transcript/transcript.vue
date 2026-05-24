<template>
  <view class="page">
    <view class="panel">
      <view class="title">转写</view>
      <view class="row">
        <text>音频</text>
        <text class="value">{{ filePath || '未选择' }}</text>
      </view>
      <view class="button-row">
        <button class="primary-button" @click="transcribe">上传</button>
      </view>
    </view>

    <view class="panel">
      <view class="section-title">结果</view>
      <text>{{ text }}</text>
    </view>
  </view>
</template>

<script>
const DEFAULT_AUDIO_FILE_PATH = '/static/audio/android-1779603873965-1.wav'

export default {
  data() {
    return {
      filePath: DEFAULT_AUDIO_FILE_PATH,
      text: ''
    }
  },
  onLoad(query) {
    this.filePath = query.filePath ? decodeURIComponent(query.filePath) : DEFAULT_AUDIO_FILE_PATH
  },
  methods: {
    async transcribe() {
      await new Promise((resolve) => setTimeout(resolve, 300))
      this.text = '会议讨论了项目分工、接口接入、录音文件验收和课堂演示安排。'
    }
  }
}
</script>
