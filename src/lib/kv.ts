// EdgeOne Pages KV 存储封装
// 
// 架构说明：
// - Edge Functions 在 edge-functions/ 目录，部署后可通过 /api/kv-* 路径访问
// - KV 通过 context.env.SETTINGS_KV 访问
// - Next.js API Routes 作为 fallback（本地开发或 Edge Function 不可用时）
//
// 部署配置：
// 1. 在 EdgeOne Pages 控制台开通 KV 存储
// 2. 创建 namespace 并绑定到项目，变量名设为 SETTINGS_KV
// 3. 部署后 Edge Functions 会处理以下路由：
//    - /api/kv-settings - 设置管理（GET/PUT）
//    - /api/kv-password - 密码验证（POST）
//    - /api/kv-cdn-domain - CDN 域名获取（GET）

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
