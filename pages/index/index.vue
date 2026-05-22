<template>
  <view class="page">
    <view class="panel">
      <view class="title">Oleap BLE</view>
      <view class="row">
        <text>模式</text>
        <text class="value">{{ mock ? 'Mock' : 'Native' }}</text>
      </view>
      <view class="row">
        <text>蓝牙</text>
        <text class="value">{{ bluetooth.enabled ? '可用' : '不可用' }}</text>
      </view>
      <view class="row">
        <text>连接</text>
        <text class="value">{{ connected ? connectedDevice.name : '未连接' }}</text>
      </view>
      <view class="button-row">
        <button class="secondary-button" @click="requestPermissions">权限</button>
        <button class="primary-button" @click="scan">扫描</button>
        <button class="secondary-button" @click="disconnectDevice">断开</button>
      </view>
      <view v-if="error" class="muted">{{ error }}</view>
    </view>

    <view class="panel">
      <view class="section-title">设备</view>
      <view v-if="devices.length === 0" class="muted">暂无扫描结果</view>
      <view
        v-for="device in devices"
        :key="device.deviceId"
        class="list-item"
        @click="connectDevice(device)"
      >
        <view class="row">
          <text>{{ device.name }}</text>
          <text class="value">{{ device.rssi }} dBm</text>
        </view>
        <view class="code">{{ device.deviceId }}</view>
      </view>
    </view>

    <view class="panel">
      <view class="section-title">工作区</view>
      <view class="button-row">
        <button class="secondary-button" @click="go('/pages/device/device')">设备</button>
        <button class="secondary-button" @click="go('/pages/record/record')">录音</button>
        <button class="secondary-button" @click="go('/pages/flash/flash')">Flash</button>
        <button class="secondary-button" @click="go('/pages/transcript/transcript')">转写</button>
      </view>
    </view>
  </view>
</template>

<script>
import { OleapBle } from '@/uni_modules/oleap-ble-sdk/index.js'

export default {
  data() {
    return {
      mock: true,
      bluetooth: {
        supported: false,
        enabled: false
      },
      devices: [],
      connected: false,
      connectedDevice: null,
      error: '',
      disposers: []
    }
  },
  async onLoad() {
    await OleapBle.init({ mock: true, logLevel: 'debug' })
    this.bluetooth = await OleapBle.getBluetoothState()
    this.disposers.push(
      OleapBle.onDeviceFound((device) => {
        if (!this.devices.some((item) => item.deviceId === device.deviceId)) {
          this.devices.push(device)
        }
      }),
      OleapBle.onConnectionChanged((event) => {
        this.connected = event.connected
        this.connectedDevice = event.device || null
      })
    )
  },
  onUnload() {
    this.disposers.forEach((dispose) => dispose())
    this.disposers = []
  },
  methods: {
    async requestPermissions() {
      await this.safeRun(async () => {
        await OleapBle.requestPermissions()
        this.bluetooth = await OleapBle.getBluetoothState()
      })
    },
    async scan() {
      await this.safeRun(async () => {
        this.devices = []
        await OleapBle.startScan({ timeoutMs: 2500 })
      })
    },
    async connectDevice(device) {
      await this.safeRun(async () => {
        await OleapBle.connect({ deviceId: device.deviceId })
      })
    },
    async disconnectDevice() {
      await this.safeRun(async () => {
        await OleapBle.disconnect()
      })
    },
    go(url) {
      uni.navigateTo({ url })
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
