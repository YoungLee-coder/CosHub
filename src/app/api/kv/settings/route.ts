// Next.js Edge Runtime API for KV Settings
// 使用 Edge Runtime 可以访问 EdgeOne KV

export const runtime = 'edge'

// KV 配置键名
const KV_KEYS = {
  ACCESS_PASSWORD: 'access_password',
  COS_CDN_DOMAIN: 'cos_cdn_domain',
}

// 验证 JWT token
function verifyToken(request: Request): boolean {
  const cookie = request.headers.get('cookie')
  if (!cookie) return false
  
  const sessionMatch = cookie.match(/coshub_session=([^;]+)/)
  if (!sessionMatch) return false
  
  return sessionMatch[1].length > 0
}

// 获取 KV 实例
function getKV(): KVNamespace | null {
  // EdgeOne Pages 通过 process.env 注入 KV 绑定
  const kv = (process.env as Record<string, unknown>).SETTINGS_KV
  if (kv && typeof kv === 'object' && 'get' in kv) {
    return kv as KVNamespace
  }
  
  // 尝试从 globalThis 获取
  const globalKV = (globalThis as Record<string, unknown>).SETTINGS_KV
  if (globalKV && typeof globalKV === 'object' && 'get' in globalKV) {
    return globalKV as KVNamespace
  }
  
  return null
}

interface KVNamespace {
  get(key: string, type?: string): Promise<string | null>
  put(key: string, value: string): Promise<void>
}

export async function GET(request: Request) {
  // 验证登录状态
  if (!verifyToken(request)) {
    return new Response(JSON.stringify({ error: '未授权' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const kv = getKV()
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

  const envPassword = process.env.ACCESS_PASSWORD || ''
  const envCdnDomain = process.env.COS_CDN_DOMAIN || ''

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

export async function PUT(request: Request) {
  // 验证登录状态
  if (!verifyToken(request)) {
    return new Response(JSON.stringify({ error: '未授权' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const kv = getKV()
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
      } catch {
        results.accessPassword = false
      }
    }

    if (typeof cdnDomain === 'string') {
      try {
        await kv.put(KV_KEYS.COS_CDN_DOMAIN, cdnDomain.trim())
        results.cdnDomain = true
      } catch {
        results.cdnDomain = false
      }
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
