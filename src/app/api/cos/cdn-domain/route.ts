import { NextResponse } from 'next/server'
import { getCdnDomain } from '@/lib/kv'

export async function GET() {
  const cdnDomain = await getCdnDomain()
  return NextResponse.json({ domain: cdnDomain })
}
