import { OleapBle } from '@/uni_modules/oleap-ble-sdk/index.js'
import { formatSdkError } from '@/utils/demo-runtime.js'

const DEFAULT_LOG_LEVEL = 'debug'

let readyPromise = null

export function ensureOleapReady(options = {}) {
  if (!readyPromise) {
    readyPromise = OleapBle.init({
      logLevel: options.logLevel || DEFAULT_LOG_LEVEL
    }).catch((error) => {
      readyPromise = null
      throw error
    })
  }
  return readyPromise
}

export async function runOleapAction(page, action, options = {}) {
  const {
    errorKey = 'error',
    busyKey = '',
    skipWhenBusy = true,
    after = null,
    rethrow = false
  } = options

  if (busyKey && skipWhenBusy && page[busyKey]) {
    return null
  }

  try {
    if (busyKey) {
      page[busyKey] = true
    }
    if (errorKey) {
      page[errorKey] = ''
    }
    return await action()
  } catch (error) {
    if (errorKey) {
      page[errorKey] = formatOleapError(error)
    }
    if (rethrow) {
      throw error
    }
    return null
  } finally {
    if (typeof after === 'function') {
      after()
    }
    if (busyKey) {
      page[busyKey] = false
    }
  }
}

export function formatOleapError(error) {
  return formatSdkError(error) || '操作失败'
}

export function registerOleapDisposers(page, ...disposers) {
  if (!Array.isArray(page.disposers)) {
    page.disposers = []
  }
  page.disposers.push(...disposers.filter((dispose) => typeof dispose === 'function'))
}

export function disposeOleapDisposers(page) {
  const disposers = Array.isArray(page.disposers) ? page.disposers.splice(0) : []
  disposers.forEach((dispose) => {
    try {
      dispose()
    } catch (error) {}
  })
}

export function refreshOleapDiagnostics(page, options = {}) {
  try {
    if (options.connectionKey !== false) {
      page[options.connectionKey || 'connection'] = OleapBle.getConnectionState()
    }
    if (options.diagnosticsKey !== false) {
      page[options.diagnosticsKey || 'diagnostics'] = OleapBle.getDiagnostics() || { events: [] }
    }
  } catch (error) {}
}

export function copyOleapDiagnostics(diagnostics) {
  uni.setClipboardData({
    data: JSON.stringify(diagnostics || {}, null, 2)
  })
}

export function shortTime(value) {
  if (!value) {
    return ''
  }
  return `${value}`.slice(11, 19)
}

export function stringifyDetails(value) {
  if (value == null) {
    return '{}'
  }
  try {
    return JSON.stringify(value)
  } catch (error) {
    return `${value}`
  }
}
