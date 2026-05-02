import { type NextRequest } from "next/server"

import { handleApiError, ok } from "@/lib/server/api/responses"
import { verifyFirebaseToken } from "@/lib/server/auth/verify"

export async function GET(request: NextRequest) {
  try {
    const ctx = await verifyFirebaseToken(request)
    return ok({
      uid: ctx.uid,
      email: ctx.email ?? null,
      role: ctx.role,
    })
  } catch (err) {
    return handleApiError(err)
  }
}
