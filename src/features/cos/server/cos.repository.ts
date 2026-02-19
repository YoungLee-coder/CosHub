import {
  createFolder,
  deleteMultipleObjects,
  deleteObject,
  getPresignedUrl,
  listBuckets,
  listObjects,
  renameObject,
} from '@/lib/cos'

export async function listBucketsRepo() {
  return listBuckets()
}

export async function listObjectsRepo(bucket: string, prefix: string) {
  return listObjects(bucket, prefix)
}

export async function deleteObjectsRepo(bucket: string, keys: string[]) {
  if (keys.length === 1) {
    return deleteObject(bucket, keys[0])
  }

  return deleteMultipleObjects(bucket, keys)
}

export async function renameObjectRepo(bucket: string, oldKey: string, newKey: string) {
  return renameObject(bucket, oldKey, newKey)
}

export async function createFolderRepo(bucket: string, path: string) {
  return createFolder(bucket, path)
}

export async function getPresignedUrlRepo(
  bucket: string,
  key: string,
  method: 'GET' | 'PUT',
  expires: number
) {
  return getPresignedUrl(bucket, key, method, expires)
}
