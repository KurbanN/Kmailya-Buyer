import { randomUUID } from "crypto"

import { getStorage } from "firebase-admin/storage"

import { adminDb } from "@/lib/firebase-admin"
import { ApiError } from "@/lib/server/api/errors"

const MAX_BYTES = 5 * 1024 * 1024
const ALLOWED_MIME = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"])

export async function uploadProductImage(opts: {
  productId: string
  file: File
  actorUid: string
}) {
  const { productId, file, actorUid } = opts
  if (!ALLOWED_MIME.has(file.type)) {
    throw new ApiError(400, "Invalid image mime type")
  }
  if (file.size > MAX_BYTES) {
    throw new ApiError(400, "Image size exceeds 5MB")
  }

  const bytes = Buffer.from(await file.arrayBuffer())
  const imageId = randomUUID()
  const ext = file.type.includes("png")
    ? "png"
    : file.type.includes("webp")
      ? "webp"
      : "jpg"
  const objectPath = `products/${productId}/${imageId}.${ext}`
  const bucket = getStorage().bucket()
  const bucketFile = bucket.file(objectPath)

  await bucketFile.save(bytes, {
    contentType: file.type,
    public: true,
    metadata: {
      metadata: { imageId, productId, uploadedBy: actorUid },
    },
  })

  const publicUrl = `https://storage.googleapis.com/${bucket.name}/${objectPath}`
  return { imageId, objectPath, publicUrl }
}

export async function syncProductImages(productId: string) {
  const imagesSnap = await adminDb
    .collection("products")
    .doc(productId)
    .collection("images")
    .orderBy("position", "asc")
    .get()
  const imageDocs = imagesSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
  const imageUrls = imageDocs
    .map((img) => img.url)
    .filter((v): v is string => typeof v === "string")
  const cover = imageDocs.find((img) => img.isCover)
  await adminDb.collection("products").doc(productId).set(
    {
      imageUrls,
      coverImageUrl: cover?.url ?? imageUrls[0] ?? null,
    },
    { merge: true },
  )
}
