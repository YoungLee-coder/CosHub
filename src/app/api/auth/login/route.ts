import { NextRequest } from 'next/server'
import { z } from 'zod'
import {
  checkRateLimit,
  recordRateLimitFailure,
  resetRateLimit,
} from '@/features/auth/server/rate-limit'
import {
  applySessionCookie,
  createSessionToken,
  getClientIp,
  verifyAccessPassword,
} from '@/features/auth/server/auth.service'
import {
  createRequestContext,
  errorResponse,
  getDurationMs,
  successResponse,
} from '@/lib/http/response'
import { logApiResult } from '@/lib/server/logger'

const loginSchema = z.object({
  password: z.string().min(1, '请输入密码'),
})

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  const context = createRequestContext(request, '/api/auth/login', 'login')

  try {
    const payload = loginSchema.safeParse(await request.json())
    if (!payload.success) {
      logApiResult(
        {
          requestId: context.requestId,
          route: context.route,
          action: context.action,
          duration: getDurationMs(context),
          result: 'error',
        },
        payload.error.flatten()
      )
      return errorResponse(
        context,
        400,
        'INVALID_REQUEST',
        payload.error.issues[0]?.message || '请求参数错误'
      )
    }

    const ip = getClientIp(request)
    const rateLimitKey = `${ip}:/api/auth/login`
    const rateLimitResult = checkRateLimit(rateLimitKey)
    if (!rateLimitResult.allowed) {
      const response = errorResponse(
        context,
        429,
        'RATE_LIMITED',
        '请求过于频繁，请稍后再试',
        undefined,
        {
          headers: { 'Retry-After': String(rateLimitResult.retryAfterSeconds) },
        }
      )

      logApiResult({
        requestId: context.requestId,
        route: context.route,
        action: context.action,
        duration: getDurationMs(context),
        result: 'error',
      })
      return response
    }

    const isValid = verifyAccessPassword(payload.data.password)
    if (!isValid) {
      recordRateLimitFailure(rateLimitKey)
      logApiResult({
        requestId: context.requestId,
        route: context.route,
        action: context.action,
        duration: getDurationMs(context),
        result: 'error',
      })
      return errorResponse(context, 401, 'UNAUTHORIZED', '密码错误')
    }

    resetRateLimit(rateLimitKey)

    const token = await createSessionToken()
    const response = successResponse(context, { success: true })
    applySessionCookie(response, token)

    logApiResult({
      requestId: context.requestId,
      route: context.route,
      action: context.action,
      duration: getDurationMs(context),
      result: 'success',
    })
    return response
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
    return errorResponse(context, 500, 'LOGIN_FAILED', '登录失败')
  }
}
