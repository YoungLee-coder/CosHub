import type { NextRequest, NextResponse } from 'next/server'

export const SESSION_COOKIE_NAME = 'coshub_session'

function getSecretKey() {
  const secret = process.env.AUTH_SECRET
  if (!secret) throw new Error('AUTH_SECRET is not set')
  return new TextEncoder().encode(secret)
}

export function verifyAccessPassword(password: string): boolean {
  const configuredPassword = process.env.ACCESS_PASSWORD || ''
  return configuredPassword.length > 0 && password === configuredPassword
}

export async function createSessionToken() {
  const { SignJWT } = await import('jose')
  return new SignJWT({ authenticated: true })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(getSecretKey())
}

export async function verifySessionToken(token: string | null | undefined): Promise<boolean> {
  if (!token) return false

  try {
    const { jwtVerify } = await import('jose')
    await jwtVerify(token, getSecretKey())
    return true
  } catch {
    return false
  }
}

export async function isRequestAuthenticated(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value
  return verifySessionToken(token)
}

export function applySessionCookie(response: NextResponse, token: string) {
  response.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  })
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.delete(SESSION_COOKIE_NAME)
}

export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (!forwarded) return 'unknown'
  return forwarded.split(',')[0]?.trim() || 'unknown'
}
