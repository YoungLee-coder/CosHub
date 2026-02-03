// Edge Function for KV Settings
// 通过 EdgeOne Pages KV 存储管理应用配置

// EdgeOne Pages Edge Functions 类型定义
interface KVNamespace {
  get(key: string, type?: 'text' | 'json' | 'arrayBuffer' | 'stream'): Promise<string | null>
  put(key: string, value: string): Promise<void>
  delete(key: string): Promise<void>
}

interface EventContext {
  request: Request
  params: Record<string, string>
  env: {
    SETTINGS_KV?: KVNamespace
    ACCESS_PASSWORD?: string
    AUTH_SECRET?: string
    COS_CDN_DOMAIN?: string
    [key: string]: unknown
  }
  waitUntil: (task: Promise<unknown>) => void
}

// KV 键名
const KV_KEYS = {
  ACCESS_PASSWORD: 'access_password',
  CDN_DOMAIN: 'cdn_domain',
} as const

// 验证 JWT token
async function verifyToken(request: Request, env: EventContext['env']): Promise<boolean> {
  const cookie = request.headers.get('cookie')
  if (!cookie) return false

  const match = cookie.match(/coshub_session=([^;]+)/)
  if (!match) return false

  const token = match[1]
  const secret = env.AUTH_SECRET
  if (!secret) return false

  try {
    // 简单的 JWT 验证（Edge Runtime 兼容）
    const [, payloadB64] = token.split('.')
    if (!payloadB64) return false

    const payload = JSON.parse(atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/')))
    
    // 检查过期时间
    if (payload.exp && payload.exp < Date.now() / 1000) {
      return false
    }

    return payload.authenticated === true
  } catch {
    return false
  }
}

// GET - 获取设置
export async function onRequestGet(context: EventContext): Promise<Response> {
  const { request, env } = context

  // 验证登录状态
  const isAuthenticated = await verifyToken(request, env)
  if (!isAuthenticated) {
    return new Response(JSON.stringify({ error: '未授权' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const kv = env.SETTINGS_KV

  // 从 KV 获取配置
  let kvPassword: string | null = null
  let kvCdnDomain: string | null = null

  if (kv) {
    try {
      kvPassword = await kv.get(KV_KEYS.ACCESS_PASSWORD, 'text')
      kvCdnDomain = await kv.get(KV_KEYS.CDN_DOMAIN, 'text')
    } catch (e) {
      console.error('KV read error:', e)
    }
  }

  // 环境变量作为 fallback
  const envPassword = env.ACCESS_PASSWORD || ''
  const envCdnDomain = env.COS_CDN_DOMAIN || ''

  // 确定最终值和来源
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
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }
  )
}

// PUT - 更新设置
export async function onRequestPut(context: EventContext): Promise<Response> {
  const { request, env } = context

  // 验证登录状态
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
    const body = await request.json() as {
      accessPassword?: string
      cdnDomain?: string
    }

    // 更新密码
    if (body.accessPassword !== undefined) {
      if (body.accessPassword) {
        await kv.put(KV_KEYS.ACCESS_PASSWORD, body.accessPassword)
      } else {
        await kv.delete(KV_KEYS.ACCESS_PASSWORD)
      }
    }

    // 更新 CDN 域名
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

// 统一处理
export async function onRequest(context: EventContext): Promise<Response> {
  const { request } = context

  if (request.method === 'GET') {
    return onRequestGet(context)
  }

  if (request.method === 'PUT') {
    return onRequestPut(context)
  }

  return new Response(JSON.stringify({ error: 'Method not allowed' }), {
    status: 405,
    headers: { 'Content-Type': 'application/json' },
  })
}
