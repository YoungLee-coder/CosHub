import type { BucketItem, CosFile, CosFolder } from '@/features/cos/types'
import type { InitStatus } from '@/features/init/client/init.api'
import type { SettingsResponse } from '@/features/settings/client/settings.api'

export const mockBuckets: BucketItem[] = [
  { Name: 'my-bucket-1', Location: 'ap-beijing', CreationDate: '2023-01-01T00:00:00Z' },
  { Name: 'my-bucket-2', Location: 'ap-shanghai', CreationDate: '2023-06-15T00:00:00Z' },
]

export const mockFiles: Record<string, { files: CosFile[]; folders: CosFolder[] }> = {
  'my-bucket-1': {
    folders: [{ Prefix: 'documents/' }, { Prefix: 'images/' }, { Prefix: 'projects/' }],
    files: [
      {
        Key: 'readme.md',
        LastModified: '2024-03-15T08:30:00Z',
        Size: 1024,
        ETag: '"abc123"',
        isFolder: false,
      },
      {
        Key: 'report.pdf',
        LastModified: '2024-03-10T14:20:00Z',
        Size: 2048000,
        ETag: '"def456"',
        isFolder: false,
      },
    ],
  },
  'documents/': {
    folders: [{ Prefix: 'documents/2024/' }],
    files: [
      {
        Key: 'documents/guide.md',
        LastModified: '2024-02-20T10:00:00Z',
        Size: 4096,
        ETag: '"ghi789"',
        isFolder: false,
      },
      {
        Key: 'documents/notes.txt',
        LastModified: '2024-01-05T09:15:00Z',
        Size: 256,
        ETag: '"jkl012"',
        isFolder: false,
      },
    ],
  },
  'images/': {
    folders: [{ Prefix: 'images/screenshots/' }],
    files: [
      {
        Key: 'images/logo.png',
        LastModified: '2024-03-01T12:00:00Z',
        Size: 512000,
        ETag: '"mno345"',
        isFolder: false,
      },
    ],
  },
  'my-bucket-2': {
    folders: [],
    files: [
      {
        Key: 'backup.sql',
        LastModified: '2024-04-01T00:00:00Z',
        Size: 10485760,
        ETag: '"pqr678"',
        isFolder: false,
      },
    ],
  },
}

export const mockInitStatus: InitStatus = {
  initialized: true,
  env: {
    authSecret: true,
    accessPassword: true,
  },
  kv: {
    available: true,
    cosSecretId: true,
    cosSecretKey: true,
    cosRegion: true,
  },
}

export const mockSettings: SettingsResponse = {
  kvAvailable: true,
  cosSecretId: 'mock-cos-secret-id',
  cosSecretKey: 'mock-cos-secret-key',
  cosRegion: 'ap-beijing',
  cdnDomain: 'https://cdn.example.com',
}

export const mockAuthState = {
  isAuthenticated: false,
}
