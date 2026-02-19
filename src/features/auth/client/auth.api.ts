import { requestEnvelope, requestJson } from '@/lib/http/client'

export async function checkAuth(): Promise<boolean> {
  try {
    const data = await requestJson<{ authenticated: boolean }>('/api/auth/check', {
      cache: 'no-store',
      fallbackMessage: '认证检查失败',
    })
    return data.authenticated
  } catch {
    return false
  }
}

export async function login(password: string): Promise<{ success?: boolean; error?: string }> {
  const { status, body } = await requestEnvelope<{ success: boolean }>('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  })

  if (status >= 200 && status < 300 && body?.success) {
    return { success: true }
  }

  return {
    error: body?.error?.message || '登录失败',
  }
}

export async function logout(): Promise<void> {
  await requestJson<{ success: boolean }>('/api/auth/logout', {
    method: 'POST',
    fallbackMessage: '退出登录失败',
  })
}
