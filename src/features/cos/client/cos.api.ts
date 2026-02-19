import { requestJson } from '@/lib/http/client'
import type { BucketItem, CosObjectsResult } from '../types'

export async function getBuckets(): Promise<BucketItem[]> {
  return requestJson<BucketItem[]>('/api/cos/buckets', {
    fallbackMessage: 'Failed to fetch buckets',
  })
}

export async function getObjects(bucket: string, prefix: string = ''): Promise<CosObjectsResult> {
  const params = new URLSearchParams({ bucket, prefix })
  return requestJson<CosObjectsResult>(`/api/cos/objects?${params.toString()}`, {
    fallbackMessage: 'Failed to fetch objects',
  })
}

export async function deleteObjects(bucket: string, keys: string[]): Promise<void> {
  await requestJson<{ success: boolean }>('/api/cos/objects', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bucket, keys }),
    fallbackMessage: 'Failed to delete',
  })
}

export async function renameObject(bucket: string, oldKey: string, newKey: string): Promise<void> {
  await requestJson<{ success: boolean }>('/api/cos/objects', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bucket, oldKey, newKey }),
    fallbackMessage: 'Failed to rename',
  })
}

export async function createFolder(bucket: string, path: string): Promise<void> {
  await requestJson<{ success: boolean }>('/api/cos/objects', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bucket, path }),
    fallbackMessage: 'Failed to create folder',
  })
}

export async function getDownloadUrl(bucket: string, key: string): Promise<string> {
  const params = new URLSearchParams({ bucket, key, method: 'GET' })
  const result = await requestJson<{ url: string }>(`/api/cos/url?${params.toString()}`, {
    fallbackMessage: 'Failed to fetch download URL',
  })
  return result.url
}

export async function getUploadUrl(bucket: string, key: string): Promise<string> {
  const params = new URLSearchParams({ bucket, key, method: 'PUT' })
  const result = await requestJson<{ url: string }>(`/api/cos/url?${params.toString()}`, {
    fallbackMessage: 'Failed to fetch upload URL',
  })
  return result.url
}

export async function getCdnUrl(key: string): Promise<string> {
  const result = await requestJson<{ url: string }>('/api/cos/url', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key }),
    fallbackMessage: 'Failed to fetch CDN URL',
  })
  return result.url || ''
}

export async function getCdnDomain(): Promise<string> {
  const result = await requestJson<{ domain: string }>('/api/cos/cdn-domain', {
    fallbackMessage: 'Failed to fetch CDN domain',
  })
  return result.domain || ''
}
