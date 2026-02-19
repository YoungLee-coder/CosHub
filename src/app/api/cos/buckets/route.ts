import { NextRequest } from 'next/server'
import { requireAuth } from '@/features/auth/server/auth.guard'
import { listBucketsService } from '@/features/cos/server/cos.service'
import {
  createRequestContext,
  errorResponse,
  getDurationMs,
  successResponse,
} from '@/lib/http/response'
import { logApiResult } from '@/lib/server/logger'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const context = createRequestContext(request, '/api/cos/buckets', 'list-buckets')

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

  try {
    const buckets = await listBucketsService()
    logApiResult({
      requestId: context.requestId,
      route: context.route,
      action: context.action,
      duration: getDurationMs(context),
      result: 'success',
    })
    return successResponse(context, buckets)
  } catch (error) {
    logApiResult(
      {
        requestId: context.requestId,
        route: context.route,
        action: context.action,
        duration: getDurationMs(context),
        result: 'error',
      },
      error
    )
    return errorResponse(context, 500, 'LIST_BUCKETS_FAILED', 'Failed to list buckets')
  }
}
