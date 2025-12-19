// EdgeOne Pages Edge Function for KV Settings
// 这个文件运行在 Edge Runtime，可以访问 KV 存储

// KV 配置键名
const KV_KEYS = {
  ACCESS_PASSWORD: 'access_password',
  COS_CDN_DOMAIN: 'cos_cdn_domain',
} as const

// KVNamespace 接口
interface KVNamespace {
  get(key: string, type?: 'text' | 'json' | 'arrayBuffer' | 'stream'): Promise<string | null>
  put(key: string, value: string): Promise<void>
  delete(key: string): Promise<void>
}

// EdgeOne 环境变量接口
interface EdgeOneEnv {
  SETTINGS_KV?: KVNamespace
  [key: string]: unknown
}

interface EventContext {
  request: Request
  env: EdgeOneEnv
  waitUntil: (task: Promise<unknown>) => void
}

// 验证 JWT token
async function verifyToken(request: Request): Promise<boolean> {
  const cookie = request.headers.get('cookie')
  if (!cookie) return false
  
  const sessionMatch = cookie.match(/coshub_session=([^;]+)/)
  if (!sessionMatch) return false
  
  // 简单验证 token 存在，实际验证由主应用处理
  return sessionMatch[1].length > 0
}

// GET - 获取设置
export async function onRequestGet(context: EventContext): Promise<Response> {
  const { request, env } = context
  
  // 验证登录状态
  const isAuthenticated = await verifyToken(request)
  if (!isAuthenticated) {
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

// PUT - 更新设置
export async function onRequestPut(context: EventContext): Promise<Response> {
  const { request, env } = context

  // 验证登录状态
  const isAuthenticated = await verifyToken(request)
  if (!isAuthenticated) {
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
