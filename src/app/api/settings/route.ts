import { NextRequest, NextResponse } from 'next/server'
import { verifySession } from '@/lib/auth'

// GET - 获取当前设置（基于环境变量）
export async function GET() {
  const isAuthenticated = await verifySession()
  if (!isAuthenticated) {
    return NextResponse.json({ error: '未授权' }, { status: 401 })
  }

  const accessPassword = process.env.ACCESS_PASSWORD || ''
  const cdnDomain = process.env.COS_CDN_DOMAIN || ''

  return NextResponse.json({
    // EdgeOne KV 在 Next.js 项目中暂不可用
    // 需要等待 EdgeOne Pages 支持 Next.js 与 Edge Functions 共存
    kvAvailable: false,
    settings: {
      accessPassword: accessPassword ? '******' : '',
      cdnDomain,
    },
    sources: {
      accessPassword: accessPassword ? 'env' : 'none',
      cdnDomain: cdnDomain ? 'env' : 'none',
    },
    message: 'EdgeOne KV 在 Next.js 项目中暂不可用，请通过环境变量配置',
  })
}

// PUT - 更新设置（暂不支持）
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function PUT(_request: NextRequest) {
  const isAuthenticated = await verifySession()
  if (!isAuthenticated) {
    return NextResponse.json({ error: '未授权' }, { status: 401 })
  }

  // KV 不可用时，无法更新设置
  return NextResponse.json(
    { 
      error: 'EdgeOne KV 在 Next.js 项目中暂不可用，请通过环境变量配置',
      hint: '在 EdgeOne Pages 控制台的环境变量中设置 ACCESS_PASSWORD 和 COS_CDN_DOMAIN'
    }, 
    { status: 503 }
  )
}
