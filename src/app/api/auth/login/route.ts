import { NextRequest, NextResponse } from 'next/server'
import { SignJWT } from 'jose'

const SESSION_COOKIE_NAME = 'coshub_session'

function getSecretKey() {
  const secret = process.env.AUTH_SECRET
  if (!secret) throw new Error('AUTH_SECRET is not set')
  return new TextEncoder().encode(secret)
}

// 获取访问密码（暂时使用环境变量，KV 功能通过设置页面管理）
function getAccessPassword(): string {
  return process.env.ACCESS_PASSWORD || ''
}

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json()

    if (!password) {
      return NextResponse.json({ error: '请输入密码' }, { status: 400 })
    }

    const accessPassword = getAccessPassword()
    if (!accessPassword || password !== accessPassword) {
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
