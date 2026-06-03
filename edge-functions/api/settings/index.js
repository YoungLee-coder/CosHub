function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

const MASK = '******'

function maskIfSet(value) {
  return value ? MASK : ''
}

export async function onRequestGet(context) {
  let cosSecretId = ''
  let cosSecretKey = ''
  let cosRegion = ''
  let cdnDomain = ''
  let kvAvailable = true

  try {
    cosSecretId = await coshub_kv.get('cos_secret_id') || ''
    cosSecretKey = await coshub_kv.get('cos_secret_key') || ''
    cosRegion = await coshub_kv.get('cos_region') || ''
    cdnDomain = await coshub_kv.get('cos_cdn_domain') || ''
  } catch {
    kvAvailable = false
  }

  return jsonResponse({
    success: true,
    data: {
      kvAvailable,
      cosSecretId: maskIfSet(cosSecretId),
      cosSecretKey: maskIfSet(cosSecretKey),
      cosRegion,
      cdnDomain,
    },
    error: null,
  })
}

export async function onRequestPut(context) {
  try {
    const body = await context.request.json()
    const updates = {}

    if (body.cosSecretId && typeof body.cosSecretId === 'string' && body.cosSecretId !== MASK) {
      await coshub_kv.put('cos_secret_id', body.cosSecretId)
      updates.cosSecretId = MASK
    }

    if (body.cosSecretKey && typeof body.cosSecretKey === 'string' && body.cosSecretKey !== MASK) {
      await coshub_kv.put('cos_secret_key', body.cosSecretKey)
      updates.cosSecretKey = MASK
    }

    if (body.cosRegion !== undefined && typeof body.cosRegion === 'string') {
      await coshub_kv.put('cos_region', body.cosRegion)
      updates.cosRegion = body.cosRegion
    }

    if (body.cdnDomain !== undefined && typeof body.cdnDomain === 'string') {
      await coshub_kv.put('cos_cdn_domain', body.cdnDomain)
      updates.cdnDomain = body.cdnDomain
    }

    return jsonResponse({
      success: true,
      data: updates,
      error: null,
    })
  } catch {
    return jsonResponse({ success: false, data: null, error: '保存设置失败' }, 500)
  }
}