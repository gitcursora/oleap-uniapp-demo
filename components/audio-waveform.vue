<template>
  <view class="waveform-container">
    <canvas
      class="waveform-canvas"
      :canvas-id="canvasId"
      :id="canvasId"
    ></canvas>
  </view>
</template>

<script>
export default {
  name: 'AudioWaveform',
  props: {
    canvasId: {
      type: String,
      default: 'waveform-canvas'
    },
    width: {
      type: Number,
      default: 700
    },
    height: {
      type: Number,
      default: 160
    },
    barWidth: {
      type: Number,
      default: 3
    },
    barGap: {
      type: Number,
      default: 1
    },
    barColor: {
      type: String,
      default: '#007aff'
    },
    backgroundColor: {
      type: String,
      default: '#f0f0f0'
    }
  },
  data() {
    return {
      ctx: null,
      waveformData: [],
      maxBars: 0,
      pendingQueue: [],   // 待逐帧显示的数据队列
      animTimer: null     // 动画定时器
    }
  },
  mounted() {
    this.$nextTick(() => {
      setTimeout(() => {
        this.initCanvas()
      }, 200)
    })
  },
  beforeDestroy() {
    this.stopAnimation()
  },
  methods: {
    initCanvas() {
      const sysInfo = uni.getSystemInfoSync()
      // 用屏幕实际宽度（减去页面 padding）
      const screenWidth = sysInfo.windowWidth - 32
      this._realWidth = screenWidth
      this._realHeight = this.height

      this.ctx = uni.createCanvasContext(this.canvasId, this)
      this.maxBars = Math.floor(screenWidth / (this.barWidth + this.barGap))
      this.clearCanvas()
    },

    clearCanvas() {
      if (!this.ctx) return
      this.ctx.setFillStyle(this.backgroundColor)
      this.ctx.fillRect(0, 0, this._realWidth || this.width, this._realHeight || this.height)
      this.ctx.draw()
    },

    // 新数据进入队列，由动画定时器逐帧消费
    updateWaveform(newData) {
      if (!Array.isArray(newData) || newData.length === 0) return
      for (let i = 0; i < newData.length; i++) {
        this.pendingQueue.push(newData[i])
      }
      this.startAnimation()
    },

    startAnimation() {
      if (this.animTimer != null) return
      // 每 20ms 追加一个柱子，视觉上平滑滚入
      this.animTimer = setInterval(() => {
        if (this.pendingQueue.length === 0) {
          this.stopAnimation()
          return
        }
        const value = this.pendingQueue.shift()
        this.waveformData.push(value)
        if (this.waveformData.length > this.maxBars) {
          this.waveformData.shift()
        }
        this.drawWaveform()
      }, 80)
    },

    stopAnimation() {
      if (this.animTimer != null) {
        clearInterval(this.animTimer)
        this.animTimer = null
      }
    },

    setWaveform(waveformData) {
      if (!Array.isArray(waveformData) || waveformData.length === 0) return
      this.stopAnimation()
      if (waveformData.length > this.maxBars) {
        const step = waveformData.length / this.maxBars
        const downsampled = []
        for (let i = 0; i < this.maxBars; i++) {
          downsampled.push(waveformData[Math.floor(i * step)])
        }
        this.waveformData = downsampled
      } else {
        this.waveformData = waveformData
      }
      this.drawWaveform()
    },

    drawWaveform() {
      if (!this.ctx || this.waveformData.length === 0) return

      const w = this._realWidth || this.width
      const h = this._realHeight || this.height
      const centerY = h / 2
      const maxHeight = h * 0.8
      const maxValue = Math.max(...this.waveformData, 0.01)

      this.ctx.setFillStyle(this.backgroundColor)
      this.ctx.fillRect(0, 0, w, h)

      this.ctx.setFillStyle(this.barColor)
      for (let i = 0; i < this.waveformData.length; i++) {
        const normalizedValue = this.waveformData[i] / maxValue
        const barHeight = Math.max(2, normalizedValue * maxHeight)
        const x = i * (this.barWidth + this.barGap)
        const y = centerY - barHeight / 2
        this.ctx.fillRect(x, y, this.barWidth, barHeight)
      }

      this.ctx.draw()
    },

    reset() {
      this.stopAnimation()
      this.pendingQueue = []
      this.waveformData = []
      this.clearCanvas()
    }
  }
}
</script>

<style scoped>
.waveform-container {
  width: 100%;
  border-radius: 8rpx;
  overflow: hidden;
  background-color: #f0f0f0;
}

.waveform-canvas {
  width: 100%;
  height: 160rpx;
  display: block;
}
</style>
