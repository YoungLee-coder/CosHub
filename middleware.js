export const config = {
  matcher: ['/api/cos/:path*', '/api/settings/:path*'],
}

async function verifyJWT(token, secret) {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const [headerB64, payloadB64, sigB64] = parts
    const encoder = new TextEncoder()
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    )
    const sig = Uint8Array.from(atob(sigB64), (c) => c.charCodeAt(0))
    const valid = await crypto.subtle.verify(
      'HMAC',
      key,
      sig,
      encoder.encode(`${headerB64}.${payloadB64}`)
    )
    if (!valid) return null
    const claims = JSON.parse(atob(payloadB64))
    if (claims.exp < Math.floor(Date.now() / 1000)) return null
    return claims
  } catch {
    return null
  }
}

export async function middleware(context) {
  const cookie = context.request.headers.get('cookie') || ''
  const match = cookie.match(/coshub_session=([^;]+)/)
  if (!match) {
    return new Response(JSON.stringify({ success: false, data: null, error: 'UNAUTHORIZED' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const authSecret = context.env.AUTH_SECRET || ''

  if (!authSecret) {
    return new Response(
      JSON.stringify({ success: false, data: null, error: 'AUTH_SECRET not configured' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }

  const claims = await verifyJWT(match[1], authSecret)
  if (!claims || !claims.authenticated) {
    return new Response(JSON.stringify({ success: false, data: null, error: 'UNAUTHORIZED' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  let cosSecretId = ''
  let cosSecretKey = ''
  let cosRegion = 'ap-guangzhou'
  let cosCdnDomain = ''

  try {
    cosSecretId = await coshub_kv.get('cos_secret_id') || ''
    cosSecretKey = await coshub_kv.get('cos_secret_key') || ''
    cosRegion = await coshub_kv.get('cos_region') || 'ap-guangzhou'
    cosCdnDomain = await coshub_kv.get('cos_cdn_domain') || ''
  } catch {}

  return context.next({
    headers: {
      'x-auth-user': 'authenticated',
      'x-coshub-cos-secret-id': cosSecretId,
      'x-coshub-cos-secret-key': cosSecretKey,
      'x-coshub-cos-region': cosRegion,
      'x-coshub-cos-cdn-domain': cosCdnDomain,
    },
  })
}