// EdgeOne Pages KV 存储封装
// 需要在 EdgeOne Pages 控制台绑定 KV namespace，变量名为 SETTINGS_KV

// KV 配置键名
export const KV_KEYS = {
  ACCESS_PASSWORD: 'access_password',
  COS_CDN_DOMAIN: 'cos_cdn_domain',
} as const

export type KVKey = (typeof KV_KEYS)[keyof typeof KV_KEYS]

// 获取 KV 实例（仅在 EdgeOne Pages 运行时可用）
function getKV(): KVNamespace | null {
  // @ts-expect-error EdgeOne Pages 运行时注入的全局变量
  if (typeof SETTINGS_KV !== 'undefined') {
    // @ts-expect-error EdgeOne Pages 运行时注入的全局变量
    return SETTINGS_KV as KVNamespace
  }
  return null
}

// KVNamespace 接口定义（EdgeOne Pages KV API）
interface KVNamespace {
  get(key: string, type?: 'text' | 'json' | 'arrayBuffer' | 'stream'): Promise<string | null>
  put(key: string, value: string): Promise<void>
  delete(key: string): Promise<void>
  list(options?: { prefix?: string; limit?: number; cursor?: string }): Promise<{
    keys: { name: string }[]
    complete: boolean
    cursor: string | null
  }>
}

// 从 KV 获取值，如果 KV 不可用或值不存在则返回 null
export async function getKVValue(key: KVKey): Promise<string | null> {
  const kv = getKV()
  if (!kv) return null
  
  try {
    return await kv.get(key, 'text')
  } catch (error) {
    console.error(`Failed to get KV value for ${key}:`, error)
    return null
  }
}

// 设置 KV 值
export async function setKVValue(key: KVKey, value: string): Promise<boolean> {
  const kv = getKV()
  if (!kv) return false
  
  try {
    await kv.put(key, value)
    return true
  } catch (error) {
    console.error(`Failed to set KV value for ${key}:`, error)
    return false
  }
}

// 删除 KV 值
export async function deleteKVValue(key: KVKey): Promise<boolean> {
  const kv = getKV()
  if (!kv) return false
  
  try {
    await kv.delete(key)
    return true
  } catch (error) {
    console.error(`Failed to delete KV value for ${key}:`, error)
    return false
  }
}

// 检查 KV 是否可用
export function isKVAvailable(): boolean {
  return getKV() !== null
}

// 获取配置值（优先 KV，其次环境变量）
export async function getConfigValue(key: KVKey, envKey: string): Promise<string> {
  const kvValue = await getKVValue(key)
  if (kvValue !== null && kvValue !== '') {
    return kvValue
  }
  return process.env[envKey] || ''
}

// 获取访问密码
export async function getAccessPassword(): Promise<string> {
  return getConfigValue(KV_KEYS.ACCESS_PASSWORD, 'ACCESS_PASSWORD')
}

// 获取 CDN 域名
export async function getCdnDomain(): Promise<string> {
  return getConfigValue(KV_KEYS.COS_CDN_DOMAIN, 'COS_CDN_DOMAIN')
}
