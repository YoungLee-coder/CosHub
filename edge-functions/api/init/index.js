function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

export async function onRequestGet(context) {
  const authSecret = context.env.AUTH_SECRET || ''
  const accessPassword = context.env.ACCESS_PASSWORD || ''

  let kvAvailable = true
  let cosSecretId = ''
  let cosSecretKey = ''
  let cosRegion = ''

  try {
    cosSecretId = await coshub_kv.get('cos_secret_id') || ''
    cosSecretKey = await coshub_kv.get('cos_secret_key') || ''
    cosRegion = await coshub_kv.get('cos_region') || ''
  } catch {
    kvAvailable = false
  }

  const envReady = authSecret && accessPassword
  const kvReady = kvAvailable && cosSecretId && cosSecretKey && cosRegion

  return jsonResponse({
    success: true,
    data: {
      initialized: !!envReady && !!kvReady,
      env: {
        authSecret: !!authSecret,
        accessPassword: !!accessPassword,
      },
      kv: {
        available: kvAvailable,
        cosSecretId: !!cosSecretId,
        cosSecretKey: !!cosSecretKey,
        cosRegion: !!cosRegion,
      },
    },
    error: null,
  })
}