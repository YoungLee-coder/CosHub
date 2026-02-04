import { NextRequest, NextResponse } from 'next/server'
import { SignJWT } from 'jose'

const SESSION_COOKIE_NAME = 'coshub_session'

function getSecretKey() {
  const secret = process.env.AUTH_SECRET
  if (!secret) throw new Error('AUTH_SECRET is not set')
  return new TextEncoder().encode(secret)
}

function verifyPassword(password: string): boolean {
  const accessPassword = process.env.ACCESS_PASSWORD || ''
  return !!(accessPassword && password === accessPassword)
}

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json()

    if (!password) {
      return NextResponse.json({ error: '请输入密码' }, { status: 400 })
    }

    // 使用环境变量验证密码
    // 注：KV 中的密码通过 Edge Function /api/kv-password 验证
    // 但由于 Next.js 路由优先级，这里只能用环境变量
    const isValid = verifyPassword(password)
    if (!isValid) {
      return NextResponse.json({ error: '密码错误' }, { status: 401 })
    }

    const token = await new SignJWT({ authenticated: true })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(getSecretKey())

    const response = NextResponse.json({ success: true })
    response.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: '登录失败' }, { status: 500 })
  }
}
