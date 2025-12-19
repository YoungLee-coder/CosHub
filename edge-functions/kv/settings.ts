// EdgeOne Pages Edge Function for KV Settings
// 路径: /kv/settings (避免与 Next.js /api 冲突)

const KV_KEYS = {
  ACCESS_PASSWORD: 'access_password',
  COS_CDN_DOMAIN: 'cos_cdn_domain',
}

function verifyToken(request: Request): boolean {
  const cookie = request.headers.get('cookie')
  if (!cookie) return false
  const sessionMatch = cookie.match(/coshub_session=([^;]+)/)
  return !!(sessionMatch && sessionMatch[1].length > 0)
}

interface KV {
  get(key: string, type?: string): Promise<string | null>
  put(key: string, value: string): Promise<void>
}

interface Context {
  request: Request
  env: {
    SETTINGS_KV?: KV
    ACCESS_PASSWORD?: string
    COS_CDN_DOMAIN?: string
  }
}

export async function onRequestGet(context: Context): Promise<Response> {
  const { request, env } = context
  
  if (!verifyToken(request)) {
    return new Response(JSON.stringify({ error: '未授权' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const kv = env.SETTINGS_KV
  const kvAvailable = !!kv

  let kvPassword: string | null = null
  let kvCdnDomain: string | null = null

  if (kv) {
    try {
      kvPassword = await kv.get(KV_KEYS.ACCESS_PASSWORD, 'text')
      kvCdnDomain = await kv.get(KV_KEYS.COS_CDN_DOMAIN, 'text')
    } catch (e) {
      console.error('KV read error:', e)
    }
  }

  const envPassword = env.ACCESS_PASSWORD || ''
  const envCdnDomain = env.COS_CDN_DOMAIN || ''

  return new Response(JSON.stringify({
    kvAvailable,
    settings: {
      accessPassword: (kvPassword || envPassword) ? '******' : '',
      cdnDomain: kvCdnDomain || envCdnDomain,
    },
    sources: {
      accessPassword: kvPassword ? 'kv' : (envPassword ? 'env' : 'none'),
      cdnDomain: kvCdnDomain ? 'kv' : (envCdnDomain ? 'env' : 'none'),
    },
  }), {
    headers: { 'Content-Type': 'application/json' },
  })
}

export async function onRequestPut(context: Context): Promise<Response> {
  const { request, env } = context

  if (!verifyToken(request)) {
    return new Response(JSON.stringify({ error: '未授权' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const kv = env.SETTINGS_KV
  if (!kv) {
    return new Response(JSON.stringify({ error: 'KV 存储不可用' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    const body = await request.json() as { accessPassword?: string; cdnDomain?: string }
    const { accessPassword, cdnDomain } = body
    const results: Record<string, boolean> = {}

    if (typeof accessPassword === 'string' && accessPassword.trim()) {
      try {
        await kv.put(KV_KEYS.ACCESS_PASSWORD, accessPassword.trim())
        results.accessPassword = true
      } catch { results.accessPassword = false }
    }

    if (typeof cdnDomain === 'string') {
      try {
        await kv.put(KV_KEYS.COS_CDN_DOMAIN, cdnDomain.trim())
        results.cdnDomain = true
      } catch { results.cdnDomain = false }
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Update settings error:', error)
    return new Response(JSON.stringify({ error: '更新设置失败' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
