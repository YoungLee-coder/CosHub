import { requestJson } from '@/lib/http/client'

export interface InitEnvStatus {
  authSecret: boolean
  accessPassword: boolean
}

export interface InitKvStatus {
  available: boolean
  cosSecretId: boolean
  cosSecretKey: boolean
  cosRegion: boolean
}

export interface InitStatus {
  initialized: boolean
  env: InitEnvStatus
  kv: InitKvStatus
}

export async function checkInit(): Promise<InitStatus> {
  return requestJson<InitStatus>('/api/init', {
    fallbackMessage: '初始化检查失败',
  })
}
