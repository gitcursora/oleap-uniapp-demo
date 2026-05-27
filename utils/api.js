// 后端服务地址，局域网联调时改为实际 IP
const BASE_URL = 'http://172.21.2.100:3000'

/**
 * 将 /static/... 虚拟路径转为 uni.uploadFile 可用的真实路径。
 * 真机上 /static 是 app 内置资源，需通过 plus.io 转换；H5/模拟器直接透传。
 */
function resolveFilePath(filePath) {
  if (
    typeof plus !== 'undefined' &&
    plus.io &&
    typeof filePath === 'string' &&
    filePath.startsWith('/static/')
  ) {
    return plus.io.convertLocalFileSystemURL(filePath)
  }
  return filePath
}

/**
 * 上传音频文件到 /api/audio/upload
 * @param {string} filePath  uni-app 本地文件路径（tempFilePath 或 static 路径）
 * @param {{ topic?: string, scene?: string }} [fields]  可选附加字段
 * @returns {Promise<{ uploadedFile: object, result: object }>}
 */
export function uploadAudio(filePath, fields = {}) {
  return new Promise((resolve, reject) => {
    const formData = {}
    if (fields.topic) formData.topic = fields.topic
    if (fields.scene) formData.scene = fields.scene

    uni.uploadFile({
      url: `${BASE_URL}/api/audio/upload`,
      filePath: resolveFilePath(filePath),
      name: 'audio',
      formData,
      success(res) {
        let body
        try {
          body = JSON.parse(res.data)
        } catch {
          reject(new Error('服务器返回格式错误'))
          return
        }
        if (res.statusCode >= 200 && res.statusCode < 300 && body.ok) {
          resolve(body.data)
        } else {
          reject(new Error(body.message || body.error || `HTTP ${res.statusCode}`))
        }
      },
      fail(err) {
        reject(new Error(err.errMsg || '网络请求失败'))
      }
    })
  })
}

/**
 * 从后端获取七牛上传凭证
 */
export function getQiniuToken(format = 'wav') {
  return new Promise((resolve, reject) => {
    uni.request({
      url: `${BASE_URL}/api/qiniu/token`,
      method: 'POST',
      header: { 'Content-Type': 'application/json' },
      data: { format },
      success(res) {
        if (res.statusCode >= 200 && res.statusCode < 300 && res.data?.ok) {
          resolve(res.data.data)
        } else {
          reject(new Error(res.data?.message || `获取上传凭证失败 HTTP ${res.statusCode}`))
        }
      },
      fail(err) {
        reject(new Error(err.errMsg || '网络请求失败'))
      }
    })
  })
}

/**
 * 上传文件到七牛 OSS，返回公网访问 URL
 */
export function uploadToQiniu(filePath, tokenData) {
  return new Promise((resolve, reject) => {
    uni.uploadFile({
      url: tokenData.uploadUrl,
      filePath: resolveFilePath(filePath),
      name: 'file',
      formData: {
        token: tokenData.token,
        key: tokenData.key
      },
      success(res) {
        console.log('[uploadToQiniu] statusCode:', res.statusCode)
        console.log('[uploadToQiniu] data type:', typeof res.data)
        console.log('[uploadToQiniu] data:', res.data)

        let body
        try {
          body = JSON.parse(res.data)
        } catch (e) {
          reject(new Error(`七牛返回格式错误: ${res.data?.substring(0, 100)}`))
          return
        }
        if (res.statusCode === 200 && body.key) {
          const domain = tokenData.domain.replace(/\/$/, '')
          resolve(`${domain}/${body.key}`)
        } else {
          reject(new Error(body.error || `上传到七牛失败 HTTP ${res.statusCode}`))
        }
      },
      fail(err) {
        reject(new Error(err.errMsg || '上传到七牛网络失败'))
      }
    })
  })
}

/**
 * 调用后端 ASR 转写接口
 */
export function transcribeAudio(audioUrl, format = 'wav') {
  return new Promise((resolve, reject) => {
    uni.request({
      url: `${BASE_URL}/api/asr/transcribe`,
      method: 'POST',
      header: { 'Content-Type': 'application/json' },
      data: { audioUrl, format },
      success(res) {
        if (res.statusCode >= 200 && res.statusCode < 300 && res.data?.ok) {
          resolve(res.data.data)
        } else {
          reject(new Error(res.data?.message || `转写请求失败 HTTP ${res.statusCode}`))
        }
      },
      fail(err) {
        reject(new Error(err.errMsg || '网络请求失败'))
      }
    })
  })
}
