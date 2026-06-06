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

export async function onRequestGet(context) {
  const cookie = context.request.headers.get('cookie') || ''
  const match = cookie.match(/coshub_session=([^;]+)/)

  if (!match) {
    return new Response(
      JSON.stringify({ success: true, data: { authenticated: false }, error: null }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }

  const authSecret = context.env.AUTH_SECRET || ''

  const claims = authSecret ? await verifyJWT(match[1], authSecret) : null
  const authenticated = !!claims?.authenticated

  return new Response(
    JSON.stringify({ success: true, data: { authenticated }, error: null }),
    {
      headers: { 'Content-Type': 'application/json' },
    }
  )
}