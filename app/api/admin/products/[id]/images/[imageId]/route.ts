import { getStorage } from "firebase-admin/storage"
import { type NextRequest } from "next/server"

import { adminDb } from "@/lib/firebase-admin"
import { handleApiError, ok } from "@/lib/server/api/responses"
import { requireAdminAccess } from "@/lib/server/auth/admin-route"
import { syncProductImages } from "@/lib/server/storage/product-images"

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; imageId: string }> },
) {
  try {
    await requireAdminAccess(request, "products", "update")
    const { id, imageId } = await params
    const ref = adminDb.collection("products").doc(id).collection("images").doc(imageId)
    const snap = await ref.get()
    if (snap.exists) {
      const data = snap.data()
      if (typeof data?.objectPath === "string") {
        await getStorage().bucket().file(data.objectPath).delete({ ignoreNotFound: true })
      }
      await ref.delete()
      await syncProductImages(id)
    }
    return ok({ ok: true })
  } catch (err) {
    return handleApiError(err)
  }
}
