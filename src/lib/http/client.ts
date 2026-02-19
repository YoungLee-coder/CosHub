import type { ApiResponseEnvelope } from './response'

interface RequestJsonOptions extends RequestInit {
  fallbackMessage?: string
}

export class ApiRequestError extends Error {
  status: number
  code?: string
  requestId?: string

  constructor(message: string, status: number, code?: string, requestId?: string) {
    super(message)
    this.status = status
    this.code = code
    this.requestId = requestId
  }
}

async function parseEnvelope<T>(response: Response): Promise<ApiResponseEnvelope<T> | null> {
  try {
    return (await response.json()) as ApiResponseEnvelope<T>
  } catch {
    return null
  }
}

export async function requestJson<T>(
  input: RequestInfo | URL,
  options: RequestJsonOptions = {}
): Promise<T> {
  const { fallbackMessage = 'Request failed', ...init } = options
  const response = await fetch(input, init)
  const envelope = await parseEnvelope<T>(response)

  if (!response.ok || !envelope?.success) {
    throw new ApiRequestError(
      envelope?.error?.message || fallbackMessage,
      response.status,
      envelope?.error?.code,
      envelope?.requestId
    )
  }

  return envelope.data as T
}

export async function requestEnvelope<T>(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<{
  status: number
  body: ApiResponseEnvelope<T> | null
}> {
  const response = await fetch(input, init)
  const body = await parseEnvelope<T>(response)
  return {
    status: response.status,
    body,
  }
}
