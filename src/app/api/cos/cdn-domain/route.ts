import { NextRequest } from 'next/server'
import { requireAuth } from '@/features/auth/server/auth.guard'
import { getCdnDomainService } from '@/features/cos/server/cos.service'
import { createRequestContext, getDurationMs, successResponse } from '@/lib/http/response'
import { logApiResult } from '@/lib/server/logger'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const context = createRequestContext(request, '/api/cos/cdn-domain', 'get-cdn-domain')

  const authError = await requireAuth(request, context)
  if (authError) {
    logApiResult({
      requestId: context.requestId,
      route: context.route,
      action: context.action,
      duration: getDurationMs(context),
      result: 'error',
    })
    return authError
  }

  const domain = getCdnDomainService()
  logApiResult({
    requestId: context.requestId,
    route: context.route,
    action: context.action,
    duration: getDurationMs(context),
    result: 'success',
  })

  return successResponse(context, { domain })
}
