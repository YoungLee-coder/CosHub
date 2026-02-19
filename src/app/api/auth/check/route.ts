import { NextRequest } from 'next/server'
import { isRequestAuthenticated } from '@/features/auth/server/auth.service'
import { createRequestContext, getDurationMs, successResponse } from '@/lib/http/response'
import { logApiResult } from '@/lib/server/logger'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const context = createRequestContext(request, '/api/auth/check', 'check-session')
  const authenticated = await isRequestAuthenticated(request)

  logApiResult({
    requestId: context.requestId,
    route: context.route,
    action: context.action,
    duration: getDurationMs(context),
    result: 'success',
  })

  return successResponse(context, { authenticated })
}
