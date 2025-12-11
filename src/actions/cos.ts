'use server'

import {
  listBuckets,
  listObjects,
  deleteObject,
  deleteMultipleObjects,
  renameObject,
  getPresignedUrl,
  createFolder,
} from '@/lib/cos'
import type { CosFile, CosFolder, BucketItem } from '@/lib/cos'

export async function getBuckets(): Promise<BucketItem[]> {
  return listBuckets()
}

export async function getObjects(
  bucket: string,
  prefix: string = ''
): Promise<{ files: CosFile[]; folders: CosFolder[] }> {
  return listObjects(bucket, prefix)
}

export async function removeObject(bucket: string, key: string): Promise<void> {
  await deleteObject(bucket, key)
}

export async function removeObjects(bucket: string, keys: string[]): Promise<void> {
  await deleteMultipleObjects(bucket, keys)
}

export async function moveObject(bucket: string, oldKey: string, newKey: string): Promise<void> {
  await renameObject(bucket, oldKey, newKey)
}

export async function getDownloadUrl(bucket: string, key: string): Promise<string> {
  return getPresignedUrl(bucket, key, 'GET', 3600)
}

export async function getCdnUrl(key: string): Promise<string> {
  const cdnDomain = process.env.COS_CDN_DOMAIN
  if (cdnDomain) {
    return `${cdnDomain}/${encodeURIComponent(key)}`
  }
  return ''
}

export async function hasCdnDomain(): Promise<boolean> {
  return !!process.env.COS_CDN_DOMAIN
}

export async function getUploadUrl(bucket: string, key: string): Promise<string> {
  return getPresignedUrl(bucket, key, 'PUT', 3600)
}

export async function makeFolder(bucket: string, path: string): Promise<void> {
  await createFolder(bucket, path)
}
