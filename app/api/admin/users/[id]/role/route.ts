import { FieldValue } from "firebase-admin/firestore"
import { type NextRequest } from "next/server"

import { adminAuth, adminDb } from "@/lib/firebase-admin"
import { ApiError } from "@/lib/server/api/errors"
import { handleApiError, ok } from "@/lib/server/api/responses"
import { requireAdminAccess } from "@/lib/server/auth/admin-route"
import { userRoleSchema } from "@/lib/validators/domain"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const ctx = await requireAdminAccess(request, "users", "update")
    const { id } = await params
    const body = (await request.json()) as { role?: string }
    const role = userRoleSchema.parse(body.role)

    if (ctx.uid === id && role !== "admin") {
      throw new ApiError(409, "You cannot self-demote from admin")
    }
    if (role !== "admin") {
      const adminCount = await adminDb
        .collection("users")
        .where("role", "in", ["admin", "ADMIN"])
        .limit(2)
        .get()
      if (adminCount.size <= 1) {
        throw new ApiError(409, "Cannot remove last admin")
      }
    }

    await adminDb.collection("users").doc(id).set(
      {
        role,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    )
    await adminAuth.setCustomUserClaims(id, {
      role,
      admin: role === "admin",
      manager: role === "manager",
    })
    return ok({ ok: true })
  } catch (err) {
    return handleApiError(err)
  }
}
