import { FieldValue } from "firebase-admin/firestore"

import { adminDb } from "@/lib/firebase-admin"

const COLLECTION = "productReviews"
const PRODUCTS = "products"

export async function recomputeProductReviewStats(productId: string): Promise<{
  reviewCount: number
  averageRating: number | null
}> {
  const snap = await adminDb
    .collection(COLLECTION)
    .where("productId", "==", productId)
    .get()

  const productRef = adminDb.collection(PRODUCTS).doc(productId)
  const productExists = (await productRef.get()).exists

  if (snap.empty) {
    if (productExists) {
      await productRef.set(
        {
          reviewCount: 0,
          averageRating: null,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      )
    }
    return { reviewCount: 0, averageRating: null }
  }

  let sum = 0
  let n = 0
  snap.forEach((d) => {
    const r = d.data()?.rating
    if (typeof r === "number" && r >= 1 && r <= 5) {
      sum += r
      n += 1
    }
  })

  const averageRating = n === 0 ? null : Math.round((sum / n) * 10) / 10
  const reviewCount = n

  if (productExists) {
    await productRef.set(
      {
        reviewCount,
        averageRating,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    )
  }

  return { reviewCount, averageRating }
}
