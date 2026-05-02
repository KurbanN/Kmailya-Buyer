import { FieldValue } from "firebase-admin/firestore"
import { type NextRequest } from "next/server"

import { adminAuth, adminDb } from "@/lib/firebase-admin"
import { ApiError } from "@/lib/server/api/errors"
import { handleApiError, ok } from "@/lib/server/api/responses"
import { requireAdminAccess } from "@/lib/server/auth/admin-route"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const ctx = await requireAdminAccess(request, "users", "update")
    const { id } = await params
    const body = (await request.json()) as { blocked?: boolean }
    const blocked = body.blocked === true
    if (id === ctx.uid && blocked) {
      throw new ApiError(409, "You cannot block yourself")
    }
    await adminDb.collection("users").doc(id).set(
      { blocked, updatedAt: FieldValue.serverTimestamp() },
      { merge: true },
    )
    await adminAuth.updateUser(id, { disabled: blocked })
    return ok({ ok: true })
  } catch (err) {
    return handleApiError(err)
  }
}
