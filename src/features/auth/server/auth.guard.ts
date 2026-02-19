import type { NextRequest, NextResponse } from 'next/server'
import { isRequestAuthenticated } from './auth.service'
import type { RequestContext } from '@/lib/http/response'
import { errorResponse } from '@/lib/http/response'

export async function requireAuth(
  request: NextRequest,
  context: RequestContext
): Promise<NextResponse | null> {
  const authenticated = await isRequestAuthenticated(request)
  if (authenticated) {
    return null
  }

  return errorResponse(context, 401, 'UNAUTHORIZED', '未授权')
}
