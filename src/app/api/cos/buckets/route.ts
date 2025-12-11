import { NextResponse } from 'next/server'
import { listBuckets } from '@/lib/cos'

export async function GET() {
  try {
    const buckets = await listBuckets()
    return NextResponse.json(buckets)
  } catch (error) {
    console.error('List buckets error:', error)
    return NextResponse.json({ error: 'Failed to list buckets' }, { status: 500 })
  }
}
