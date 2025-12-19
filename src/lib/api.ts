import type { BucketItem, CosFile, CosFolder } from './cos'

export async function checkAuth(): Promise<boolean> {
  const res = await fetch('/api/auth/check')
  const data = await res.json()
  return data.authenticated
}

export async function login(password: string): Promise<{ success?: boolean; error?: string }> {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  })
  return res.json()
}

export async function logout(): Promise<void> {
  await fetch('/api/auth/logout', { method: 'POST' })
}

export async function getBuckets(): Promise<BucketItem[]> {
  const res = await fetch('/api/cos/buckets')
  if (!res.ok) throw new Error('Failed to fetch buckets')
  return res.json()
}

export async function getObjects(bucket: string, prefix: string = ''): Promise<{ files: CosFile[]; folders: CosFolder[] }> {
  const params = new URLSearchParams({ bucket, prefix })
  const res = await fetch(`/api/cos/objects?${params}`)
  if (!res.ok) throw new Error('Failed to fetch objects')
  return res.json()
}

export async function deleteObjects(bucket: string, keys: string[]): Promise<void> {
  const res = await fetch('/api/cos/objects', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bucket, keys }),
  })
  if (!res.ok) throw new Error('Failed to delete')
}

export async function renameObject(bucket: string, oldKey: string, newKey: string): Promise<void> {
  const res = await fetch('/api/cos/objects', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bucket, oldKey, newKey }),
  })
  if (!res.ok) throw new Error('Failed to rename')
}

export async function createFolder(bucket: string, path: string): Promise<void> {
  const res = await fetch('/api/cos/objects', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bucket, path }),
  })
  if (!res.ok) throw new Error('Failed to create folder')
}

export async function getDownloadUrl(bucket: string, key: string): Promise<string> {
  const params = new URLSearchParams({ bucket, key, method: 'GET' })
  const res = await fetch(`/api/cos/url?${params}`)
  const data = await res.json()
  return data.url
}

export async function getUploadUrl(bucket: string, key: string): Promise<string> {
  const params = new URLSearchParams({ bucket, key, method: 'PUT' })
  const res = await fetch(`/api/cos/url?${params}`)
  const data = await res.json()
  return data.url
}

export async function getCdnUrl(key: string): Promise<string> {
  const res = await fetch('/api/cos/url', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key }),
  })
  const data = await res.json()
  return data.url || ''
}

export async function getCdnDomain(): Promise<string> {
  const res = await fetch('/api/cos/cdn-domain')
  const data = await res.json()
  return data.domain || ''
}


// Settings API (通过 Edge Function 访问 KV)
export interface SettingsResponse {
  kvAvailable: boolean
  settings: {
    accessPassword: string
    cdnDomain: string
  }
  sources: {
    accessPassword: 'kv' | 'env' | 'none'
    cdnDomain: 'kv' | 'env' | 'none'
  }
}

export async function getSettings(): Promise<SettingsResponse> {
  // 使用 Edge Function 路径 /kv/settings (避免与 Next.js /api 冲突)
  const res = await fetch('/kv/settings')
  if (!res.ok) throw new Error('Failed to fetch settings')
  return res.json()
}

export async function updateSettings(settings: {
  accessPassword?: string
  cdnDomain?: string
}): Promise<void> {
  const res = await fetch('/kv/settings', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings),
  })
  if (!res.ok) throw new Error('Failed to update settings')
}
