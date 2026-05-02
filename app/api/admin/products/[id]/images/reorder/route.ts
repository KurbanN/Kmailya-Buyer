import { type NextRequest } from "next/server"

import { adminDb } from "@/lib/firebase-admin"
import { handleApiError, ok } from "@/lib/server/api/responses"
import { requireAdminAccess } from "@/lib/server/auth/admin-route"
import { syncProductImages } from "@/lib/server/storage/product-images"
import { idParamSchema } from "@/lib/validators/admin-entities"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdminAccess(request, "products", "update")
    const { id } = idParamSchema.parse(await params)
    const body = (await request.json()) as { imageIds?: string[] }
    const imageIds = Array.isArray(body.imageIds) ? body.imageIds : []

    const batch = adminDb.batch()
    imageIds.forEach((imageId, index) => {
      const ref = adminDb.collection("products").doc(id).collection("images").doc(imageId)
      batch.set(ref, { position: index }, { merge: true })
    })
    await batch.commit()
    await syncProductImages(id)
    return ok({ ok: true })
  } catch (err) {
    return handleApiError(err)
  }
}
