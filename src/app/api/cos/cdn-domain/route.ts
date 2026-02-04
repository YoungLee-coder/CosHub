import { NextResponse } from 'next/server'

export async function GET() {
  const cdnDomain = process.env.COS_CDN_DOMAIN || ''
  return NextResponse.json({ domain: cdnDomain })
}
