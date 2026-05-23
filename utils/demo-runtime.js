export const DEMO_LAST_DEVICE_ID_STORAGE_KEY = 'oleap-demo-last-device-id'

export function getDemoLastDeviceId(defaultValue = '') {
  try {
    const value = uni.getStorageSync(DEMO_LAST_DEVICE_ID_STORAGE_KEY)
    if (typeof value === 'string') {
      return value
    }
    if (value === null || typeof value === 'undefined') {
      return defaultValue
    }
    return `${value}`
  } catch (error) {
    return defaultValue
  }
}

export function setDemoLastDeviceId(deviceId) {
  const value = typeof deviceId === 'string' ? deviceId : `${deviceId || ''}`
  uni.setStorageSync(DEMO_LAST_DEVICE_ID_STORAGE_KEY, value)
  return value
}

export function formatSdkError(error) {
  if (!error) {
    return ''
  }
  if (typeof error === 'string') {
    return error
  }
  const code = error.code ? `[${error.code}] ` : ''
  const message = error.message || `${error}`
  const details = error.details || {}
  const detailMessage = details.reason || details.error || details.name || ''
  return `${code}${message}${detailMessage ? ` (${detailMessage})` : ''}`
}
