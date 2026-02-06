// login云函数：获取用户 openid
// 优先使用 getWXContext()；若未返回 openid，则用 code 调用 code2Session 换取
// APP_SECRET 来源（按优先级）：1 环境变量 2 同目录 config.json
const cloud = require('wx-server-sdk')
const https = require('https')
const path = require('path')
const fs = require('fs')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

// 获取 APP_SECRET：环境变量 > config.json（解决控制台环境变量未生效时的 fallback）
function getAppSecret() {
  const fromEnv = process.env.APP_SECRET || process.env.app_secret
  if (fromEnv) return fromEnv
  try {
    const configPath = path.join(__dirname, 'config.json')
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'))
      return config.APP_SECRET || config.app_secret
    }
  } catch (e) {
    console.warn('读取 config.json 失败:', e.message)
  }
  return undefined
}

// 通过 code 调用微信 code2Session 换取 openid（不依赖 getWXContext）
function getOpenIdByCode(appid, secret, code) {
  return new Promise((resolve, reject) => {
    const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${encodeURIComponent(appid)}&secret=${encodeURIComponent(secret)}&js_code=${encodeURIComponent(code)}&grant_type=authorization_code`
    console.log('code2Session 请求 URL（隐藏 secret）:', url.replace(/secret=[^&]+/, 'secret=***'))
    
    https.get(url, (res) => {
      let raw = ''
      res.on('data', chunk => { raw += chunk })
      res.on('end', () => {
        try {
          const data = JSON.parse(raw)
          console.log('code2Session 响应:', JSON.stringify(data))
          if (data.openid) {
            resolve({ openid: data.openid, unionid: data.unionid || null })
          } else {
            const errMsg = `code2Session 失败: errcode=${data.errcode}, errmsg=${data.errmsg || '未知错误'}`
            console.error(errMsg)
            reject(new Error(errMsg))
          }
        } catch (e) {
          console.error('code2Session 响应解析失败:', e.message, '原始响应:', raw)
          reject(e)
        }
      })
    }).on('error', (err) => {
      console.error('code2Session 网络请求失败:', err.message)
      reject(err)
    })
  })
}

exports.main = async (event, context) => {
  try {
    console.log('login 云函数调用开始，event:', JSON.stringify(event))
    const wxContext = cloud.getWXContext()
    console.log('getWXContext 返回:', JSON.stringify(wxContext))
    
    let openid = wxContext.OPENID || wxContext.openid
    // appid：优先上下文，否则使用客户端传入（getWXContext 常与 openid 同时为空）
    const appid = wxContext.APPID || wxContext.appid || event.appid
    
    console.log('初始 openid:', openid, 'appid:', appid, 'event.code:', !!event.code)

    // 若 getWXContext 未返回 openid，且传入 code 与 appid，则用 code2Session 换取
    if (!openid && event.code && appid) {
      console.log('尝试通过 code2Session 获取 openid')
      const secret = getAppSecret()
      console.log('APP_SECRET 是否获取到:', !!secret, '来源: env 或 config.json')
      
      if (!secret) {
        console.error('未配置 APP_SECRET：请在控制台配置环境变量，或在 cloudfunctions/login/config.json 中配置 APP_SECRET')
        return {
          success: false,
          message: '服务未配置 APP_SECRET，无法通过 code 获取 openid',
          openid: undefined
        }
      }
      
      try {
        console.log('调用 code2Session，appid:', appid, 'code 前10位:', event.code.substring(0, 10))
        const result = await getOpenIdByCode(appid, secret, event.code)
        console.log('code2Session 成功，返回 openid:', result.openid)
        openid = result.openid
      } catch (err) {
        console.error('code2Session 失败:', err.message, '错误堆栈:', err.stack)
        return {
          success: false,
          message: 'code 换取 openid 失败：' + (err.message || ''),
          openid: undefined
        }
      }
    } else {
      if (!openid) {
        console.warn('未使用 code2Session 的原因:', {
          hasOpenid: !!openid,
          hasCode: !!event.code,
          hasAppid: !!appid
        })
      }
    }

    if (!openid) {
      console.error('getWXContext 未返回 openid 且未使用 code 换取，完整上下文:', JSON.stringify(wxContext))
      return {
        success: false,
        message: '未获取到用户身份，请确认已传入 code 并配置云函数环境变量 APP_SECRET',
        openid: undefined
      }
    }
    
    console.log('最终返回 openid:', openid)

    return {
      openid,
      appid: wxContext.APPID || wxContext.appid,
      unionid: wxContext.UNIONID || wxContext.unionid || undefined,
      success: true
    }
  } catch (error) {
    console.error('获取 openid 失败:', error)
    return {
      success: false,
      message: '获取 openid 失败',
      openid: undefined
    }
  }
}
