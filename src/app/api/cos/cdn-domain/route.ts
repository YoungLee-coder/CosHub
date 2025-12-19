import { NextRequest, NextResponse } from 'next/server'

// 从 Edge Function 获取 CDN 域名
async function fetchCdnDomain(request: NextRequest): Promise<string> {
  try {
    const url = new URL('/api/config/cdn-domain', request.url)
    const res = await fetch(url.toString())
    if (res.ok) {
      const data = await res.json()
      return data.domain || ''
    }
  } catch (e) {
    console.error('Failed to get CDN domain from KV:', e)
  }
  return process.env.COS_CDN_DOMAIN || ''
}

export async function GET(request: NextRequest) {
  const cdnDomain = await fetchCdnDomain(request)
  return NextResponse.json({ domain: cdnDomain })
}
