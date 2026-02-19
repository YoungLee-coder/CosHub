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

export interface CosObjectsResult {
  files: CosFile[]
  folders: CosFolder[]
}
