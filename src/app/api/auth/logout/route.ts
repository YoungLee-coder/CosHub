import { NextRequest } from 'next/server'
import { clearSessionCookie } from '@/features/auth/server/auth.service'
import { createRequestContext, getDurationMs, successResponse } from '@/lib/http/response'
import { logApiResult } from '@/lib/server/logger'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  const context = createRequestContext(request, '/api/auth/logout', 'logout')
  const response = successResponse(context, { success: true })
  clearSessionCookie(response)

  logApiResult({
    requestId: context.requestId,
    route: context.route,
    action: context.action,
    duration: getDurationMs(context),
    result: 'success',
  })

  return response
}
