import { mockAuthState, mockBuckets, mockFiles, mockInitStatus, mockSettings } from './data'
import type { BucketItem, CosFile, CosFolder } from '@/features/cos/types'

interface MockResponse<T = unknown> {
  success: boolean
  data: T | null
  error: string | null
}

function jsonResponse<T>(data: T, status = 200): Response {
  const body: MockResponse<T> = {
    success: true,
    data,
    error: null,
  }
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function errorResponse(message: string, status = 400): Response {
  const body: MockResponse<null> = {
    success: false,
    data: null,
    error: message,
  }
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

/* ── init ── */
function handleInit(): Response {
  return jsonResponse(mockInitStatus)
}

/* ── auth ── */
function handleAuthCheck(): Response {
  return jsonResponse({ authenticated: mockAuthState.isAuthenticated })
}

async function handleAuthLogin(request: Request): Promise<Response> {
  const body = (await request.json().catch(() => ({}))) as { password?: string }
  if (body.password === 'admin') {
    mockAuthState.isAuthenticated = true
    return jsonResponse({ success: true })
  }
  return errorResponse('密码错误', 401)
}

function handleAuthLogout(): Response {
  mockAuthState.isAuthenticated = false
  return jsonResponse({ success: true })
}

/* ── settings ── */
function handleGetSettings(): Response {
  return jsonResponse(mockSettings)
}

async function handleUpdateSettings(request: Request): Promise<Response> {
  const body = (await request.json().catch(() => ({}))) as Record<string, string>
  Object.assign(mockSettings, body)
  return jsonResponse({ success: true })
}

/* ── cos / buckets ── */
function handleGetBuckets(): Response {
  return jsonResponse<BucketItem[]>(mockBuckets)
}

/* ── cos / objects ── */
function handleGetObjects(url: URL): Response {
  const bucket = url.searchParams.get('bucket') || 'my-bucket-1'
  const prefix = url.searchParams.get('prefix') || ''
  const key = prefix || bucket

  const bucketData = mockFiles[key]
  if (!bucketData) {
    return jsonResponse<{ files: CosFile[]; folders: CosFolder[] }>({ files: [], folders: [] })
  }

  return jsonResponse<{ files: CosFile[]; folders: CosFolder[] }>(bucketData)
}

async function handleDeleteObjects(request: Request): Promise<Response> {
  const body = (await request.json().catch(() => ({}))) as { bucket?: string; keys?: string[] }
  const { keys = [] } = body

  for (const key of keys) {
    for (const [, data] of Object.entries(mockFiles)) {
      data.files = data.files.filter((f) => f.Key !== key)
    }
  }

  return jsonResponse({ success: true })
}

async function handleRenameObject(request: Request): Promise<Response> {
  const body = (await request.json().catch(() => ({}))) as { oldKey?: string; newKey?: string }
  const { oldKey, newKey } = body

  if (oldKey && newKey) {
    for (const [, data] of Object.entries(mockFiles)) {
      const file = data.files.find((f) => f.Key === oldKey)
      if (file) {
        file.Key = newKey
        file.LastModified = new Date().toISOString()
      }
    }
  }

  return jsonResponse({ success: true })
}

async function handleCreateFolder(request: Request): Promise<Response> {
  const body = (await request.json().catch(() => ({}))) as { bucket?: string; path?: string }
  const { bucket = 'my-bucket-1', path: folderPath } = body

  if (folderPath) {
    const key = folderPath.endsWith('/') ? folderPath : `${folderPath}/`
    const data = mockFiles[bucket] || { files: [], folders: [] }
    if (!data.folders.find((f) => f.Prefix === key)) {
      data.folders.push({ Prefix: key })
    }
  }

  return jsonResponse({ success: true })
}

/* ── cos / url ── */
function handleGetDownloadUrl(url: URL): Response {
  const key = url.searchParams.get('key') || 'unknown'
  return jsonResponse({ url: `https://cdn.example.com/${key}?download=1` })
}

function handleGetUploadUrl(url: URL): Response {
  const key = url.searchParams.get('key') || 'unknown'
  return jsonResponse({ url: `https://cdn.example.com/upload/${key}` })
}

async function handleGetCdnUrl(request: Request): Promise<Response> {
  const body = (await request.json().catch(() => ({}))) as { key?: string }
  const key = body.key || 'unknown'
  return jsonResponse({ url: `https://cdn.example.com/${key}` })
}

function handleGetCdnDomain(): Response {
  return jsonResponse({ domain: 'https://cdn.example.com' })
}

/* ── router ── */
export async function mockRequest(url: string, request: Request): Promise<Response | null> {
  const urlObj = new URL(url, window.location.origin)
  const pathname = urlObj.pathname
  const method = request.method.toUpperCase()

  try {
    switch (pathname) {
      /* init */
      case '/api/init':
        return handleInit()

      /* auth */
      case '/api/auth/check':
        return handleAuthCheck()
      case '/api/auth/login':
        if (method === 'POST') return handleAuthLogin(request)
        break
      case '/api/auth/logout':
        if (method === 'POST') return handleAuthLogout()
        break

      /* settings */
      case '/api/settings':
        if (method === 'PUT') return handleUpdateSettings(request)
        return handleGetSettings()

      /* cos */
      case '/api/cos/buckets':
        return handleGetBuckets()
      case '/api/cos/objects':
        if (method === 'DELETE') return handleDeleteObjects(request)
        if (method === 'PUT') return handleRenameObject(request)
        if (method === 'POST') return handleCreateFolder(request)
        return handleGetObjects(urlObj)
      case '/api/cos/url':
        if (method === 'POST') return handleGetCdnUrl(request)
        {
          const methodParam = urlObj.searchParams.get('method')
          if (methodParam === 'PUT') return handleGetUploadUrl(urlObj)
          return handleGetDownloadUrl(urlObj)
        }
      case '/api/cos/cdn-domain':
        return handleGetCdnDomain()
    }
  } catch (err) {
    return errorResponse(String(err), 500)
  }

  return null
}
