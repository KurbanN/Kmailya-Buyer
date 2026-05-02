import { FieldValue } from "firebase-admin/firestore"
import { type NextRequest } from "next/server"

import { adminDb } from "@/lib/firebase-admin"
import { ApiError } from "@/lib/server/api/errors"
import { handleApiError, ok } from "@/lib/server/api/responses"
import { requireAdminAccess } from "@/lib/server/auth/admin-route"
import { categoryUpdateSchema, idParamSchema } from "@/lib/validators/admin-entities"

const COLLECTION = "categories"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const ctx = await requireAdminAccess(request, "categories", "update")
    const { id } = idParamSchema.parse(await params)
    const body = categoryUpdateSchema.parse(await request.json())

    await adminDb.collection(COLLECTION).doc(id).set(
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdminAccess(request, "categories", "delete")
    const { id } = idParamSchema.parse(await params)

    const products = await adminDb
      .collection("products")
      .where("categoryId", "==", id)
      .limit(1)
      .get()

    if (!products.empty) {
      throw new ApiError(409, "Category is used by products")
    }
    await adminDb.collection(COLLECTION).doc(id).delete()
    return ok({ ok: true })
  } catch (err) {
    return handleApiError(err)
  }
}
