// Edge Function for getting access password from KV
// 供 Next.js API 调用验证密码（内部使用，不暴露密码明文）

// EdgeOne Pages Edge Functions 类型定义
interface KVNamespace {
  get(key: string, type?: 'text' | 'json' | 'arrayBuffer' | 'stream'): Promise<string | null>
}

interface EventContext {
  request: Request
  params: Record<string, string>
  env: {
    SETTINGS_KV?: KVNamespace
    ACCESS_PASSWORD?: string
    [key: string]: unknown
  }
  waitUntil: (task: Promise<unknown>) => void
}

const KV_KEY_PASSWORD = 'access_password'

// POST - 验证密码
export async function onRequestPost(context: EventContext): Promise<Response> {
  const { request, env } = context

  try {
    const body = await request.json() as { password: string }
    const inputPassword = body.password

    if (!inputPassword) {
      return new Response(JSON.stringify({ valid: false }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // 获取正确的密码
    let correctPassword = ''
    const kv = env.SETTINGS_KV

    // 优先从 KV 获取
    if (kv) {
      try {
        const kvValue = await kv.get(KV_KEY_PASSWORD, 'text')
        if (kvValue) {
          correctPassword = kvValue
        }
      } catch (e) {
        console.error('KV read error:', e)
      }
    }

    // fallback 到环境变量
    if (!correctPassword) {
      correctPassword = env.ACCESS_PASSWORD || ''
    }

    // 验证密码
    const valid = correctPassword && inputPassword === correctPassword

    return new Response(JSON.stringify({ valid }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch {
    return new Response(JSON.stringify({ valid: false, error: 'Invalid request' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
