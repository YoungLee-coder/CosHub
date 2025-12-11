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
    const { key } = await request.json()
    const cdnDomain = process.env.COS_CDN_DOMAIN

    if (cdnDomain && key) {
      return NextResponse.json({ url: `${cdnDomain}/${encodeURIComponent(key)}` })
    }

    return NextResponse.json({ url: '' })
  } catch (error) {
    console.error('Get CDN URL error:', error)
    return NextResponse.json({ error: 'Failed to get CDN URL' }, { status: 500 })
  }
}
