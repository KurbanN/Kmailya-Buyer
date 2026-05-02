import { FieldValue } from "firebase-admin/firestore"
import { type NextRequest } from "next/server"

import { adminDb } from "@/lib/firebase-admin"
import { recomputeProductReviewStats } from "@/lib/server/product-review-stats"
import { getProductByIdRepo } from "@/lib/product-repository"
import { handleApiError, ok } from "@/lib/server/api/responses"
import { verifyFirebaseTokenOptional } from "@/lib/server/auth/verify"
import { ApiError } from "@/lib/server/api/errors"
import {
  userHasPurchasedProduct,
  userHasReviewForProduct,
} from "@/lib/server/reviews/verified-purchase"
import { reviewCreateSchema } from "@/lib/validators/reviews"

const COLLECTION = "productReviews"

function toIso(t: unknown): string | null {
  if (t == null) return null
  if (typeof t === "object" && t !== null && "toDate" in t && typeof (t as { toDate: () => Date }).toDate === "function") {
    const d = (t as { toDate: () => Date }).toDate()
    return Number.isNaN(d.getTime()) ? null : d.toISOString()
  }
  if (typeof t === "object" && t !== null && "seconds" in t) {
    const s = (t as { seconds: number }).seconds
    if (typeof s === "number") return new Date(s * 1000).toISOString()
  }
  return null
}

export async function GET(request: NextRequest) {
  try {
    const productId = request.nextUrl.searchParams.get("productId")?.trim()
    if (!productId) {
      return ok({ error: "productId required" }, 400)
    }

    const snap = await adminDb
      .collection(COLLECTION)
      .where("productId", "==", productId)
      .get()

    const items = snap.docs
      .map((d) => {
        const x = d.data()
        const uid = x.userId
        return {
          id: d.id,
          authorName: typeof x.authorName === "string" ? x.authorName : "Покупатель",
          rating: typeof x.rating === "number" ? x.rating : 0,
          text: typeof x.text === "string" ? x.text : "",
          createdAt: toIso(x.createdAt),
          verifiedPurchase:
            typeof uid === "string" && uid.length > 0 ? true : false,
        }
      })
      .sort((a, b) => {
        const ta = a.createdAt ? Date.parse(a.createdAt) : 0
        const tb = b.createdAt ? Date.parse(b.createdAt) : 0
        return tb - ta
      })

    const reviewCount = items.length
    let averageRating: number | null = null
    if (items.length > 0) {
      const sum = items.reduce((s, x) => s + (x.rating >= 1 && x.rating <= 5 ? x.rating : 0), 0)
      const n = items.filter((x) => x.rating >= 1 && x.rating <= 5).length
      if (n > 0) averageRating = Math.round((sum / n) * 10) / 10
    } else {
      const prod = await adminDb.collection("products").doc(productId).get()
      const ar = prod.data()?.averageRating
      if (typeof ar === "number" && ar >= 1 && ar <= 5) averageRating = ar
    }

    const viewerCtx = await verifyFirebaseTokenOptional(request)
    let viewer: {
      hasReviewed: boolean
      canReview: boolean
    } | null = null
    if (viewerCtx) {
      const hasReviewed = await userHasReviewForProduct(viewerCtx.uid, productId)
      const purchased = await userHasPurchasedProduct(viewerCtx.uid, productId)
      viewer = {
        hasReviewed,
        canReview: purchased && !hasReviewed,
      }
    }

    return ok({
      items,
      reviewCount,
      averageRating,
      viewer,
    })
  } catch (err) {
    return handleApiError(err)
  }
}

export async function POST(request: NextRequest) {
  try {
    const ctx = await verifyFirebaseTokenOptional(request)
    if (!ctx) {
      throw new ApiError(401, "Войдите, чтобы оставить отзыв")
    }
    const body = reviewCreateSchema.parse(await request.json())
    const product = await getProductByIdRepo(body.productId)
    if (!product) {
      return ok({ error: "Товар не найден" }, 404)
    }

    const hasReview = await userHasReviewForProduct(ctx.uid, body.productId)
    if (hasReview) {
      throw new ApiError(409, "Вы уже оставили отзыв об этом товаре")
    }

    const purchased = await userHasPurchasedProduct(ctx.uid, body.productId)
    if (!purchased) {
      throw new ApiError(
        403,
        "Отзыв можно оставить только после оформления заказа с этим товаром",
      )
    }

    await adminDb.collection(COLLECTION).add({
      productId: body.productId,
      userId: ctx.uid,
      authorName: body.authorName,
      rating: body.rating,
      text: body.text,
      createdAt: FieldValue.serverTimestamp(),
    })

    const stats = await recomputeProductReviewStats(body.productId)

    return ok({
      ok: true,
      reviewCount: stats.reviewCount,
      averageRating: stats.averageRating,
    })
  } catch (err) {
    return handleApiError(err)
  }
}
