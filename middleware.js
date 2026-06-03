export const config = {
  matcher: ['/api/cos/:path*', '/api/settings/:path*'],
}

async function verifyJWT(token, secret) {
  const [headerB64, payloadB64, sigB64] = token.split('.')
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

  const claims = await verifyJWT(match[1], context.env.AUTH_SECRET)
  if (!claims || !claims.authenticated) {
    return new Response(JSON.stringify({ success: false, data: null, error: 'UNAUTHORIZED' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  return context.next({
    headers: { 'x-auth-user': 'authenticated' },
  })
}