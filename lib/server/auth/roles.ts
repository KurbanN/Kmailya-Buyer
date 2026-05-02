import type { DecodedIdToken } from "firebase-admin/auth"

import type { UserRole } from "@/lib/types/domain"
import { ApiError } from "@/lib/server/api/errors"

export type AuthContext = {
  uid: string
  email?: string
  role: UserRole
  token: DecodedIdToken
}

function tokenRole(token: DecodedIdToken): UserRole {
  if (token.role === "admin" || token.admin === true) return "admin"
  if (token.role === "manager" || token.manager === true) return "manager"
  return "customer"
}

export function buildAuthContext(token: DecodedIdToken): AuthContext {
  return {
    uid: token.uid,
    email: token.email,
    role: tokenRole(token),
    token,
  }
}

export function requireRole(
  ctx: AuthContext,
  allowed: UserRole[],
) {
  if (!allowed.includes(ctx.role)) {
    throw new ApiError(403, "Insufficient permissions", {
      required: allowed,
      actual: ctx.role,
    })
  }
}
