import { type NextRequest } from "next/server"

import { adminDb } from "@/lib/firebase-admin"
import { handleApiError, ok } from "@/lib/server/api/responses"
import { requireAdminAccess } from "@/lib/server/auth/admin-route"
import { syncProductImages } from "@/lib/server/storage/product-images"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; imageId: string }> },
) {
  try {
    await requireAdminAccess(request, "products", "update")
    const { id, imageId } = await params
    const snap = await adminDb.collection("products").doc(id).collection("images").get()

    const batch = adminDb.batch()
    snap.docs.forEach((doc) => {
      batch.set(doc.ref, { isCover: doc.id === imageId }, { merge: true })
    })
    await batch.commit()
    await syncProductImages(id)
    return ok({ ok: true })
  } catch (err) {
    return handleApiError(err)
  }
}
