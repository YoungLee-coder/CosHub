// EdgeOne Pages Edge Function - 获取 CDN 域名配置

import { KV_KEYS, type EdgeOneEnv } from '../../../src/lib/kv'

interface EventContext {
  request: Request
  env: EdgeOneEnv
}

export async function onRequestGet(context: EventContext): Promise<Response> {
  const { env } = context

  const kv = env.SETTINGS_KV
  let cdnDomain = process.env.COS_CDN_DOMAIN || ''

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
