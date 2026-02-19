import { NextRequest } from 'next/server'
import { z } from 'zod'
import { requireAuth } from '@/features/auth/server/auth.guard'
import { getSettingsService } from '@/features/settings/server/settings.service'
import {
  createRequestContext,
  errorResponse,
  getDurationMs,
  successResponse,
} from '@/lib/http/response'
import { logApiResult } from '@/lib/server/logger'

const updateSettingsSchema = z.object({
  accessPassword: z.string().min(1).optional(),
  cdnDomain: z.string().optional(),
})

export const runtime = 'nodejs'

// GET - 获取当前设置
export async function GET(request: NextRequest) {
  const context = createRequestContext(request, '/api/settings', 'get-settings')

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

  const data = getSettingsService()
  logApiResult({
    requestId: context.requestId,
    route: context.route,
    action: context.action,
    duration: getDurationMs(context),
    result: 'success',
  })

  return successResponse(context, data)
}

// PUT - 更新设置（暂不支持）
export async function PUT(request: NextRequest) {
  const context = createRequestContext(request, '/api/settings', 'update-settings')

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

  const payload = updateSettingsSchema.safeParse(await request.json())
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

  logApiResult({
    requestId: context.requestId,
    route: context.route,
    action: context.action,
    duration: getDurationMs(context),
    result: 'error',
  })
  return errorResponse(
    context,
    503,
    'SETTINGS_NOT_SUPPORTED',
    'EdgeOne KV 在 Next.js 项目中暂不可用',
    {
      hint: '请在 EdgeOne Pages 控制台的环境变量中设置 ACCESS_PASSWORD 和 COS_CDN_DOMAIN',
    }
  )
}
