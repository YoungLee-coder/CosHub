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

export async function requestJson<T>(
  input: RequestInfo | URL,
  options: RequestJsonOptions = {}
): Promise<T> {
  const { fallbackMessage = 'Request failed', ...init } = options
  const response = await fetch(input, init)
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
  const response = await fetch(input, init)
  const body = await parseResponse<T>(response)
  return {
    status: response.status,
    body,
  }
}
