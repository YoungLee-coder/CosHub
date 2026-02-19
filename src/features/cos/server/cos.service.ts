import {
  createFolderRepo,
  deleteObjectsRepo,
  getPresignedUrlRepo,
  listBucketsRepo,
  listObjectsRepo,
  renameObjectRepo,
} from './cos.repository'

export async function listBucketsService() {
  return listBucketsRepo()
}

export async function listObjectsService(bucket: string, prefix: string) {
  return listObjectsRepo(bucket, prefix)
}

export async function deleteObjectsService(bucket: string, keys: string[]) {
  return deleteObjectsRepo(bucket, keys)
}

export async function renameObjectService(bucket: string, oldKey: string, newKey: string) {
  return renameObjectRepo(bucket, oldKey, newKey)
}

export async function createFolderService(bucket: string, path: string) {
  return createFolderRepo(bucket, path)
}

export async function getPresignedUrlService(bucket: string, key: string, method: 'GET' | 'PUT') {
  return getPresignedUrlRepo(bucket, key, method, 3600)
}

export function buildCdnUrl(key: string): string {
  let cdnDomain = process.env.COS_CDN_DOMAIN || ''

  if (cdnDomain && !cdnDomain.startsWith('http')) {
    cdnDomain = `https://${cdnDomain}`
  }

  if (!cdnDomain || !key) {
    return ''
  }

  return cdnDomain.endsWith('/')
    ? `${cdnDomain}${encodeURIComponent(key)}`
    : `${cdnDomain}/${encodeURIComponent(key)}`
}

export function getCdnDomainService(): string {
  return process.env.COS_CDN_DOMAIN || ''
}
