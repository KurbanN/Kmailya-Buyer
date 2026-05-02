import { FieldValue } from "firebase-admin/firestore"
import { type NextRequest } from "next/server"

import { adminDb } from "@/lib/firebase-admin"
import { handleApiError, ok } from "@/lib/server/api/responses"
import { requireAdminAccess } from "@/lib/server/auth/admin-route"
import { idParamSchema } from "@/lib/validators/admin-entities"
import { productStatusUpdateSchema } from "@/lib/validators/products"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const ctx = await requireAdminAccess(request, "products", "status-change")
    const { id } = idParamSchema.parse(await params)
    const body = productStatusUpdateSchema.parse(await request.json())

    await adminDb.collection("products").doc(id).set(
      {
        ...body,
        updatedAt: FieldValue.serverTimestamp(),
        updatedBy: ctx.uid,
      },
      { merge: true },
    )
    return ok({ ok: true })
  } catch (err) {
    return handleApiError(err)
  }
}
