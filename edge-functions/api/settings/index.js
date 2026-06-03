function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

export async function onRequestGet(context) {
  let accessPassword = ''
  let cdnDomain = ''
  let source = 'kv'

  try {
    const kvPassword = await coshub_kv.get('access_password')
    if (kvPassword) {
      accessPassword = '******'
    } else {
      accessPassword = context.env.ACCESS_PASSWORD ? '******' : ''
      if (!kvPassword) source = 'env'
    }
  } catch {
    accessPassword = context.env.ACCESS_PASSWORD ? '******' : ''
    source = 'env'
  }

  try {
    const kvCdn = await coshub_kv.get('cos_cdn_domain')
    if (kvCdn) {
      cdnDomain = kvCdn
    } else {
      cdnDomain = context.env.COS_CDN_DOMAIN || ''
      if (!kvCdn && source === 'kv') source = 'env'
    }
  } catch {
    cdnDomain = context.env.COS_CDN_DOMAIN || ''
    source = 'env'
  }

  return jsonResponse({
    success: true,
    data: {
      kvAvailable: true,
      accessPassword,
      cdnDomain,
      source,
    },
    error: null,
  })
}

export async function onRequestPut(context) {
  try {
    const body = await context.request.json()
    const updates = {}

    if (body.accessPassword && typeof body.accessPassword === 'string' && body.accessPassword !== '******') {
      await coshub_kv.put('access_password', body.accessPassword)
      updates.accessPassword = '******'
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
  } catch (err) {
    return jsonResponse({ success: false, data: null, error: '保存设置失败' }, 500)
  }
}