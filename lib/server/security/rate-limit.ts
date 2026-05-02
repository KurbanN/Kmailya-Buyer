import type { NextRequest } from "next/server"

import { ApiError } from "@/lib/server/api/errors"

type Bucket = { count: number; resetAt: number }

const WINDOW_MS = 60_000
const MAX_PER_WINDOW = 120
const memory = new Map<string, Bucket>()

function keyFromRequest(request: NextRequest, uid?: string) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown"
  return `${uid ?? "anon"}:${ip}`
}

export function enforceRateLimit(request: NextRequest, uid?: string) {
  const now = Date.now()
  const key = keyFromRequest(request, uid)
  const bucket = memory.get(key)

  if (!bucket || bucket.resetAt <= now) {
    memory.set(key, { count: 1, resetAt: now + WINDOW_MS })
    return
  }
  if (bucket.count >= MAX_PER_WINDOW) {
    throw new ApiError(429, "Rate limit exceeded")
  }
  bucket.count += 1
  memory.set(key, bucket)
}
