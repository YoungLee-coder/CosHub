// EdgeOne Pages Edge Function - 获取 CDN 域名配置

// KV 配置键名
const KV_KEYS = {
  COS_CDN_DOMAIN: 'cos_cdn_domain',
} as const

// KVNamespace 接口
interface KVNamespace {
  get(key: string, type?: 'text' | 'json' | 'arrayBuffer' | 'stream'): Promise<string | null>
}

// EdgeOne 环境变量接口
interface EdgeOneEnv {
  SETTINGS_KV?: KVNamespace
  COS_CDN_DOMAIN?: string
  [key: string]: unknown
}

interface EventContext {
  request: Request
  env: EdgeOneEnv
}

export async function onRequestGet(context: EventContext): Promise<Response> {
  const { env } = context

  const kv = env.SETTINGS_KV
  let cdnDomain = env.COS_CDN_DOMAIN || ''

  if (kv) {
    try {
      const kvDomain = await kv.get(KV_KEYS.COS_CDN_DOMAIN, 'text')
      if (kvDomain) {
        cdnDomain = kvDomain
      }
    } catch (e) {
      console.error('KV read error:', e)
    }
  }

  return new Response(JSON.stringify({ domain: cdnDomain }), {
    headers: { 'Content-Type': 'application/json' },
  })
}
