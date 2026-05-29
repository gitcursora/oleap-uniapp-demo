import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const root = resolve(new URL('..', import.meta.url).pathname)
const androidIndex = readFileSync(
  resolve(root, 'uni_modules/oleap-ble-sdk/utssdk/app-android/index.uts'),
  'utf8'
)
const sdkFacade = readFileSync(
  resolve(root, 'uni_modules/oleap-ble-sdk/index.js'),
  'utf8'
)
const manifest = readFileSync(
  resolve(root, 'uni_modules/oleap-ble-sdk/utssdk/app-android/AndroidManifest.xml'),
  'utf8'
)
const appManifest = JSON.parse(readFileSync(resolve(root, 'manifest.json'), 'utf8'))

if (!existsSync(resolve(root, 'docs/phase-1-android-scan-acceptance-report.md'))) {
  fail('Missing Phase 1 Android scan acceptance report')
}

if (!existsSync(resolve(root, 'docs/phase-1-android-connect-acceptance-report.md'))) {
  fail('Missing Phase 1 Android connect acceptance report')
}

if (!existsSync(resolve(root, 'docs/phase-1-android-notify-write-acceptance-report.md'))) {
  fail('Missing Phase 1 Android notify/write acceptance report')
}

function fail(message) {
  throw new Error(message)
}

function mustContain(source, pattern, label) {
  if (!source.includes(pattern)) {
    fail(`Missing ${label}: ${pattern}`)
  }
}

function mustNotContain(source, pattern, label) {
  if (source.includes(pattern)) {
    fail(`Unexpected ${label}: ${pattern}`)
  }
}

function mustMatch(source, pattern, label) {
  if (!pattern.test(source)) {
    fail(`Missing ${label}: ${pattern}`)
  }
}

const requiredAndroidImports = [
  'android.bluetooth.BluetoothAdapter',
  'android.bluetooth.BluetoothGatt',
  'android.bluetooth.BluetoothGattCallback',
  'android.bluetooth.BluetoothGattCharacteristic',
  'android.bluetooth.BluetoothGattDescriptor',
  'android.bluetooth.BluetoothGattService',
  'android.bluetooth.BluetoothManager',
  'android.bluetooth.BluetoothProfile',
  'android.bluetooth.le.ScanCallback',
  'android.bluetooth.le.ScanResult',
  'android.content.BroadcastReceiver',
  'android.content.Intent',
  'android.content.IntentFilter',
  'android.os.Build'
]

for (const importPath of requiredAndroidImports) {
  mustContain(androidIndex, importPath, 'Android native import')
}

mustContain(sdkFacade, '// #ifdef APP', 'app UTS adapter condition')
mustContain(sdkFacade, "import * as appNativeAdapter from '@/uni_modules/oleap-ble-sdk'", 'static UTS plugin root import')
mustContain(sdkFacade, 'getPreloadedNativeAdapter', 'preloaded UTS adapter resolver')
mustContain(sdkFacade, 'ensureBlePermission', 'native permission guard')
mustContain(sdkFacade, 'bluetoothState?.permissionGranted === true', 'native permission granted fast path')
mustContain(sdkFacade, 'target_sdk_too_low', 'target SDK guard for Android 12 Bluetooth permissions')
mustContain(sdkFacade, 'requestAppPermissionsCompat', 'plus permission compatibility request')
mustNotContain(sdkFacade, "import('@/uni_modules/oleap-ble-sdk')", 'dynamic UTS import that triggers App iife code splitting')

const requiredPermissionStrings = [
  'android.permission.BLUETOOTH_SCAN',
  'android.permission.BLUETOOTH_CONNECT',
  'android.permission.ACCESS_FINE_LOCATION'
]

for (const permission of requiredPermissionStrings) {
  mustContain(androidIndex, permission, 'runtime permission handling')
  mustContain(manifest, permission, 'manifest permission')
}
mustContain(manifest, 'android:usesPermissionFlags="neverForLocation"', 'Bluetooth scan neverForLocation manifest flag')
mustContain(manifest, 'android:name="android.permission.ACCESS_FINE_LOCATION"', 'legacy location permission fallback')

const androidDistribute = appManifest['app-plus']?.distribute?.android
if (androidDistribute == null) {
  fail('manifest.json app-plus.distribute.android must explicitly set Android SDK levels')
}
if (Number(androidDistribute.targetSdkVersion) < 31) {
  fail('manifest.json app-plus.distribute.android.targetSdkVersion must be >= 31')
}
if (Number(androidDistribute.minSdkVersion) < 24) {
  fail('manifest.json app-plus.distribute.android.minSdkVersion must be >= 24')
}

mustContain(androidIndex, 'UTSAndroid.requestSystemPermission', 'permission request')
mustContain(androidIndex, 'UTSAndroid.checkSystemPermissionGranted', 'permission check')
mustContain(androidIndex, 'appTargetSdkVersion', 'runtime target SDK detection')
mustContain(androidIndex, 'usesAndroid12BluetoothPermissions', 'target-aware Android 12 permission mode')
mustContain(androidIndex, 'isAndroid12TargetTooLow', 'Android 12 target SDK low guard')
mustContain(androidIndex, 'target_sdk_too_low', 'Android 12 target SDK low error')
mustContain(androidIndex, 'permissionMode', 'permission mode diagnostics')
mustContain(androidIndex, "'legacy-location'", 'target SDK fallback permission mode')
mustContain(androidIndex, 'permissionGranted: hasRequiredPermissions()', 'bluetooth state permission flag')
mustContain(androidIndex, 'getBluetoothState', 'bluetooth state API')
mustContain(androidIndex, 'listKnownDevices', 'known device API')
mustContain(androidIndex, 'bondedOleapDevices', 'bonded device fallback')
mustContain(androidIndex, 'startScan', 'start scan API')
mustContain(androidIndex, 'stopScanInternal', 'scan cleanup helper')
mustContain(androidIndex, 'stopScan', 'stop scan API')
mustContain(androidIndex, 'OLEAP_NAME_PREFIX', 'Oleap software filter')
mustContain(androidIndex, 'normalizedDeviceName', 'case-insensitive device name normalization')
mustContain(androidIndex, 'isOleapDeviceName', 'Oleap name predicate')
mustContain(androidIndex, 'normalized.startsWith(OLEAP_NAME_PREFIX)', 'case-insensitive Oleap name filter')
mustContain(androidIndex, 'getScanRecord', 'ScanRecord fallback name')
mustContain(androidIndex, 'requestedTimeoutMs > 0', 'scan timeout lower bound')
mustContain(androidIndex, 'startClassicDiscoveryFallback', 'classic discovery fallback')
mustContain(androidIndex, 'BluetoothAdapter.ACTION_DISCOVERY_FINISHED', 'classic discovery completion signal')
mustContain(androidIndex, 'BluetoothDevice.ACTION_FOUND', 'classic discovery device found signal')
mustContain(androidIndex, 'scanner.startScan(callback)', 'simple BLE startScan compatibility path')
mustContain(androidIndex, 'setTimeout', 'scan timeout')
mustContain(androidIndex, 'clearTimeout', 'scan timeout cleanup')
mustContain(androidIndex, 'onDeviceFound', 'device found subscription')
mustContain(androidIndex, 'deviceFoundCallbacks.delete(callback)', 'device found unsubscribe')
mustContain(androidIndex, 'getDiagnostics', 'diagnostics export')
mustMatch(androidIndex, /class\s+OleapScanCallback\s+extends\s+ScanCallback/, 'ScanCallback subclass')
mustMatch(androidIndex, /override\s+onScanResult/, 'onScanResult override')
mustMatch(androidIndex, /override\s+onScanFailed/, 'onScanFailed override')

const requiredGattStrings = [
  'COMMUNICATION_SERVICE_UUID',
  'COMMUNICATION_NOTIFY_UUID',
  'COMMUNICATION_WRITE_UUID',
  'RECORD_SERVICE_UUID',
  'RECORD_NOTIFY_UUID',
  'RECORD_WRITE_UUID',
  'BluetoothProfile.STATE_CONNECTED',
  'BluetoothProfile.STATE_DISCONNECTED',
  'BluetoothGatt.GATT_SUCCESS',
  'connectGatt(context, false, callback, BluetoothDevice.TRANSPORT_LE)',
  'discoverServices()',
  'discoveryStarted',
  'onServicesDiscovered',
  'cacheRequiredCharacteristics',
  'channelReadySnapshot',
  'required_characteristic_missing',
  'connect_timeout',
  'already_connecting',
  'pendingDeviceId',
  'clearCharacteristicCache',
  'gatt.close()',
  'emitConnectionChanged(true',
  'emitConnectionChanged(false'
]

for (const text of requiredGattStrings) {
  mustContain(androidIndex, text, 'GATT connection/service-discovery boundary')
}

mustMatch(androidIndex, /class\s+OleapGattCallback\s+extends\s+BluetoothGattCallback/, 'BluetoothGattCallback subclass')
mustMatch(androidIndex, /override\s+onConnectionStateChange/, 'onConnectionStateChange override')
mustMatch(androidIndex, /override\s+onServicesDiscovered/, 'onServicesDiscovered override')

const requiredTransportStrings = [
  'CLIENT_CHARACTERISTIC_CONFIG_UUID',
  'BluetoothGattDescriptor.ENABLE_NOTIFICATION_VALUE',
  'setCharacteristicNotification',
  'writeDescriptor',
  'onDescriptorWrite',
  'onCharacteristicChanged',
  'onCharacteristicWrite',
  'writeQueue',
  'activeWriteRequest',
  'processNextWrite',
  'writeCommunicationBytes',
  'writeRecordBytes',
  'numbersToByteArray',
  'ByteArray',
  'DEFAULT_WRITE_TIMEOUT_MS',
  'write_timeout',
  'write_channel_not_ready',
  'rejectQueuedWrites',
  'ble_disconnected',
  'notificationsReady',
  'notifyEnableGeneration',
  'stale_gatt_callback_ignored',
  'stale_characteristic_write_ignored',
  'communication_notify',
  'record_notify',
  'required_characteristic_missing'
]

for (const text of requiredTransportStrings) {
  mustContain(androidIndex, text, 'notify/write transport boundary')
}

mustMatch(androidIndex, /constructor\(generation:\s*number\)/, 'GATT callback generation constructor')
mustMatch(androidIndex, /new\s+OleapGattCallback\(generationAtStart\)/, 'GATT callback generation binding')
mustMatch(androidIndex, /@UTSJS\.keepAlive\s+override\s+onCharacteristicChanged/, 'keepAlive notify callback')
mustMatch(androidIndex, /override\s+onCharacteristicChanged\(gatt:\s*BluetoothGatt,\s*characteristic:\s*BluetoothGattCharacteristic,\s*value:\s*ByteArray\)/, 'Android 13 notify callback value overload')
mustContain(androidIndex, 'this.dispatchCharacteristicChanged(characteristic, byteArrayToNumbers(value), this.generation)', 'Android 13 notify dispatch path')
mustMatch(androidIndex, /@UTSJS\.keepAlive\s+override\s+onCharacteristicWrite/, 'keepAlive write callback')

if (androidIndex.includes('unsupportedPlatformError')) {
  fail('Android P1 implementation must not use unsupportedPlatformError')
}

if (androidIndex.includes('connect_not_implemented')) {
  fail('Android P1-3/P1-4 should implement connect instead of connect_not_implemented')
}

console.log('P1 Android host check passed')
