import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const root = resolve(new URL('..', import.meta.url).pathname)
const androidIndex = readFileSync(
  resolve(root, 'uni_modules/oleap-ble-sdk/utssdk/app-android/index.uts'),
  'utf8'
)
const manifest = readFileSync(
  resolve(root, 'uni_modules/oleap-ble-sdk/utssdk/app-android/AndroidManifest.xml'),
  'utf8'
)

if (!existsSync(resolve(root, 'docs/phase-1-android-scan-acceptance-report.md'))) {
  fail('Missing Phase 1 Android scan acceptance report')
}

function fail(message) {
  throw new Error(message)
}

function mustContain(source, pattern, label) {
  if (!source.includes(pattern)) {
    fail(`Missing ${label}: ${pattern}`)
  }
}

function mustMatch(source, pattern, label) {
  if (!pattern.test(source)) {
    fail(`Missing ${label}: ${pattern}`)
  }
}

const requiredAndroidImports = [
  'android.bluetooth.BluetoothAdapter',
  'android.bluetooth.BluetoothManager',
  'android.bluetooth.le.ScanCallback',
  'android.bluetooth.le.ScanResult',
  'android.bluetooth.le.ScanSettings',
  'android.os.Build'
]

for (const importPath of requiredAndroidImports) {
  mustContain(androidIndex, importPath, 'Android native import')
}

const requiredPermissionStrings = [
  'android.permission.BLUETOOTH_SCAN',
  'android.permission.BLUETOOTH_CONNECT',
  'android.permission.ACCESS_FINE_LOCATION'
]

for (const permission of requiredPermissionStrings) {
  mustContain(androidIndex, permission, 'runtime permission handling')
  mustContain(manifest, permission, 'manifest permission')
}

mustContain(androidIndex, 'UTSAndroid.requestSystemPermission', 'permission request')
mustContain(androidIndex, 'UTSAndroid.checkSystemPermissionGranted', 'permission check')
mustContain(androidIndex, 'getBluetoothState', 'bluetooth state API')
mustContain(androidIndex, 'startScan', 'start scan API')
mustContain(androidIndex, 'stopScanInternal', 'scan cleanup helper')
mustContain(androidIndex, 'stopScan', 'stop scan API')
mustContain(androidIndex, 'OLEAP_NAME_PREFIX', 'Oleap software filter')
mustContain(androidIndex, "name.startsWith(OLEAP_NAME_PREFIX)", 'Oleap name filter')
mustContain(androidIndex, 'getScanRecord', 'ScanRecord fallback name')
mustContain(androidIndex, 'requestedTimeoutMs > 0', 'scan timeout lower bound')
mustContain(androidIndex, 'setScanMode(ScanSettings.SCAN_MODE_LOW_LATENCY)', 'low latency scan setting')
mustContain(androidIndex, 'setTimeout', 'scan timeout')
mustContain(androidIndex, 'clearTimeout', 'scan timeout cleanup')
mustContain(androidIndex, 'onDeviceFound', 'device found subscription')
mustContain(androidIndex, 'deviceFoundCallbacks.delete(callback)', 'device found unsubscribe')
mustContain(androidIndex, 'getDiagnostics', 'diagnostics export')
mustContain(androidIndex, 'connect_not_implemented', 'explicit P1-3 boundary')
mustMatch(androidIndex, /class\s+OleapScanCallback\s+extends\s+ScanCallback/, 'ScanCallback subclass')
mustMatch(androidIndex, /override\s+onScanResult/, 'onScanResult override')
mustMatch(androidIndex, /override\s+onScanFailed/, 'onScanFailed override')

if (androidIndex.includes('unsupportedPlatformError')) {
  fail('Android P1 implementation must not use unsupportedPlatformError')
}

console.log('P1 Android scan check passed')
