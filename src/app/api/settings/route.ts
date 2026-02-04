import { NextRequest, NextResponse } from 'next/server'
import { verifySession } from '@/lib/auth'

// GET - 获取当前设置
export async function GET() {
  const isAuthenticated = await verifySession()
  if (!isAuthenticated) {
    return NextResponse.json({ error: '未授权' }, { status: 401 })
  }

  const accessPassword = process.env.ACCESS_PASSWORD || ''
  const cdnDomain = process.env.COS_CDN_DOMAIN || ''

  return NextResponse.json({
    // EdgeOne KV 在 Next.js 项目中暂不可用
    kvAvailable: false,
    settings: {
      accessPassword: accessPassword ? '******' : '',
      cdnDomain,
    },
    sources: {
      accessPassword: accessPassword ? 'env' : 'none',
      cdnDomain: cdnDomain ? 'env' : 'none',
    },
  })
}

// PUT - 更新设置（暂不支持）
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function PUT(_request: NextRequest) {
  const isAuthenticated = await verifySession()
  if (!isAuthenticated) {
    return NextResponse.json({ error: '未授权' }, { status: 401 })
  }

  return NextResponse.json(
    { 
      error: 'EdgeOne KV 在 Next.js 项目中暂不可用',
      hint: '请在 EdgeOne Pages 控制台的环境变量中设置 ACCESS_PASSWORD 和 COS_CDN_DOMAIN'
    }, 
    { status: 503 }
  )
}
