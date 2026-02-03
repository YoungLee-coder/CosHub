import { NextRequest, NextResponse } from 'next/server'
import { verifySession } from '@/lib/auth'

// 本地开发 fallback - 当 Edge Functions 不可用时使用
// 在 EdgeOne Pages 部署后，Edge Functions 会优先处理 /api/settings 路由

// GET - 获取当前设置（基于环境变量，本地开发用）
export async function GET() {
  const isAuthenticated = await verifySession()
  if (!isAuthenticated) {
    return NextResponse.json({ error: '未授权' }, { status: 401 })
  }

  const accessPassword = process.env.ACCESS_PASSWORD || ''
  const cdnDomain = process.env.COS_CDN_DOMAIN || ''

  return NextResponse.json({
    // 本地开发时 KV 不可用，部署到 EdgeOne Pages 后由 Edge Functions 处理
    kvAvailable: false,
    settings: {
      accessPassword: accessPassword ? '******' : '',
      cdnDomain,
    },
    sources: {
      accessPassword: accessPassword ? 'env' : 'none',
      cdnDomain: cdnDomain ? 'env' : 'none',
    },
    message: '本地开发模式，KV 功能需部署到 EdgeOne Pages 后使用',
  })
}

// PUT - 更新设置（本地开发不支持）
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function PUT(_request: NextRequest) {
  const isAuthenticated = await verifySession()
  if (!isAuthenticated) {
    return NextResponse.json({ error: '未授权' }, { status: 401 })
  }

  // 本地开发时 KV 不可用
  return NextResponse.json(
    { 
      error: '本地开发模式不支持 KV 存储',
      hint: '部署到 EdgeOne Pages 后，可通过 KV 存储动态修改配置'
    }, 
    { status: 503 }
  )
}
