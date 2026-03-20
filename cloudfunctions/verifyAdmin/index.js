const crypto = require('crypto')

// Decode a Base32 string (RFC 4648) into a Buffer
function base32Decode(input) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
  const cleaned = String(input || '').toUpperCase().replace(/=+$/, '').replace(/[^A-Z2-7]/g, '')
  let bits = ''
  for (const char of cleaned) {
    const val = alphabet.indexOf(char)
    if (val === -1) throw new Error('Invalid base32 character')
    bits += val.toString(2).padStart(5, '0')
  }
  const bytes = []
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.slice(i, i + 8), 2))
  }
  return Buffer.from(bytes)
}

// Generate a 6-digit TOTP using HMAC-SHA1 with 30s step
function generateTotp(secretBuffer, timeStep) {
  const buf = Buffer.alloc(8)
  buf.writeUInt32BE(Math.floor(timeStep / Math.pow(2, 32)), 0)
  buf.writeUInt32BE(timeStep % Math.pow(2, 32), 4)

  const hmac = crypto.createHmac('sha1', secretBuffer).update(buf).digest()
  const offset = hmac[hmac.length - 1] & 0xf
  const code = ((hmac.readUInt32BE(offset) & 0x7fffffff) % 1000000).toString().padStart(6, '0')
  return code
}

exports.main = async (event, context) => {
  const code = String((event && event.code) || '').trim()
  if (!/^[0-9]{6}$/.test(code)) {
    return { success: false, message: '验证码格式错误' }
  }

  // Secret should be Base32 (for Google Authenticator). Configure via env var ADMIN_TOTP_SECRET.
  const secretBase32 = process.env.ADMIN_TOTP_SECRET
  if (!secretBase32) {
    return { success: false, message: '未配置管理员密钥，请设置环境变量 ADMIN_TOTP_SECRET' }
  }

  let secretBuffer
  try {
    secretBuffer = base32Decode(secretBase32)
  } catch (e) {
    return { success: false, message: '管理员密钥格式无效（应为 Base32）' }
  }

  const currentStep = Math.floor(Date.now() / 1000 / 30)
  const isValid = [-1, 0, 1].some(offset => generateTotp(secretBuffer, currentStep + offset) === code)

  if (!isValid) {
    return { success: false, message: '验证码错误或已过期' }
  }

  return { success: true, message: '验证通过' }
}
