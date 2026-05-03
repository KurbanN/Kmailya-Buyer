import type { DocumentReference } from "firebase-admin/firestore"

import { adminDb } from "@/lib/firebase-admin"
import { ApiError } from "@/lib/server/api/errors"

export type CheckoutLineRef = {
  productId: string
  quantity: number
  size: string
  colorHex: string
  variantRef: DocumentReference
}

/**
 * До транзакции: находим документ варианта на складе (без проверки цены — она в транзакции).
 */
export async function resolveCheckoutVariantRefs(
  items: { productId: string; quantity: number; size: string; colorHex: string }[],
): Promise<CheckoutLineRef[]> {
  const out: CheckoutLineRef[] = []
  for (const item of items) {
    const variantSnap = await adminDb
      .collection("productVariants")
      .where("productId", "==", item.productId)
      .where("size", "==", item.size)
      .where("colorHex", "==", item.colorHex)
      .limit(1)
      .get()

    if (variantSnap.empty) {
      throw new ApiError(
        400,
        `Нет складской позиции для товара (размер ${item.size}). Обновите корзину и выберите доступный вариант.`,
      )
    }

    out.push({
      productId: item.productId,
      quantity: item.quantity,
      size: item.size,
      colorHex: item.colorHex,
      variantRef: variantSnap.docs[0].ref,
    })
  }
  return out
}
