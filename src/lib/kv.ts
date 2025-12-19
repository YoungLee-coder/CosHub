// EdgeOne Pages KV 存储封装
// 需要在 EdgeOne Pages 控制台绑定 KV namespace，变量名为 SETTINGS_KV
// 注意：KV 只能在 Edge Runtime 中使用

// KV 配置键名
export const KV_KEYS = {
  ACCESS_PASSWORD: 'access_password',
  COS_CDN_DOMAIN: 'cos_cdn_domain',
} as const

export type KVKey = (typeof KV_KEYS)[keyof typeof KV_KEYS]

// KVNamespace 接口定义（EdgeOne Pages KV API）
export interface KVNamespace {
  get(key: string, type?: 'text' | 'json' | 'arrayBuffer' | 'stream'): Promise<string | null>
  put(key: string, value: string): Promise<void>
  delete(key: string): Promise<void>
  list(options?: { prefix?: string; limit?: number; cursor?: string }): Promise<{
    keys: { name: string }[]
    complete: boolean
    cursor: string | null
  }>
}

// EdgeOne Pages 环境变量接口
export interface EdgeOneEnv {
  SETTINGS_KV?: KVNamespace
  [key: string]: unknown
}

// 从 KV 获取值
export async function getKVValue(kv: KVNamespace | undefined, key: KVKey): Promise<string | null> {
  if (!kv) return null
  
  try {
    return await kv.get(key, 'text')
  } catch (error) {
    console.error(`Failed to get KV value for ${key}:`, error)
    return null
  }
}

// 设置 KV 值
export async function setKVValue(kv: KVNamespace | undefined, key: KVKey, value: string): Promise<boolean> {
  if (!kv) return false
  
  try {
    await kv.put(key, value)
    return true
  } catch (error) {
    console.error(`Failed to set KV value for ${key}:`, error)
    return false
  }
}

// 获取配置值（优先 KV，其次环境变量）
export async function getConfigValue(kv: KVNamespace | undefined, key: KVKey, envKey: string): Promise<string> {
  const kvValue = await getKVValue(kv, key)
  if (kvValue !== null && kvValue !== '') {
    return kvValue
  }
  return process.env[envKey] || ''
}

// 获取访问密码（需要传入 KV 实例）
export async function getAccessPassword(kv?: KVNamespace): Promise<string> {
  return getConfigValue(kv, KV_KEYS.ACCESS_PASSWORD, 'ACCESS_PASSWORD')
}

// 获取 CDN 域名（需要传入 KV 实例）
export async function getCdnDomain(kv?: KVNamespace): Promise<string> {
  return getConfigValue(kv, KV_KEYS.COS_CDN_DOMAIN, 'COS_CDN_DOMAIN')
}
