import { NextRequest, NextResponse } from 'next/server'
import { listObjects, deleteObject, deleteMultipleObjects, renameObject, createFolder } from '@/lib/cos'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const bucket = searchParams.get('bucket')
    const prefix = searchParams.get('prefix') || ''

    if (!bucket) {
      return NextResponse.json({ error: 'Bucket is required' }, { status: 400 })
    }

    const result = await listObjects(bucket, prefix)
    return NextResponse.json(result)
  } catch (error) {
    console.error('List objects error:', error)
    return NextResponse.json({ error: 'Failed to list objects' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { bucket, keys } = await request.json()

    if (!bucket || !keys || !Array.isArray(keys)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    if (keys.length === 1) {
      await deleteObject(bucket, keys[0])
    } else {
      await deleteMultipleObjects(bucket, keys)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete error:', error)
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { bucket, oldKey, newKey } = await request.json()

    if (!bucket || !oldKey || !newKey) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    await renameObject(bucket, oldKey, newKey)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Rename error:', error)
    return NextResponse.json({ error: 'Failed to rename' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { bucket, path } = await request.json()

    if (!bucket || !path) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    await createFolder(bucket, path)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Create folder error:', error)
    return NextResponse.json({ error: 'Failed to create folder' }, { status: 500 })
  }
}
