async function signJWT(payload, secret, expiresInSeconds) {
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const header = { alg: 'HS256', typ: 'JWT' }
  const now = Math.floor(Date.now() / 1000)
  const claims = { ...payload, iat: now, exp: now + expiresInSeconds }
  const headerB64 = btoa(JSON.stringify(header))
  const payloadB64 = btoa(JSON.stringify(claims))
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(`${headerB64}.${payloadB64}`)
  )
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
  return `${headerB64}.${payloadB64}.${sigB64}`
}

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

export async function onRequestPost(context) {
  try {
    const body = await context.request.json()
    const { password } = body

    if (!password || typeof password !== 'string') {
      return jsonResponse({ success: false, data: null, error: '密码不能为空' }, 400)
    }

    const authSecret = context.env.AUTH_SECRET || ''

    if (!authSecret) {
      return jsonResponse({ success: false, data: null, error: '系统未配置认证密钥，请设置 AUTH_SECRET 环境变量' }, 500)
    }

    const clientIp =
      context.request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    const rateKey = `rate:login:${clientIp}`

    let rateData = null
    try {
      const raw = await coshub_kv.get(rateKey, 'json')
      rateData = raw || { count: 0, windowStart: Date.now() }
    } catch {
      rateData = { count: 0, windowStart: Date.now() }
    }

    const WINDOW = 60_000
    const MAX = 5

    if (Date.now() - rateData.windowStart > WINDOW) {
      rateData = { count: 0, windowStart: Date.now() }
    }

    if (rateData.count >= MAX) {
      return jsonResponse({ success: false, data: null, error: '尝试次数过多，请稍后再试' }, 429)
    }

    const actualPassword = context.env.ACCESS_PASSWORD || ''

    if (password !== actualPassword) {
      rateData.count++
      try {
        await coshub_kv.put(rateKey, JSON.stringify(rateData))
      } catch {}
      return jsonResponse({ success: false, data: null, error: '密码错误' }, 401)
    }

    try {
      await coshub_kv.put(rateKey, JSON.stringify({ count: 0, windowStart: Date.now() }))
    } catch {}

    const token = await signJWT({ authenticated: true }, authSecret, 7 * 24 * 3600)

    return new Response(
      JSON.stringify({ success: true, data: { authenticated: true }, error: null }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Set-Cookie': `coshub_session=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${7 * 24 * 3600}`,
        },
      }
    )
  } catch {
    return jsonResponse({ success: false, data: null, error: '登录失败' }, 500)
  }
}