import { mockRequest } from '@/mocks/handlers'

interface ApiResponse<T> {
  success: boolean
  data: T | null
  error: string | null
}

interface RequestJsonOptions extends RequestInit {
  fallbackMessage?: string
}

export class ApiRequestError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

async function parseResponse<T>(response: Response): Promise<ApiResponse<T> | null> {
  try {
    return (await response.json()) as ApiResponse<T>
  } catch {
    return null
  }
}

async function fetchWithMock(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  if (import.meta.env.VITE_ENABLE_MOCK === 'true') {
    const url = typeof input === 'string' ? input : input.toString()
    const mocked = await mockRequest(url, new Request(url, init))
    if (mocked) {
      return mocked
    }
  }
  return fetch(input, init)
}

export async function requestJson<T>(
  input: RequestInfo | URL,
  options: RequestJsonOptions = {}
): Promise<T> {
  const { fallbackMessage = 'Request failed', ...init } = options
  const response = await fetchWithMock(input, init)
  const body = await parseResponse<T>(response)

  if (!response.ok || !body?.success) {
    throw new ApiRequestError(body?.error || fallbackMessage, response.status)
  }

  return body.data as T
}

export async function requestEnvelope<T>(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<{
  status: number
  body: ApiResponse<T> | null
}> {
  const response = await fetchWithMock(input, init)
  const body = await parseResponse<T>(response)
  return {
    status: response.status,
    body,
  }
}
