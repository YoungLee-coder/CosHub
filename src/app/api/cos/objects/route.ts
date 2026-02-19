import { NextRequest } from 'next/server'
import { z } from 'zod'
import { requireAuth } from '@/features/auth/server/auth.guard'
import {
  createFolderService,
  deleteObjectsService,
  listObjectsService,
  renameObjectService,
} from '@/features/cos/server/cos.service'
import {
  createRequestContext,
  errorResponse,
  getDurationMs,
  successResponse,
} from '@/lib/http/response'
import { logApiResult } from '@/lib/server/logger'

const listObjectsQuerySchema = z.object({
  bucket: z.string().min(1, 'Bucket is required'),
  prefix: z.string().optional(),
})

const deleteObjectsSchema = z.object({
  bucket: z.string().min(1),
  keys: z.array(z.string().min(1)).min(1),
})

const renameObjectSchema = z.object({
  bucket: z.string().min(1),
  oldKey: z.string().min(1),
  newKey: z.string().min(1),
})

const createFolderSchema = z.object({
  bucket: z.string().min(1),
  path: z.string().min(1),
})

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const context = createRequestContext(request, '/api/cos/objects', 'list-objects')

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
    const parsedQuery = listObjectsQuerySchema.safeParse({
      bucket: searchParams.get('bucket') || '',
      prefix: searchParams.get('prefix') || '',
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

    const result = await listObjectsService(parsedQuery.data.bucket, parsedQuery.data.prefix || '')
    logApiResult({
      requestId: context.requestId,
      route: context.route,
      action: context.action,
      duration: getDurationMs(context),
      result: 'success',
    })
    return successResponse(context, result)
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
    return errorResponse(context, 500, 'LIST_OBJECTS_FAILED', 'Failed to list objects')
  }
}

export async function DELETE(request: NextRequest) {
  const context = createRequestContext(request, '/api/cos/objects', 'delete-objects')

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
    const parsedBody = deleteObjectsSchema.safeParse(await request.json())

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

    await deleteObjectsService(parsedBody.data.bucket, parsedBody.data.keys)

    logApiResult({
      requestId: context.requestId,
      route: context.route,
      action: context.action,
      duration: getDurationMs(context),
      result: 'success',
    })
    return successResponse(context, { success: true })
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
    return errorResponse(context, 500, 'DELETE_OBJECTS_FAILED', 'Failed to delete')
  }
}

export async function PUT(request: NextRequest) {
  const context = createRequestContext(request, '/api/cos/objects', 'rename-object')

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
    const parsedBody = renameObjectSchema.safeParse(await request.json())

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

    await renameObjectService(
      parsedBody.data.bucket,
      parsedBody.data.oldKey,
      parsedBody.data.newKey
    )
    logApiResult({
      requestId: context.requestId,
      route: context.route,
      action: context.action,
      duration: getDurationMs(context),
      result: 'success',
    })
    return successResponse(context, { success: true })
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
    return errorResponse(context, 500, 'RENAME_OBJECT_FAILED', 'Failed to rename')
  }
}

export async function POST(request: NextRequest) {
  const context = createRequestContext(request, '/api/cos/objects', 'create-folder')

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
    const parsedBody = createFolderSchema.safeParse(await request.json())

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

    await createFolderService(parsedBody.data.bucket, parsedBody.data.path)
    logApiResult({
      requestId: context.requestId,
      route: context.route,
      action: context.action,
      duration: getDurationMs(context),
      result: 'success',
    })
    return successResponse(context, { success: true })
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
    return errorResponse(context, 500, 'CREATE_FOLDER_FAILED', 'Failed to create folder')
  }
}
