// Edge Function for getting CDN domain from KV

const KV_KEY_CDN_DOMAIN = 'cdn_domain'

export async function onRequestGet(context) {
  const { env } = context
  const kv = env.SETTINGS_KV

  let cdnDomain = ''

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

  if (!cdnDomain) {
    cdnDomain = env.COS_CDN_DOMAIN || ''
  }

  return new Response(JSON.stringify({ domain: cdnDomain }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}
