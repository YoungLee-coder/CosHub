// Edge Function for KV Settings
// 通过 EdgeOne Pages KV 存储管理应用配置

const KV_KEYS = {
  ACCESS_PASSWORD: 'access_password',
  CDN_DOMAIN: 'cdn_domain',
}

// 验证 JWT token
async function verifyToken(request, env) {
  const cookie = request.headers.get('cookie')
  if (!cookie) return false

  const match = cookie.match(/coshub_session=([^;]+)/)
  if (!match) return false

  const token = match[1]
  const secret = env.AUTH_SECRET
  if (!secret) return false

  try {
    const [, payloadB64] = token.split('.')
    if (!payloadB64) return false

    const payload = JSON.parse(atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/')))
    
    if (payload.exp && payload.exp < Date.now() / 1000) {
      return false
    }

    return payload.authenticated === true
  } catch {
    return false
  }
}

// GET - 获取设置
export async function onRequestGet(context) {
  const { request, env } = context

  const isAuthenticated = await verifyToken(request, env)
  if (!isAuthenticated) {
    return new Response(JSON.stringify({ error: '未授权' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const kv = env.SETTINGS_KV

  // 调试：列出所有 env 中的键
  const envKeys = Object.keys(env || {})

  let kvPassword = null
  let kvCdnDomain = null

  if (kv) {
    try {
      kvPassword = await kv.get(KV_KEYS.ACCESS_PASSWORD, 'text')
      kvCdnDomain = await kv.get(KV_KEYS.CDN_DOMAIN, 'text')
    } catch (e) {
      console.error('KV read error:', e)
    }
  }

  const envPassword = env.ACCESS_PASSWORD || ''
  const envCdnDomain = env.COS_CDN_DOMAIN || ''

  const accessPassword = kvPassword || envPassword
  const cdnDomain = kvCdnDomain || envCdnDomain

  return new Response(
    JSON.stringify({
      kvAvailable: !!kv,
      settings: {
        accessPassword: accessPassword ? '******' : '',
        cdnDomain,
      },
      sources: {
        accessPassword: kvPassword ? 'kv' : envPassword ? 'env' : 'none',
        cdnDomain: kvCdnDomain ? 'kv' : envCdnDomain ? 'env' : 'none',
      },
      debug: {
        envKeys,
        hasSettingsKV: 'SETTINGS_KV' in (env || {}),
      },
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }
  )
}

// PUT - 更新设置
export async function onRequestPut(context) {
  const { request, env } = context

  const isAuthenticated = await verifyToken(request, env)
  if (!isAuthenticated) {
    return new Response(JSON.stringify({ error: '未授权' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const kv = env.SETTINGS_KV
  if (!kv) {
    return new Response(
      JSON.stringify({
        error: 'KV 存储不可用',
        hint: '请在 EdgeOne Pages 控制台绑定 KV namespace，变量名为 SETTINGS_KV',
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }

  try {
    const body = await request.json()

    if (body.accessPassword !== undefined) {
      if (body.accessPassword) {
        await kv.put(KV_KEYS.ACCESS_PASSWORD, body.accessPassword)
      } else {
        await kv.delete(KV_KEYS.ACCESS_PASSWORD)
      }
    }

    if (body.cdnDomain !== undefined) {
      if (body.cdnDomain) {
        await kv.put(KV_KEYS.CDN_DOMAIN, body.cdnDomain)
      } else {
        await kv.delete(KV_KEYS.CDN_DOMAIN)
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (e) {
    console.error('KV write error:', e)
    return new Response(JSON.stringify({ error: '保存失败' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
