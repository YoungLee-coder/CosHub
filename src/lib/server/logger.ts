interface ApiLogPayload {
  requestId: string
  route: string
  action: string
  duration: number
  result: 'success' | 'error'
}

export function logApiResult(payload: ApiLogPayload, error?: unknown) {
  if (payload.result === 'error') {
    console.error('api.request', {
      ...payload,
      error,
    })
    return
  }

  console.info('api.request', payload)
}
