import COS from 'cos-nodejs-sdk-v5'

let cosInstance: COS | null = null

export function getCosClient(): COS {
  if (cosInstance) return cosInstance

  const secretId = process.env.COS_SECRET_ID
  const secretKey = process.env.COS_SECRET_KEY

  if (!secretId || !secretKey) {
    throw new Error('COS credentials not configured')
  }

  cosInstance = new COS({
    SecretId: secretId,
    SecretKey: secretKey,
  })

  return cosInstance
}

export function getRegion(): string {
  return process.env.COS_REGION || 'ap-guangzhou'
}

export interface CosFile {
  Key: string
  LastModified: string
  Size: number
  ETag: string
  isFolder: boolean
}

export interface CosFolder {
  Prefix: string
}

export interface BucketItem {
  Name: string
  Location: string
  CreationDate: string
}

export async function listBuckets(): Promise<BucketItem[]> {
  const cos = getCosClient()
  return new Promise((resolve, reject) => {
    cos.getService({}, (err, data) => {
      if (err) reject(err)
      else resolve((data.Buckets || []) as BucketItem[])
    })
  })
}

export async function listObjects(
  bucket: string,
  prefix: string = '',
  delimiter: string = '/'
): Promise<{ files: CosFile[]; folders: CosFolder[] }> {
  const cos = getCosClient()
  const region = getRegion()

  return new Promise((resolve, reject) => {
    cos.getBucket(
      {
        Bucket: bucket,
        Region: region,
        Prefix: prefix,
        Delimiter: delimiter,
        MaxKeys: 1000,
      },
      (err, data) => {
        if (err) reject(err)
        else {
          const files: CosFile[] = (data.Contents || [])
            .filter((item) => item.Key !== prefix)
            .map((item) => ({
              Key: item.Key!,
              LastModified: item.LastModified!,
              Size: Number(item.Size) || 0,
              ETag: item.ETag!,
              isFolder: item.Key!.endsWith('/'),
            }))

          const folders: CosFolder[] = (data.CommonPrefixes || []).map((item) => ({
            Prefix: item.Prefix!,
          }))

          resolve({ files, folders })
        }
      }
    )
  })
}

export async function deleteObject(bucket: string, key: string): Promise<void> {
  const cos = getCosClient()
  const region = getRegion()

  return new Promise((resolve, reject) => {
    cos.deleteObject(
      {
        Bucket: bucket,
        Region: region,
        Key: key,
      },
      (err) => {
        if (err) reject(err)
        else resolve()
      }
    )
  })
}

export async function deleteMultipleObjects(bucket: string, keys: string[]): Promise<void> {
  const cos = getCosClient()
  const region = getRegion()

  return new Promise((resolve, reject) => {
    cos.deleteMultipleObject(
      {
        Bucket: bucket,
        Region: region,
        Objects: keys.map((key) => ({ Key: key })),
      },
      (err) => {
        if (err) reject(err)
        else resolve()
      }
    )
  })
}

export async function renameObject(bucket: string, oldKey: string, newKey: string): Promise<void> {
  const cos = getCosClient()
  const region = getRegion()

  // Copy to new location
  await new Promise<void>((resolve, reject) => {
    cos.putObjectCopy(
      {
        Bucket: bucket,
        Region: region,
        Key: newKey,
        CopySource: `${bucket}.cos.${region}.myqcloud.com/${encodeURIComponent(oldKey)}`,
      },
      (err) => {
        if (err) reject(err)
        else resolve()
      }
    )
  })

  // Delete old object
  await deleteObject(bucket, oldKey)
}

export function getPresignedUrl(
  bucket: string,
  key: string,
  method: 'GET' | 'PUT' = 'GET',
  expires: number = 3600
): Promise<string> {
  const cos = getCosClient()
  const region = getRegion()

  return new Promise((resolve, reject) => {
    cos.getObjectUrl(
      {
        Bucket: bucket,
        Region: region,
        Key: key,
        Method: method,
        Expires: expires,
        Sign: true,
      },
      (err, data) => {
        if (err) reject(err)
        else resolve(data.Url)
      }
    )
  })
}

export async function createFolder(bucket: string, folderPath: string): Promise<void> {
  const cos = getCosClient()
  const region = getRegion()

  const key = folderPath.endsWith('/') ? folderPath : `${folderPath}/`

  return new Promise((resolve, reject) => {
    cos.putObject(
      {
        Bucket: bucket,
        Region: region,
        Key: key,
        Body: '',
      },
      (err) => {
        if (err) reject(err)
        else resolve()
      }
    )
  })
}
