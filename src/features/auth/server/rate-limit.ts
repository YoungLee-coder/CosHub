type RateLimitEntry = {
  count: number
  windowStart: number
}

const rateLimitStore = new Map<string, RateLimitEntry>()

const DEFAULT_WINDOW_MS = 60 * 1000
const DEFAULT_LIMIT = 5

export interface RateLimitResult {
  allowed: boolean
  retryAfterSeconds: number
}

function getEntry(key: string, windowMs: number): RateLimitEntry | null {
  const now = Date.now()
  const current = rateLimitStore.get(key)
  if (!current) return null

  if (now - current.windowStart >= windowMs) {
    rateLimitStore.delete(key)
    return null
  }

  return current
}

export function checkRateLimit(
  key: string,
  limit: number = DEFAULT_LIMIT,
  windowMs: number = DEFAULT_WINDOW_MS
): RateLimitResult {
  const current = getEntry(key, windowMs)
  if (!current) {
    return { allowed: true, retryAfterSeconds: 0 }
  }

  if (current.count >= limit) {
    const now = Date.now()
    const retryAfterMs = windowMs - (now - current.windowStart)
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil(retryAfterMs / 1000)),
    }
  }

  return { allowed: true, retryAfterSeconds: 0 }
}

export function recordRateLimitFailure(key: string, windowMs: number = DEFAULT_WINDOW_MS) {
  const now = Date.now()
  const current = getEntry(key, windowMs)

  if (!current) {
    rateLimitStore.set(key, { count: 1, windowStart: now })
    return
  }

  current.count += 1
  rateLimitStore.set(key, current)
}

export function resetRateLimit(key: string) {
  rateLimitStore.delete(key)
}
