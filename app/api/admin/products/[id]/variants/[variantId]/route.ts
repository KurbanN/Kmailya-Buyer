import { FieldValue } from "firebase-admin/firestore"
import { type NextRequest } from "next/server"

import { adminDb } from "@/lib/firebase-admin"
import { handleApiError, ok } from "@/lib/server/api/responses"
import { requireAdminAccess } from "@/lib/server/auth/admin-route"
import { variantUpdateSchema } from "@/lib/validators/inventory"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; variantId: string }> },
) {
  try {
    const ctx = await requireAdminAccess(request, "inventory", "update")
    const { id, variantId } = await params
    const body = variantUpdateSchema.parse(await request.json())
    const patch = { ...body, updatedAt: FieldValue.serverTimestamp(), updatedBy: ctx.uid }
    await adminDb.collection("products").doc(id).collection("variants").doc(variantId).set(patch, { merge: true })
    await adminDb.collection("productVariants").doc(variantId).set(patch, { merge: true })
    return ok({ ok: true })
  } catch (err) {
    return handleApiError(err)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; variantId: string }> },
) {
  try {
    await requireAdminAccess(request, "inventory", "delete")
    const { id, variantId } = await params
    await adminDb.collection("products").doc(id).collection("variants").doc(variantId).delete()
    await adminDb.collection("productVariants").doc(variantId).delete()
    return ok({ ok: true })
  } catch (err) {
    return handleApiError(err)
  }
}
