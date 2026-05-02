import { FieldValue } from "firebase-admin/firestore"
import { randomUUID } from "crypto"
import { type NextRequest } from "next/server"

import { adminDb } from "@/lib/firebase-admin"
import { handleApiError, ok } from "@/lib/server/api/responses"
import { requireAdminAccess } from "@/lib/server/auth/admin-route"
import { idParamSchema } from "@/lib/validators/admin-entities"
import { variantCreateSchema } from "@/lib/validators/inventory"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const ctx = await requireAdminAccess(request, "inventory", "update")
    const { id } = idParamSchema.parse(await params)
    const body = variantCreateSchema.parse(await request.json())
    const variantId = randomUUID()

    const data = {
      ...body,
      productId: id,
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: ctx.uid,
    }
    await adminDb.collection("products").doc(id).collection("variants").doc(variantId).set(data)
    await adminDb.collection("productVariants").doc(variantId).set(data)
    return ok({ id: variantId }, 201)
  } catch (err) {
    return handleApiError(err)
  }
}
