import { FieldValue } from "firebase-admin/firestore"
import { type NextRequest } from "next/server"

import { adminDb } from "@/lib/firebase-admin"
import { handleApiError, ok } from "@/lib/server/api/responses"
import { requireAdminAccess } from "@/lib/server/auth/admin-route"
import { promoCodeUpdateSchema } from "@/lib/validators/promocodes"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  try {
    const ctx = await requireAdminAccess(request, "promocodes", "update")
    const { code } = await params
    const body = promoCodeUpdateSchema.parse(await request.json())
    await adminDb.collection("promocodes").doc(code.toUpperCase()).set(
      { ...body, updatedAt: FieldValue.serverTimestamp(), updatedBy: ctx.uid },
      { merge: true },
    )
    return ok({ ok: true })
  } catch (err) {
    return handleApiError(err)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  try {
    await requireAdminAccess(request, "promocodes", "delete")
    const { code } = await params
    await adminDb.collection("promocodes").doc(code.toUpperCase()).set({ isActive: false }, { merge: true })
    return ok({ ok: true })
  } catch (err) {
    return handleApiError(err)
  }
}
