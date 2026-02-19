import { NextRequest, NextResponse } from 'next/server'

export interface ApiErrorPayload {
  code: string
  message: string
  details?: unknown
}

export interface ApiResponseEnvelope<T> {
  success: boolean
  data: T | null
  error: ApiErrorPayload | null
  requestId: string
}

export interface RequestContext {
  requestId: string
  route: string
  action: string
  startedAt: number
}

const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, max-age=0',
  Pragma: 'no-cache',
  Expires: '0',
}

function mergeHeaders(headers?: HeadersInit): Headers {
  const merged = new Headers(headers)
  Object.entries(NO_STORE_HEADERS).forEach(([key, value]) => {
    merged.set(key, value)
  })
  return merged
}

export function createRequestContext(
  request: NextRequest,
  route: string,
  action: string
): RequestContext {
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID()
  return {
    requestId,
    route,
    action,
    startedAt: Date.now(),
  }
}

export function getDurationMs(context: RequestContext): number {
  return Date.now() - context.startedAt
}

export function successResponse<T>(context: RequestContext, data: T, init?: ResponseInit) {
  const body: ApiResponseEnvelope<T> = {
    success: true,
    data,
    error: null,
    requestId: context.requestId,
  }

  return NextResponse.json(body, {
    ...init,
    headers: mergeHeaders(init?.headers),
  })
}

export function errorResponse(
  context: RequestContext,
  status: number,
  code: string,
  message: string,
  details?: unknown,
  init?: ResponseInit
) {
  const body: ApiResponseEnvelope<null> = {
    success: false,
    data: null,
    error: {
      code,
      message,
      details,
    },
    requestId: context.requestId,
  }

  return NextResponse.json(body, {
    ...init,
    status,
    headers: mergeHeaders(init?.headers),
  })
}
