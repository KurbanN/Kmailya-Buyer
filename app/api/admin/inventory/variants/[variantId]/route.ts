import { FieldValue } from "firebase-admin/firestore"
import { type NextRequest } from "next/server"

import { adminDb } from "@/lib/firebase-admin"
import { handleApiError, ok } from "@/lib/server/api/responses"
import { requireAdminAccess } from "@/lib/server/auth/admin-route"
import { inventoryAdjustSchema } from "@/lib/validators/inventory"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ variantId: string }> },
) {
  try {
    const ctx = await requireAdminAccess(request, "inventory", "update")
    const { variantId } = await params
    const body = inventoryAdjustSchema.parse(await request.json())
    const variantRef = adminDb.collection("productVariants").doc(variantId)
    const variantSnap = await variantRef.get()
    const data = variantSnap.data()
    const beforeQty = typeof data?.stockQty === "number" ? data.stockQty : 0
    const afterQty = Math.max(0, beforeQty + body.delta)

    await variantRef.set(
      { stockQty: afterQty, updatedAt: FieldValue.serverTimestamp(), updatedBy: ctx.uid },
      { merge: true },
    )

    await adminDb.collection("inventoryLogs").add({
      variantId,
      delta: body.delta,
      beforeQty,
      afterQty,
      reason: body.reason,
      actorUid: ctx.uid,
      createdAt: FieldValue.serverTimestamp(),
    })

    return ok({ ok: true, beforeQty, afterQty })
  } catch (err) {
    return handleApiError(err)
  }
}
