// Edge Function for getting CDN domain from KV
// 供 Next.js API 调用获取 KV 中的 CDN 域名配置

// EdgeOne Pages Edge Functions 类型定义
interface KVNamespace {
  get(key: string, type?: 'text' | 'json' | 'arrayBuffer' | 'stream'): Promise<string | null>
}

interface EventContext {
  request: Request
  params: Record<string, string>
  env: {
    SETTINGS_KV?: KVNamespace
    COS_CDN_DOMAIN?: string
    [key: string]: unknown
  }
  waitUntil: (task: Promise<unknown>) => void
}

const KV_KEY_CDN_DOMAIN = 'cdn_domain'

export async function onRequestGet(context: EventContext): Promise<Response> {
  const { env } = context
  const kv = env.SETTINGS_KV

  let cdnDomain = ''

  // 优先从 KV 获取
  if (kv) {
    try {
      const kvValue = await kv.get(KV_KEY_CDN_DOMAIN, 'text')
      if (kvValue) {
        cdnDomain = kvValue
      }
    } catch (e) {
      console.error('KV read error:', e)
    }
  }

  // fallback 到环境变量
  if (!cdnDomain) {
    cdnDomain = env.COS_CDN_DOMAIN || ''
  }

  return new Response(JSON.stringify({ domain: cdnDomain }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}
