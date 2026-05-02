import { adminDb } from "@/lib/firebase-admin"
import type { OrderStatus } from "@/lib/types/domain"

const ELIGIBLE_ORDER_STATUSES: OrderStatus[] = [
  "pending",
  "paid",
  "processing",
  "shipped",
  "delivered",
]

/**
 * Проверяет, что у пользователя есть заказ (не отменён / не возврат) с этим товаром.
 */
export async function userHasPurchasedProduct(
  uid: string,
  productId: string,
): Promise<boolean> {
  const ordersSnap = await adminDb
    .collection("orders")
    .where("userId", "==", uid)
    .orderBy("createdAt", "desc")
    .limit(100)
    .get()

  for (const orderDoc of ordersSnap.docs) {
    const st = orderDoc.data().status
    if (typeof st !== "string" || !ELIGIBLE_ORDER_STATUSES.includes(st as OrderStatus)) {
      continue
    }
    const itemsSnap = await orderDoc.ref
      .collection("items")
      .where("productId", "==", productId)
      .limit(1)
      .get()
    if (!itemsSnap.empty) return true
  }
  return false
}

export async function userHasReviewForProduct(
  uid: string,
  productId: string,
): Promise<boolean> {
  const snap = await adminDb
    .collection("productReviews")
    .where("productId", "==", productId)
    .where("userId", "==", uid)
    .limit(1)
    .get()
  return !snap.empty
}
