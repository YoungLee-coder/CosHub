export interface FileItem {
  key: string
  name: string
  size: number
  lastModified: string
  isFolder: boolean
  etag?: string
}

export interface BucketInfo {
  name: string
  region: string
  creationDate: string
}

export interface UploadProgress {
  file: File
  progress: number
  status: 'pending' | 'uploading' | 'completed' | 'error'
  error?: string
}
