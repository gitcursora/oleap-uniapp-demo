<template>
  <view class="page">
    <view class="panel">
      <view class="title">设备状态</view>
      <view class="button-row">
        <button class="primary-button" @click="refresh">刷新</button>
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
      reports: [],
      error: '',
      disposers: []
    }
  },
  async onLoad() {
    await OleapBle.init({ mock: true, logLevel: 'debug' })
    this.disposers.push(
      OleapBle.onDpReport((report) => {
        this.reports.unshift(report)
        this.reports = this.reports.slice(0, 8)
      })
    )
    await this.refresh()
  },
  onUnload() {
    this.disposers.forEach((dispose) => dispose())
    this.disposers = []
  },
  methods: {
    async refresh() {
      await this.safeRun(async () => {
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
