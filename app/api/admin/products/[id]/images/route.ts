import { FieldValue } from "firebase-admin/firestore"
import { type NextRequest } from "next/server"

import { adminDb } from "@/lib/firebase-admin"
import { handleApiError, ok } from "@/lib/server/api/responses"
import { requireAdminAccess } from "@/lib/server/auth/admin-route"
import {
  syncProductImages,
  uploadProductImage,
} from "@/lib/server/storage/product-images"
import { idParamSchema } from "@/lib/validators/admin-entities"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const ctx = await requireAdminAccess(request, "products", "update")
    const { id } = idParamSchema.parse(await params)
    const formData = await request.formData()
    const file = formData.get("file")

    if (!(file instanceof File)) {
      return ok({ error: "file is required" }, 400)
    }

    const uploaded = await uploadProductImage({
      productId: id,
      file,
      actorUid: ctx.uid,
    })

    const imageRef = adminDb.collection("products").doc(id).collection("images").doc(uploaded.imageId)
    const count = await adminDb.collection("products").doc(id).collection("images").count().get()
    const position = count.data().count ?? 0

    await imageRef.set({
      url: uploaded.publicUrl,
      objectPath: uploaded.objectPath,
      position,
      isCover: position === 0,
      createdAt: FieldValue.serverTimestamp(),
      createdBy: ctx.uid,
    })
    await syncProductImages(id)

    return ok({ imageId: uploaded.imageId, url: uploaded.publicUrl }, 201)
  } catch (err) {
    return handleApiError(err)
  }
}
