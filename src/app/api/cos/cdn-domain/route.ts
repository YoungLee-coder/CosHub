import { NextResponse } from 'next/server'

export async function GET() {
  // 暂时使用环境变量，KV 功能通过设置页面管理
  const cdnDomain = process.env.COS_CDN_DOMAIN || ''
  return NextResponse.json({ domain: cdnDomain })
}
