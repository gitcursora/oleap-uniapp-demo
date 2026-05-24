<template>
  <view class="home-page">
    <view class="hero">
      <view>
        <view class="eyebrow">Oleap BLE SDK</view>
        <view class="hero-title">课堂开发控制台</view>
        <view class="hero-subtitle">{{ heroSubtitle }}</view>
      </view>
      <view :class="connected ? 'status-pill online' : 'status-pill'">
        {{ connected ? '已连接' : '待连接' }}
      </view>
    </view>

    <view class="summary-grid">
      <view class="summary-cell">
        <text class="summary-label">蓝牙</text>
        <text class="summary-value">{{ bluetoothLabel }}</text>
        <text v-if="activeBtMac" class="summary-mac">{{ activeBtMac }}</text>
      </view>
      <view class="summary-cell">
        <text class="summary-label">设备</text>
        <text class="summary-value">{{ deviceCountLabel }}</text>
      </view>
      <view class="summary-cell wide">
        <text class="summary-label">连接</text>
        <text class="summary-value">{{ connectionLabel }}</text>
      </view>
    </view>

    <view v-if="connected" class="connected-card">
      <view class="connected-main">
        <view class="connected-kicker">当前连接</view>
        <view class="connected-name">{{ connectedDeviceName }}</view>
        <view class="connected-id">{{ connectedDeviceId }}</view>
      </view>
      <button class="secondary-button small-button" :disabled="busy" @click="disconnectDevice">断开</button>
    </view>

    <view class="action-panel">
      <view class="action-copy">
        <view class="section-title">下一步</view>
        <view class="action-title">{{ primaryAction.title }}</view>
        <view class="muted">{{ primaryAction.description }}</view>
      </view>
      <view class="button-row compact-actions">
        <button
          v-for="action in primaryAction.actions"
          :key="action.key"
          :class="action.primary ? 'primary-button' : 'secondary-button'"
          :disabled="busy || action.disabled"
          @click="runPrimaryAction(action.key)"
        >
          {{ action.label }}
        </button>
      </view>
      <view v-if="error" class="error-box">{{ error }}</view>
    </view>

    <view class="panel workflow-panel">
      <view class="section-title">流程</view>
      <view class="flow">
        <view v-for="item in flowItems" :key="item.key" :class="item.done ? 'flow-item done' : 'flow-item'">
          <view class="flow-index">{{ item.index }}</view>
          <view>
            <view class="flow-title">{{ item.title }}</view>
            <view class="flow-note">{{ item.note }}</view>
          </view>
        </view>
      </view>
    </view>

    <view class="workspace-grid">
      <view
        v-for="entry in workspaceEntries"
        :key="entry.path"
        :class="entry.disabled ? 'workspace-card disabled' : 'workspace-card'"
        @click="openWorkspace(entry)"
      >
        <view class="workspace-top">
          <text class="workspace-title">{{ entry.title }}</text>
          <text class="workspace-tag">{{ entry.tag }}</text>
        </view>
        <view class="workspace-desc">{{ entry.description }}</view>
      </view>
    </view>

    <view class="panel">
      <view class="device-header">
        <view>
          <view class="section-title">扫描结果</view>
          <view class="muted">{{ scanning ? '扫描中' : scanSummary }}</view>
        </view>
        <button class="secondary-button small-button" :disabled="busy" @click="scan">刷新</button>
      </view>
      <view v-if="devices.length === 0" class="empty-state">暂无设备</view>
      <view
        v-for="(device, index) in devices"
        :key="deviceKey(device, index)"
        :class="deviceItemClass(device)"
        @click="connectDevice(device)"
      >
        <view>
          <view class="device-name">{{ deviceName(device) }}</view>
          <view v-if="deviceId(device)" class="code">{{ deviceId(device) }}</view>
          <view v-else class="code missing-id">设备 ID 缺失，请刷新扫描</view>
          <view class="device-source">{{ deviceSourceLabel(device) }}</view>
        </view>
        <view class="device-side">
          <text class="rssi">{{ deviceRssiLabel(device) }}</text>
          <text :class="deviceActionClass(device)">
            {{ deviceActionLabel(device) }}
          </text>
        </view>
      </view>
    </view>

    <view class="panel">
      <view class="section-title">最近事件</view>
      <view v-if="events.length === 0" class="empty-state">暂无事件</view>
      <view v-for="event in events" :key="event.id" class="event-row">
        <text class="event-time">{{ event.time }}</text>
        <text class="event-text">{{ event.text }}</text>
      </view>
    </view>
  </view>
</template>

<script>
import { OleapBle } from '@/uni_modules/oleap-ble-sdk/index.js'
import { getDemoLastDeviceId, setDemoLastDeviceId } from '@/utils/demo-runtime.js'
import {
  disposeOleapDisposers,
  ensureOleapReady,
  registerOleapDisposers,
  runOleapAction
} from '@/utils/oleap-page-runtime.js'

export default {
  data() {
    return {
      bluetooth: {
        supported: false,
        enabled: false,
        permissionGranted: false
      },
      activeBtMac: '',
      devices: [],
      connected: false,
      connectedDevice: null,
      busy: false,
      scanning: false,
      scanTimer: null,
      error: '',
      disposers: [],
      events: []
    }
  },
  computed: {
    heroSubtitle() {
      if (this.connected) {
        return this.connectedDevice?.name || this.connectedDevice?.deviceId || 'Oleap 设备已就绪'
      }
      return '使用真机蓝牙连接 Oleap 耳机，完成设备状态、录音和 Flash 验证'
    },
    bluetoothReady() {
      return this.bluetooth.enabled && this.bluetooth.permissionGranted === true
    },
    bluetoothLabel() {
      if (!this.bluetooth.supported) {
        return '不支持'
      }
      if (!this.bluetooth.enabled) {
        return '未开启'
      }
      return this.bluetooth.permissionGranted === true ? '可用' : '待授权'
    },
    connectionLabel() {
      if (!this.connected) {
        return '未连接'
      }
      return this.connectedDeviceId || this.connectedDevice?.name || '已连接'
    },
    connectedDeviceName() {
      return this.connectedDevice?.name || 'Oleap 设备'
    },
    connectedDeviceId() {
      return this.connectedDevice?.deviceId || '未知设备 ID'
    },
    deviceCountLabel() {
      return this.devices.length === 0 ? '无结果' : `${this.devices.length} 台`
    },
    scanSummary() {
      return this.devices.length === 0 ? '点击刷新开始扫描' : `发现 ${this.devices.length} 台设备`
    },
    flowItems() {
      return [
        {
          key: 'mode',
          index: '1',
          title: '准备耳机',
          note: '真机',
          done: true
        },
        {
          key: 'permission',
          index: '2',
          title: '蓝牙准备',
          note: this.bluetoothLabel,
          done: this.bluetoothReady
        },
        {
          key: 'scan',
          index: '3',
          title: '发现设备',
          note: this.deviceCountLabel,
          done: this.devices.length > 0
        },
        {
          key: 'connect',
          index: '4',
          title: '连接耳机',
          note: this.connected ? '已就绪' : '未连接',
          done: this.connected
        }
      ]
    },
    primaryAction() {
      if (!this.bluetoothReady) {
        const bluetoothOff = !this.bluetooth.enabled
        return {
          title: bluetoothOff ? '打开系统蓝牙' : '打开蓝牙权限',
          description: bluetoothOff ? '请先开启手机蓝牙，再回到页面刷新状态。' : '先完成系统授权，再开始扫描设备。',
          actions: [
            { key: bluetoothOff ? 'refreshBluetooth' : 'permission', label: bluetoothOff ? '刷新状态' : '授权', primary: true }
          ]
        }
      }
      if (this.devices.length === 0) {
        return {
          title: '扫描附近设备',
          description: '请保持耳机开机并靠近手机。',
          actions: [
            { key: 'scan', label: this.scanning ? '扫描中' : '扫描', primary: true, disabled: this.scanning }
          ]
        }
      }
      if (!this.connected) {
        return {
          title: '连接一台设备',
          description: '连接成功后可进入设备状态、实时录音和 Flash 文件页面。',
          actions: [
            { key: 'connectFirst', label: '连接首台', primary: true },
            { key: 'scan', label: '重新扫描', primary: false }
          ]
        }
      }
      return {
        title: '开始业务验证',
        description: '先看设备状态，再进入实时录音或 Flash 下载。',
        actions: [
          { key: 'record', label: '实时录音', primary: true },
          { key: 'device', label: '设备状态', primary: false },
          { key: 'disconnect', label: '断开', primary: false }
        ]
      }
    },
    workspaceEntries() {
      const locked = !this.connected
      return [
        {
          title: '设备状态',
          tag: 'DP',
          description: '电量、SN、版本、EQ、主动上报',
          path: '/pages/device/device',
          disabled: locked
        },
        {
          title: '实时录音',
          tag: 'WAV',
          description: '启动录音、结束解码、复制文件路径',
          path: '/pages/record/record',
          disabled: locked
        },
        {
          title: 'Flash 文件',
          tag: 'OFFLINE',
          description: '读取文件列表、下载并生成音频',
          path: '/pages/flash/flash',
          disabled: locked
        },
        {
          title: '转写测试',
          tag: 'APP',
          description: '选择录音文件后进入文本结果页',
          path: '/pages/transcript/transcript',
          disabled: false
        }
      ]
    }
  },
  async onLoad() {
    await this.initializeSdk()
  },
  onUnload() {
    disposeOleapDisposers(this)
    this.clearScanTimer()
  },
  methods: {
    async initializeSdk() {
      await this.runAction(async () => {
        await ensureOleapReady()
        this.bluetooth = await OleapBle.getBluetoothState()
        this.applyConnectionState()
        this.installSubscriptions()
        await this.bootstrapKnownDevices()
        this.addEvent('Native 模式已就绪')
        // #ifdef APP-PLUS
        if (plus.os.name === 'Android') {
          const activeBt = await OleapBle.getActiveBtDevice().catch(() => null)
          if (activeBt && activeBt.deviceId) {
            this.activeBtMac = activeBt.deviceId
          }
        }
        // #endif
      })
    },
    installSubscriptions() {
      disposeOleapDisposers(this)
      registerOleapDisposers(
        this,
        OleapBle.onDeviceFound((device) => {
          const normalized = this.normalizeDevice(device)
          if (!normalized) {
            this.addEvent('忽略缺少 ID 的设备，请重新扫描')
            return
          }
          const existingIndex = this.devices.findIndex((item) => this.deviceId(item) === normalized.deviceId)
          if (existingIndex < 0) {
            this.devices.push(normalized)
          } else {
            this.devices.splice(existingIndex, 1, {
              ...this.devices[existingIndex],
              ...normalized
            })
          }
          this.addEvent(`发现 ${normalized.name || normalized.deviceId}`)
        }),
        OleapBle.onConnectionChanged((event) => {
          this.connected = event.connected
          this.connectedDevice = event.device || null
          if (event.connected && event.device?.deviceId) {
            setDemoLastDeviceId(event.device.deviceId)
          }
          this.addEvent(event.connected ? '设备已连接' : '设备已断开')
        }),
        OleapBle.onDpReport((event) => {
          this.addEvent(`DP 上报 ${event.name || event.dpId}`)
        })
      )
    },
    clearScanTimer() {
      if (this.scanTimer) {
        clearTimeout(this.scanTimer)
        this.scanTimer = null
      }
    },
    isConnectedDevice(device) {
      return Boolean(this.connectedDevice?.deviceId && this.deviceId(device) === this.connectedDevice.deviceId)
    },
    deviceId(device) {
      return `${device?.deviceId || ''}`.trim()
    },
    deviceName(device) {
      return device?.name || 'Oleap 设备'
    },
    deviceKey(device, index) {
      return this.deviceId(device) || `${device?.source || 'device'}-${index}`
    },
    isConnectableDevice(device) {
      return this.deviceId(device).length > 0
    },
    deviceItemClass(device) {
      if (this.isConnectedDevice(device)) {
        return 'device-item connected-device'
      }
      return this.isConnectableDevice(device) ? 'device-item' : 'device-item disabled-device'
    },
    deviceActionClass(device) {
      if (this.isConnectedDevice(device)) {
        return 'connected-text'
      }
      return this.isConnectableDevice(device) ? 'connect-text' : 'disabled-text'
    },
    deviceActionLabel(device) {
      if (this.isConnectedDevice(device)) {
        return '已连接'
      }
      return this.isConnectableDevice(device) ? '连接' : '需扫描'
    },
    deviceSourceLabel(device) {
      if (device?.source === 'bonded') {
        return '已配对设备'
      }
      if (device?.source === 'remembered') {
        return '上次连接'
      }
      return '扫描发现'
    },
    deviceRssiLabel(device) {
      const rssi = Number(device?.rssi || 0)
      return rssi === 0 ? '信号未知' : `${rssi} dBm`
    },
    normalizeDevice(device) {
      const deviceId = this.deviceId(device)
      if (!deviceId) {
        return null
      }
      return {
        deviceId,
        name: device?.name || 'Oleap 设备',
        rssi: Number(device?.rssi || 0),
        manufacturerDataHex: device?.manufacturerDataHex || '',
        source: device?.source || 'scan'
      }
    },
    normalizeDeviceList(devices) {
      if (!Array.isArray(devices)) {
        return []
      }
      return devices
        .map((device) => this.normalizeDevice(device))
        .filter((device) => device != null)
    },
    preferredDevice(devices) {
      const connectableDevices = this.normalizeDeviceList(devices)
      if (connectableDevices.length === 0) {
        return null
      }
      const rememberedId = getDemoLastDeviceId('')
      if (rememberedId) {
        const remembered = connectableDevices.find((device) => device.deviceId === rememberedId)
        if (remembered) {
          return remembered
        }
      }
      return connectableDevices.length === 1 ? connectableDevices[0] : null
    },
    async autoConnectDevice(device, reason) {
      const normalized = this.normalizeDevice(device)
      if (!normalized || this.connected) {
        return false
      }
      this.addEvent(`尝试自动连接${reason}`)
      try {
        await OleapBle.connect({
          deviceId: normalized.deviceId,
          name: normalized.name || 'Oleap 设备'
        })
        return true
      } catch (error) {
        this.addEvent(`自动连接失败：${normalized.name || normalized.deviceId}`)
        return false
      }
    },
    async bootstrapKnownDevices() {
      if (!this.bluetoothReady || this.connected) {
        return
      }
      // Android: active classic BT device takes priority — same MAC works for BLE GATT
      // #ifdef APP-PLUS
      if (plus.os.name === 'Android') {
        const activeBtDevice = await OleapBle.getActiveBtDevice().catch(() => null)
        if (activeBtDevice && activeBtDevice.deviceId) {
          this.activeBtMac = activeBtDevice.deviceId
          const normalized = this.normalizeDevice({ ...activeBtDevice, source: 'bonded' })
          if (normalized) {
            this.devices = [normalized]
            this.addEvent(`发现已连接的经典蓝牙设备 ${normalized.name}`)
            await this.autoConnectDevice(normalized, '经典蓝牙设备')
            return
          }
        }
      }
      // #endif
      const knownDevices = await OleapBle.listKnownDevices().catch(() => [])
      const usableKnownDevices = this.normalizeDeviceList(knownDevices)
      if (Array.isArray(knownDevices) && knownDevices.length > usableKnownDevices.length) {
        this.addEvent(`${knownDevices.length - usableKnownDevices.length} 台已知设备缺少 ID，已忽略`)
      }
      if (usableKnownDevices.length > 0) {
        this.devices = usableKnownDevices
        this.addEvent(`已加载 ${usableKnownDevices.length} 台已知 Oleap 设备`)
        const preferred = this.preferredDevice(usableKnownDevices)
        if (preferred) {
          await this.autoConnectDevice(preferred, preferred.deviceId === getDemoLastDeviceId('') ? '上次设备' : '已知设备')
        }
        return
      }
      const rememberedId = getDemoLastDeviceId('')
      if (rememberedId) {
        const rememberedDevice = {
          deviceId: rememberedId,
          name: '上次连接的 Oleap 设备',
          rssi: 0,
          manufacturerDataHex: '',
          source: 'remembered'
        }
        this.devices = [rememberedDevice]
        await this.autoConnectDevice(rememberedDevice, '上次设备')
      }
    },
    applyConnectionState() {
      const connection = OleapBle.getConnectionState()
      this.connected = connection.connected
      this.connectedDevice = connection.device || null
    },
    async requestPermissions() {
      await this.runAction(async () => {
        const result = await OleapBle.requestPermissions()
        this.bluetooth = await OleapBle.getBluetoothState()
        const granted = result?.permissionGranted === true || result?.bluetooth === true
        this.addEvent(granted ? '蓝牙权限已授予' : '蓝牙权限未授予')
        if (granted) {
          await new Promise(resolve => setTimeout(resolve, 500))
          await this.bootstrapKnownDevices()
        }
      })
    },
    async refreshBluetoothState() {
      await this.runAction(async () => {
        this.bluetooth = await OleapBle.getBluetoothState()
        this.addEvent(`蓝牙状态：${this.bluetoothLabel}`)
      })
    },
    async scan() {
      await this.runAction(async () => {
        this.devices = []
        this.clearScanTimer()
        this.scanning = true
        try {
          await OleapBle.startScan({ timeoutMs: 3000 })
          this.bluetooth = await OleapBle.getBluetoothState().catch(() => this.bluetooth)
          this.addEvent('开始扫描')
        } catch (error) {
          this.scanning = false
          this.bluetooth = await OleapBle.getBluetoothState().catch(() => this.bluetooth)
          const knownDevices = await OleapBle.listKnownDevices().catch(() => [])
          const usableKnownDevices = this.normalizeDeviceList(knownDevices)
          if (usableKnownDevices.length > 0) {
            this.devices = usableKnownDevices
            this.addEvent(`BLE 扫描不可用，已加载 ${usableKnownDevices.length} 台已知设备`)
            return
          } else if (Array.isArray(knownDevices) && knownDevices.length > 0) {
            this.devices = []
            this.addEvent('已知设备缺少 ID，请开启蓝牙后重新扫描')
          }
          throw error
        }
        this.scanTimer = setTimeout(async () => {
          this.scanning = false
          this.scanTimer = null
          // #ifdef APP-PLUS
          if (plus.os.name === 'Android') {
            const activeBt = await OleapBle.getActiveBtDevice().catch(() => null)
            this.activeBtMac = activeBt?.deviceId || ''
            if (activeBt?.deviceId) {
              // only show the active classic BT device, filter out everything else
              const matched = this.devices.find(d => this.deviceId(d).toLowerCase() === activeBt.deviceId.toLowerCase())
              this.devices = matched
                ? [matched]
                : [this.normalizeDevice({ ...activeBt, source: 'bonded' })].filter(Boolean)
              this.addEvent(`扫描结束，经典蓝牙设备 ${activeBt.deviceId}`)
            } else {
              this.addEvent(`扫描结束，发现 ${this.devices.length} 台`)
            }
          } else {
          // #endif
            this.addEvent(`扫描结束，发现 ${this.devices.length} 台`)
          // #ifdef APP-PLUS
          }
          // #endif
          const preferred = this.preferredDevice(this.devices)
          if (!this.connected && preferred) {
            this.autoConnectDevice(preferred, preferred.deviceId === getDemoLastDeviceId('') ? '上次设备' : '扫描结果')
          }
        }, 3200)
      })
    },
    async connectDevice(device) {
      const normalized = this.normalizeDevice(device)
      if (!normalized) {
        this.error = '该设备条目缺少 deviceId，无法直接连接。请点击刷新重新扫描附近设备。'
        this.addEvent('连接失败：设备 ID 缺失')
        return
      }
      if (this.isConnectedDevice(device)) {
        this.addEvent(`当前已连接 ${normalized.deviceId}`)
        return
      }
      await this.runAction(async () => {
        await OleapBle.connect({ deviceId: normalized.deviceId, name: normalized.name })
      })
    },
    async disconnectDevice() {
      await this.runAction(async () => {
        await OleapBle.disconnect()
      })
    },
    async runPrimaryAction(key) {
      if (key === 'permission') {
        await this.requestPermissions()
        return
      }
      if (key === 'refreshBluetooth') {
        await this.refreshBluetoothState()
        return
      }
      if (key === 'scan') {
        await this.scan()
        return
      }
      if (key === 'connectFirst') {
        const first = this.devices.find((device) => this.isConnectableDevice(device))
        if (first) {
          await this.connectDevice(first)
        } else {
          this.error = '没有可连接的设备，请点击重新扫描'
        }
        return
      }
      if (key === 'record') {
        this.go('/pages/record/record')
        return
      }
      if (key === 'device') {
        this.go('/pages/device/device')
        return
      }
      if (key === 'disconnect') {
        await this.disconnectDevice()
      }
    },
    openWorkspace(entry) {
      if (entry.disabled) {
        this.error = '请先连接设备'
        return
      }
      this.go(entry.path)
    },
    go(url) {
      uni.navigateTo({ url })
    },
    addEvent(text) {
      const now = new Date()
      const time = `${`${now.getHours()}`.padStart(2, '0')}:${`${now.getMinutes()}`.padStart(2, '0')}:${`${now.getSeconds()}`.padStart(2, '0')}`
      this.events.unshift({
        id: `${Date.now()}-${Math.random()}`,
        time,
        text
      })
      this.events = this.events.slice(0, 8)
    },
    async runAction(action) {
      return runOleapAction(this, action, {
        busyKey: 'busy'
      })
    }
  }
}
</script>

<style scoped>
.home-page {
  min-height: 100vh;
  padding: 24rpx;
  box-sizing: border-box;
  background: #f5f7fb;
}

.hero {
  display: flex;
  justify-content: space-between;
  gap: 20rpx;
  padding: 28rpx 4rpx 24rpx;
}

.eyebrow {
  color: #116dff;
  font-size: 22rpx;
  font-weight: 700;
}

.hero-title {
  margin-top: 8rpx;
  color: #111827;
  font-size: 44rpx;
  font-weight: 800;
}

.hero-subtitle {
  margin-top: 12rpx;
  max-width: 560rpx;
  color: #526070;
  font-size: 24rpx;
  line-height: 1.5;
}

.status-pill {
  flex: 0 0 auto;
  align-self: flex-start;
  padding: 10rpx 18rpx;
  border-radius: 999px;
  color: #475569;
  background: #e8edf4;
  font-size: 22rpx;
}

.status-pill.online {
  color: #0f766e;
  background: #d9f4ee;
}

.action-panel,
.panel {
  background: #ffffff;
  border: 1px solid #dde3ea;
  border-radius: 8px;
  padding: 24rpx;
  margin-bottom: 20rpx;
}

.summary-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16rpx;
  margin-bottom: 20rpx;
}

.summary-cell {
  min-height: 116rpx;
  padding: 22rpx;
  border: 1px solid #dde3ea;
  border-radius: 8px;
  background: #ffffff;
  box-sizing: border-box;
}

.summary-cell.wide {
  grid-column: span 2;
}

.summary-label {
  display: block;
  color: #64748b;
  font-size: 22rpx;
}

.summary-value {
  display: block;
  margin-top: 10rpx;
  color: #0f172a;
  font-size: 30rpx;
  font-weight: 700;
  word-break: break-all;
}

.summary-mac {
  display: block;
  margin-top: 6rpx;
  color: #64748b;
  font-size: 20rpx;
  word-break: break-all;
}

.connected-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18rpx;
  padding: 24rpx;
  margin-bottom: 20rpx;
  border: 1px solid #99d8cb;
  border-radius: 8px;
  background: #edf7f4;
  box-sizing: border-box;
}

.connected-main {
  flex: 1;
  min-width: 0;
}

.connected-kicker {
  color: #0f766e;
  font-size: 20rpx;
  font-weight: 700;
}

.connected-name {
  margin-top: 8rpx;
  color: #0f172a;
  font-size: 30rpx;
  font-weight: 800;
}

.connected-id {
  margin-top: 6rpx;
  color: #475569;
  font-size: 24rpx;
  word-break: break-all;
}

.action-panel {
  display: flex;
  flex-direction: column;
  gap: 18rpx;
}

.action-title {
  margin-top: 8rpx;
  color: #111827;
  font-size: 34rpx;
  font-weight: 800;
}

.compact-actions {
  margin-top: 2rpx;
}

.error-box {
  padding: 18rpx;
  border-radius: 8px;
  color: #b42318;
  background: #fff1f0;
  font-size: 24rpx;
  line-height: 1.5;
}

.workflow-panel {
  padding-bottom: 10rpx;
}

.flow {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14rpx;
}

.flow-item {
  display: flex;
  gap: 14rpx;
  min-height: 96rpx;
  padding: 18rpx;
  border-radius: 8px;
  background: #f7f9fc;
  box-sizing: border-box;
}

.flow-item.done {
  background: #edf7f4;
}

.flow-index {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 44rpx;
  width: 44rpx;
  height: 44rpx;
  border-radius: 50%;
  color: #ffffff;
  background: #64748b;
  font-size: 22rpx;
  font-weight: 700;
}

.flow-item.done .flow-index {
  background: #0f766e;
}

.flow-title {
  color: #172033;
  font-size: 24rpx;
  font-weight: 700;
}

.flow-note {
  margin-top: 6rpx;
  color: #64748b;
  font-size: 22rpx;
}

.workspace-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16rpx;
  margin-bottom: 20rpx;
}

.workspace-card {
  min-height: 172rpx;
  padding: 22rpx;
  border-radius: 8px;
  border: 1px solid #dbe4ee;
  background: #ffffff;
  box-sizing: border-box;
}

.workspace-card.disabled {
  opacity: 0.52;
}

.workspace-top {
  display: flex;
  justify-content: space-between;
  gap: 12rpx;
}

.workspace-title {
  color: #111827;
  font-size: 28rpx;
  font-weight: 800;
}

.workspace-tag {
  flex: 0 0 auto;
  padding: 4rpx 10rpx;
  border-radius: 6px;
  color: #116dff;
  background: #eaf2ff;
  font-size: 18rpx;
  font-weight: 700;
}

.workspace-desc {
  margin-top: 18rpx;
  color: #526070;
  font-size: 22rpx;
  line-height: 1.45;
}

.device-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
  margin-bottom: 14rpx;
}

.small-button {
  min-width: 120rpx;
  height: 62rpx;
  line-height: 62rpx;
  font-size: 24rpx;
}

.empty-state {
  padding: 28rpx 0;
  color: #94a3b8;
  font-size: 24rpx;
  text-align: center;
}

.device-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
  padding: 20rpx 14rpx;
  border-top: 1px solid #eef2f6;
  border-radius: 8px;
  box-sizing: border-box;
}

.disabled-device {
  opacity: 0.62;
}

.connected-device {
  margin-top: 10rpx;
  border: 1px solid #99d8cb;
  background: #edf7f4;
}

.device-name {
  color: #111827;
  font-size: 28rpx;
  font-weight: 700;
}

.missing-id {
  color: #b45309;
}

.device-source {
  margin-top: 6rpx;
  color: #64748b;
  font-size: 20rpx;
}

.device-side {
  flex: 0 0 auto;
  text-align: right;
}

.rssi {
  display: block;
  color: #64748b;
  font-size: 22rpx;
}

.connect-text {
  display: block;
  margin-top: 8rpx;
  color: #116dff;
  font-size: 24rpx;
  font-weight: 700;
}

.disabled-text {
  display: block;
  margin-top: 8rpx;
  color: #b45309;
  font-size: 22rpx;
  font-weight: 700;
}

.connected-text {
  display: inline-block;
  margin-top: 8rpx;
  padding: 4rpx 10rpx;
  border-radius: 6px;
  color: #0f766e;
  background: #d9f4ee;
  font-size: 22rpx;
  font-weight: 700;
}

.event-row {
  display: flex;
  gap: 16rpx;
  padding: 14rpx 0;
  border-top: 1px solid #eef2f6;
}

.event-time {
  flex: 0 0 92rpx;
  color: #94a3b8;
  font-size: 22rpx;
}

.event-text {
  flex: 1;
  color: #334155;
  font-size: 24rpx;
  line-height: 1.45;
}

@media screen and (max-width: 360px) {
  .mode-card,
  .hero {
    flex-direction: column;
  }

  .workspace-grid,
  .flow {
    grid-template-columns: 1fr;
  }
}
</style>
