export const DEMO_MOCK_STORAGE_KEY = 'oleap-demo-use-mock'

export function getDemoMockMode(defaultValue = true) {
  try {
    const value = uni.getStorageSync(DEMO_MOCK_STORAGE_KEY)
    if (value === '' || value === null || typeof value === 'undefined') {
      return defaultValue
    }
    return value === true || value === 'true' || value === 1 || value === '1'
  } catch (error) {
    return defaultValue
  }
}

export function setDemoMockMode(mock) {
  const value = Boolean(mock)
  uni.setStorageSync(DEMO_MOCK_STORAGE_KEY, value)
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
