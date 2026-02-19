import { NextRequest } from 'next/server'
import { z } from 'zod'
import { requireAuth } from '@/features/auth/server/auth.guard'
import { buildCdnUrl, getPresignedUrlService } from '@/features/cos/server/cos.service'
import {
  createRequestContext,
  errorResponse,
  getDurationMs,
  successResponse,
} from '@/lib/http/response'
import { logApiResult } from '@/lib/server/logger'

const presignedUrlQuerySchema = z.object({
  bucket: z.string().min(1, 'Bucket and key are required'),
  key: z.string().min(1, 'Bucket and key are required'),
  method: z.enum(['GET', 'PUT']).default('GET'),
})

const cdnUrlSchema = z.object({
  key: z.string().optional().default(''),
})

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const context = createRequestContext(request, '/api/cos/url', 'get-presigned-url')

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
    const { searchParams } = new URL(request.url)
    const parsedQuery = presignedUrlQuerySchema.safeParse({
      bucket: searchParams.get('bucket') || '',
      key: searchParams.get('key') || '',
      method: searchParams.get('method') || 'GET',
    })

    if (!parsedQuery.success) {
      logApiResult(
        {
          requestId: context.requestId,
          route: context.route,
          action: context.action,
          duration: getDurationMs(context),
          result: 'error',
        },
        parsedQuery.error.flatten()
      )
      return errorResponse(
        context,
        400,
        'INVALID_REQUEST',
        parsedQuery.error.issues[0]?.message || 'Invalid request'
      )
    }

    const url = await getPresignedUrlService(
      parsedQuery.data.bucket,
      parsedQuery.data.key,
      parsedQuery.data.method
    )
    logApiResult({
      requestId: context.requestId,
      route: context.route,
      action: context.action,
      duration: getDurationMs(context),
      result: 'success',
    })
    return successResponse(context, { url })
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
    return errorResponse(context, 500, 'GET_URL_FAILED', 'Failed to get URL')
  }
}

export async function POST(request: NextRequest) {
  const context = createRequestContext(request, '/api/cos/url', 'get-cdn-url')

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
    const parsedBody = cdnUrlSchema.safeParse(await request.json())
    if (!parsedBody.success) {
      logApiResult(
        {
          requestId: context.requestId,
          route: context.route,
          action: context.action,
          duration: getDurationMs(context),
          result: 'error',
        },
        parsedBody.error.flatten()
      )
      return errorResponse(context, 400, 'INVALID_REQUEST', 'Invalid request')
    }

    const url = buildCdnUrl(parsedBody.data.key)
    logApiResult({
      requestId: context.requestId,
      route: context.route,
      action: context.action,
      duration: getDurationMs(context),
      result: 'success',
    })

    return successResponse(context, { url })
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
    return errorResponse(context, 500, 'GET_CDN_URL_FAILED', 'Failed to get CDN URL')
  }
}
