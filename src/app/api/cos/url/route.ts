import { NextRequest, NextResponse } from 'next/server'
import { getPresignedUrl } from '@/lib/cos'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const bucket = searchParams.get('bucket')
    const key = searchParams.get('key')
    const method = (searchParams.get('method') || 'GET') as 'GET' | 'PUT'

    if (!bucket || !key) {
      return NextResponse.json({ error: 'Bucket and key are required' }, { status: 400 })
    }

    const url = await getPresignedUrl(bucket, key, method, 3600)
    return NextResponse.json({ url })
  } catch (error) {
    console.error('Get URL error:', error)
    return NextResponse.json({ error: 'Failed to get URL' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { getCdnDomain } = await import('@/lib/kv')
    const { key } = await request.json()
    let cdnDomain = await getCdnDomain()

    // 自动补全协议前缀
    if (cdnDomain && !cdnDomain.startsWith('http')) {
      cdnDomain = `https://${cdnDomain}`
    }

    if (cdnDomain && key) {
      const url = cdnDomain.endsWith('/')
        ? `${cdnDomain}${encodeURIComponent(key)}`
        : `${cdnDomain}/${encodeURIComponent(key)}`
      return NextResponse.json({ url })
    }

    return NextResponse.json({ url: '' })
  } catch (error) {
    console.error('Get CDN URL error:', error)
    return NextResponse.json({ error: 'Failed to get CDN URL' }, { status: 500 })
  }
}
