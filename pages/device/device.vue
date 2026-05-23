<template>
  <view class="page">
    <view class="panel">
      <view class="title">设备状态</view>
      <view class="row">
        <text>连接</text>
        <text class="value">{{ connectionLabel }}</text>
      </view>
      <view class="row">
        <text>设备 ID</text>
        <text class="value path-value">{{ connectedDeviceId }}</text>
      </view>
      <view class="row">
        <text>通道</text>
        <text class="value">{{ channelLabel }}</text>
      </view>
      <view class="button-row">
        <button class="primary-button" @click="refresh">刷新</button>
        <button class="secondary-button" @click="refreshDiagnostics">诊断</button>
        <button class="secondary-button" @click="setEq">切换 EQ</button>
      </view>
      <view v-if="error" class="muted">{{ error }}</view>
    </view>

    <view class="panel">
      <view class="row">
        <text>电量</text>
        <text class="value">{{ device.battery }}%</text>
      </view>
      <view class="row">
        <text>SN</text>
        <text class="value">{{ device.sn }}</text>
      </view>
      <view class="row">
        <text>名称</text>
        <text class="value">{{ device.name }}</text>
      </view>
      <view class="row">
        <text>固件</text>
        <text class="value">{{ device.firmware }}</text>
      </view>
      <view class="row">
        <text>硬件</text>
        <text class="value">{{ device.hardware }}</text>
      </view>
      <view class="row">
        <text>EQ</text>
        <text class="value">{{ device.eq.currentMode }} / {{ device.eq.modeCount }}</text>
      </view>
      <view class="row">
        <text>录音帧</text>
        <text class="value">{{ recordState.recordedFrameCount }}</text>
      </view>
      <view class="row">
        <text>Flash</text>
        <text class="value">{{ flash.freeBlocks }} / {{ flash.totalBlocks }} blocks</text>
      </view>
    </view>

    <view class="panel">
      <view class="section-title">诊断</view>
      <view class="row">
        <text>控制</text>
        <text class="value">{{ controlDiagnosticLabel }}</text>
      </view>
      <view class="row">
        <text>录音</text>
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
      <view class="section-title">上报</view>
      <view v-if="reports.length === 0" class="muted">暂无 DP 上报</view>
      <view v-for="report in reports" :key="report.timestamp + report.dpId" class="list-item">
        <view class="row">
          <text>{{ report.name }}</text>
          <text class="value">0x{{ report.dpId.toString(16) }}</text>
        </view>
        <view class="code">{{ JSON.stringify(report.value) }}</view>
      </view>
    </view>
  </view>
</template>

<script>
import { OleapBle } from '@/uni_modules/oleap-ble-sdk/index.js'
import { formatSdkError } from '@/utils/demo-runtime.js'

export default {
  data() {
    return {
      device: {
        battery: 0,
        sn: '',
        name: '',
        firmware: '',
        hardware: '',
        eq: {
          modeCount: 0,
          currentMode: 0
        }
      },
      recordState: {
        recordedFrameCount: 0
      },
      flash: {
        totalBlocks: 0,
        freeBlocks: 0
      },
      connection: {
        connected: false,
        device: null,
        channels: null
      },
      diagnostics: {
        events: []
      },
      reports: [],
      error: '',
      disposers: []
    }
  },
  computed: {
    connectionLabel() {
      if (!this.connection.connected) {
        return '未连接'
      }
      return this.connection.device?.name || '已连接'
    },
    connectedDeviceId() {
      return this.connection.device?.deviceId || '-'
    },
    channelLabel() {
      const channels = this.connection.channels || this.diagnostics?.channels || {}
      const communication = channels.communicationReady ? '控制可用' : '控制未就绪'
      const record = channels.recordReady ? '录音可用' : '录音未就绪'
      const notify = channels.notificationsReady ? 'Notify可用' : 'Notify未就绪'
      return `${communication} / ${record} / ${notify}`
    },
    controlDiagnosticLabel() {
      const control = this.diagnostics?.control || {}
      if (control.active) {
        return `${control.active.kind || 'active'} DP ${control.active.dpId} #${control.active.sendSn}`
      }
      return `队列 ${control.queueDepth || 0} / 快照 ${control.snapshotSize || 0}`
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
      return events.slice(-8).reverse().map((event, index) => ({
        key: `${event.timestamp || index}-${event.event || index}`,
        event: event.event || 'event',
        time: this.shortTime(event.timestamp),
        details: this.stringifyDetails(event.details)
      }))
    }
  },
  async onLoad() {
    await this.safeRun(async () => {
      await OleapBle.init({ logLevel: 'debug' })
      this.disposers.push(
        OleapBle.onDpReport((report) => {
          this.reports.unshift(report)
          this.reports = this.reports.slice(0, 8)
        })
      )
      this.refreshDiagnostics()
    })
    await this.refresh()
  },
  onUnload() {
    this.disposeSubscriptions()
  },
  methods: {
    disposeSubscriptions() {
      const disposers = this.disposers.splice(0)
      disposers.forEach((dispose) => {
        if (typeof dispose !== 'function') {
          return
        }
        try {
          dispose()
        } catch (error) {}
      })
    },
    refreshDiagnostics() {
      try {
        this.connection = OleapBle.getConnectionState()
        this.diagnostics = OleapBle.getDiagnostics() || { events: [] }
      } catch (error) {}
    },
    async refresh() {
      await this.safeRun(async () => {
        this.refreshDiagnostics()
        this.device.battery = await OleapBle.getBattery()
        this.device.sn = await OleapBle.getSn()
        this.device.name = await OleapBle.getDeviceName()
        this.device.firmware = await OleapBle.getFirmwareVersion()
        this.device.hardware = await OleapBle.getHardwareVersion()
        this.device.eq = await OleapBle.getEqMode()
        this.recordState = await OleapBle.getRecordState()
        this.flash = await OleapBle.getFlashCapacity()
      })
    },
    async setEq() {
      await this.safeRun(async () => {
        const next = (this.device.eq.currentMode + 1) % Math.max(1, this.device.eq.modeCount)
        this.device.eq = await OleapBle.setEqMode({ mode: next })
      })
    },
    copyDiagnostics() {
      uni.setClipboardData({
        data: JSON.stringify(this.diagnostics || {}, null, 2)
      })
    },
    shortTime(value) {
      if (!value) {
        return ''
      }
      return `${value}`.slice(11, 19)
    },
    stringifyDetails(value) {
      if (value == null) {
        return '{}'
      }
      try {
        return JSON.stringify(value)
      } catch (error) {
        return `${value}`
      }
    },
    async safeRun(action) {
      try {
        this.error = ''
        await action()
      } catch (error) {
        this.error = formatSdkError(error) || '操作失败'
      } finally {
        this.refreshDiagnostics()
      }
    }
  }
}
</script>

<style scoped>
.diagnostic-actions {
  margin-top: 12rpx;
}

.path-value {
  max-width: 520rpx;
}
</style>
