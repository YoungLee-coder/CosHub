// EdgeOne Pages Edge Function - 获取访问密码配置
// 供登录 API 调用

// KV 配置键名
const KV_KEYS = {
  ACCESS_PASSWORD: 'access_password',
  COS_CDN_DOMAIN: 'cos_cdn_domain',
} as const

// KVNamespace 接口
interface KVNamespace {
  get(key: string, type?: 'text' | 'json' | 'arrayBuffer' | 'stream'): Promise<string | null>
  put(key: string, value: string): Promise<void>
}

// EdgeOne 环境变量接口
interface EdgeOneEnv {
  SETTINGS_KV?: KVNamespace
  [key: string]: unknown
}

interface EventContext {
  request: Request
  env: EdgeOneEnv
}

// 仅供内部 API 调用，返回实际密码用于验证
export async function onRequestPost(context: EventContext): Promise<Response> {
  const { request, env } = context

  // 验证内部调用（通过特殊 header）
  const internalKey = request.headers.get('x-internal-key')
  if (internalKey !== process.env.AUTH_SECRET) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const kv = env.SETTINGS_KV
  let password = process.env.ACCESS_PASSWORD || ''

  if (kv) {
    try {
      const kvPassword = await kv.get(KV_KEYS.ACCESS_PASSWORD, 'text')
      if (kvPassword) {
        password = kvPassword
      }
    } catch (e) {
      console.error('KV read error:', e)
    }
  }

  return new Response(JSON.stringify({ password }), {
    headers: { 'Content-Type': 'application/json' },
  })
}
