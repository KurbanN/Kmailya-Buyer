import type { NextRequest } from "next/server"

import {
  type PolicyAction,
  type PolicyResource,
  requirePolicy,
} from "@/lib/server/auth/policy"
import { writeAuditLog } from "@/lib/server/audit-log"
import { enforceRateLimit } from "@/lib/server/security/rate-limit"
import { verifyFirebaseToken } from "@/lib/server/auth/verify"

export async function requireAdminAccess(
  request: NextRequest,
  resource: PolicyResource,
  action: PolicyAction,
) {
  enforceRateLimit(request)
  const ctx = await verifyFirebaseToken(request)
  enforceRateLimit(request, ctx.uid)
  requirePolicy(ctx.role, resource, action)
  if (action !== "read") {
    await writeAuditLog({
      actorUid: ctx.uid,
      resource,
      action,
      meta: { path: request.nextUrl.pathname },
    })
  }
  return ctx
}
