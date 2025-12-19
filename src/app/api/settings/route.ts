import { NextRequest, NextResponse } from 'next/server'
import { verifySession } from '@/lib/auth'
import {
  getKVValue,
  setKVValue,
  isKVAvailable,
  KV_KEYS,
  getAccessPassword,
  getCdnDomain,
} from '@/lib/kv'

// GET - 获取当前设置
export async function GET() {
  const isAuthenticated = await verifySession()
  if (!isAuthenticated) {
    return NextResponse.json({ error: '未授权' }, { status: 401 })
  }

  const kvAvailable = isKVAvailable()
  
  // 获取当前配置值
  const [accessPassword, cdnDomain] = await Promise.all([
    getAccessPassword(),
    getCdnDomain(),
  ])

  // 检查各配置的来源
  const kvPassword = await getKVValue(KV_KEYS.ACCESS_PASSWORD)
  const kvCdnDomain = await getKVValue(KV_KEYS.COS_CDN_DOMAIN)

  return NextResponse.json({
    kvAvailable,
    settings: {
      accessPassword: accessPassword ? '******' : '', // 不返回明文密码
      cdnDomain,
    },
    sources: {
      accessPassword: kvPassword ? 'kv' : (process.env.ACCESS_PASSWORD ? 'env' : 'none'),
      cdnDomain: kvCdnDomain ? 'kv' : (process.env.COS_CDN_DOMAIN ? 'env' : 'none'),
    },
  })
}

// PUT - 更新设置
export async function PUT(request: NextRequest) {
  const isAuthenticated = await verifySession()
  if (!isAuthenticated) {
    return NextResponse.json({ error: '未授权' }, { status: 401 })
  }

  if (!isKVAvailable()) {
    return NextResponse.json({ error: 'KV 存储不可用' }, { status: 503 })
  }

  try {
    const body = await request.json()
    const { accessPassword, cdnDomain } = body

    const results: Record<string, boolean> = {}

    // 更新访问密码（只有非空时才更新）
    if (typeof accessPassword === 'string' && accessPassword.trim()) {
      results.accessPassword = await setKVValue(KV_KEYS.ACCESS_PASSWORD, accessPassword.trim())
    }

    // 更新 CDN 域名
    if (typeof cdnDomain === 'string') {
      results.cdnDomain = await setKVValue(KV_KEYS.COS_CDN_DOMAIN, cdnDomain.trim())
    }

    return NextResponse.json({ success: true, results })
  } catch (error) {
    console.error('Update settings error:', error)
    return NextResponse.json({ error: '更新设置失败' }, { status: 500 })
  }
}
