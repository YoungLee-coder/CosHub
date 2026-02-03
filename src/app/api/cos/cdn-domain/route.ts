import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  // 尝试通过 Edge Function 获取 KV 中的 CDN 域名
  try {
    const origin = request.nextUrl.origin
    const res = await fetch(`${origin}/api/cdn-domain`)
    
    if (res.ok) {
      const data = await res.json()
      if (data.domain) {
        return NextResponse.json({ domain: data.domain })
      }
    }
  } catch {
    // Edge Function 不可用，fallback 到环境变量
  }

  // Fallback: 使用环境变量
  const cdnDomain = process.env.COS_CDN_DOMAIN || ''
  return NextResponse.json({ domain: cdnDomain })
}
