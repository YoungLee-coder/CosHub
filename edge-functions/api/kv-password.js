// Edge Function for password verification
// 验证密码（内部使用，不暴露密码明文）

const KV_KEY_PASSWORD = 'access_password'

export async function onRequestPost(context) {
  const { request, env } = context

  try {
    const body = await request.json()
    const inputPassword = body.password

    if (!inputPassword) {
      return new Response(JSON.stringify({ valid: false }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    let correctPassword = ''
    const kv = env.SETTINGS_KV

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

    if (!correctPassword) {
      correctPassword = env.ACCESS_PASSWORD || ''
    }

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
