import type { NextRequest } from "next/server"

import { adminAuth } from "@/lib/firebase-admin"
import { buildAuthContext, type AuthContext } from "@/lib/server/auth/roles"
import { extractBearerToken } from "@/lib/server/auth/token"
import { ApiError } from "@/lib/server/api/errors"

/** Bearer-токен без исключения — для опциональной авторизации на GET. */
export function tryGetBearerToken(request: NextRequest): string | null {
  const header = request.headers.get("authorization") ?? ""
  const [scheme, token] = header.split(/\s+/).filter(Boolean)
  if (scheme?.toLowerCase() !== "bearer" || !token) return null
  return token
}

export async function verifyFirebaseTokenOptional(
  request: NextRequest,
): Promise<AuthContext | null> {
  const token = tryGetBearerToken(request)
  if (!token) return null
  try {
    const decoded = await adminAuth.verifyIdToken(token, true)
    return buildAuthContext(decoded)
  } catch {
    return null
  }
}

export async function verifyFirebaseToken(
  request: NextRequest,
): Promise<AuthContext> {
  const token = extractBearerToken(request)
  try {
    const decoded = await adminAuth.verifyIdToken(token, true)
    return buildAuthContext(decoded)
  } catch (err) {
    throw new ApiError(401, "Invalid auth token", err)
  }
}
