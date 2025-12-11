import { NextResponse } from 'next/server'

const SESSION_COOKIE_NAME = 'coshub_session'

export async function POST() {
  const response = NextResponse.json({ success: true })
  response.cookies.delete(SESSION_COOKIE_NAME)
  return response
}
