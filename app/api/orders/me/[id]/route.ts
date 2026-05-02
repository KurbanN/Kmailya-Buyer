import { type NextRequest } from "next/server"

import { adminDb } from "@/lib/firebase-admin"
import { toIsoString } from "@/lib/server/orders/firestore-timestamp"
import { handleApiError, ok } from "@/lib/server/api/responses"
import { ApiError } from "@/lib/server/api/errors"
import { verifyFirebaseToken } from "@/lib/server/auth/verify"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const ctx = await verifyFirebaseToken(request)
    const { id } = await params
    if (!id?.trim()) throw new ApiError(400, "Некорректный номер заказа")

    const ref = adminDb.collection("orders").doc(id.trim())
    const snap = await ref.get()
    if (!snap.exists) throw new ApiError(404, "Заказ не найден")

    const d = snap.data() ?? {}
    if (d.userId !== ctx.uid) throw new ApiError(403, "Нет доступа к заказу")

    const [itemsSnap, historySnap] = await Promise.all([
      ref.collection("items").get(),
      ref.collection("statusHistory").get(),
    ])

    const items = itemsSnap.docs.map((doc) => {
      const x = doc.data()
      return {
        id: doc.id,
        productId: typeof x.productId === "string" ? x.productId : "",
        quantity: typeof x.quantity === "number" ? x.quantity : 0,
        size: typeof x.size === "string" ? x.size : "",
        colorHex: typeof x.colorHex === "string" ? x.colorHex : "",
        unitPrice: typeof x.unitPrice === "number" ? x.unitPrice : 0,
        title: typeof x.title === "string" ? x.title : "",
      }
    })

    const statusHistory = historySnap.docs
      .map((doc) => {
        const x = doc.data()
        return {
          id: doc.id,
          status: typeof x.status === "string" ? x.status : "",
          note: typeof x.note === "string" ? x.note : "",
          actorUid: typeof x.actorUid === "string" ? x.actorUid : "",
          createdAt: toIsoString(x.createdAt),
        }
      })
      .sort((a, b) => {
        const ta = a.createdAt ? Date.parse(a.createdAt) : 0
        const tb = b.createdAt ? Date.parse(b.createdAt) : 0
        return ta - tb
      })

    const shippingAddress =
      d.shippingAddress && typeof d.shippingAddress === "object"
        ? {
            address:
              typeof (d.shippingAddress as { address?: string }).address === "string"
                ? (d.shippingAddress as { address: string }).address
                : "",
            city:
              typeof (d.shippingAddress as { city?: string }).city === "string"
                ? (d.shippingAddress as { city: string }).city
                : "",
            stateRegion:
              typeof (d.shippingAddress as { stateRegion?: string }).stateRegion === "string"
                ? (d.shippingAddress as { stateRegion: string }).stateRegion
                : "",
            country:
              typeof (d.shippingAddress as { country?: string }).country === "string"
                ? (d.shippingAddress as { country: string }).country
                : "",
            zip:
              typeof (d.shippingAddress as { zip?: string }).zip === "string"
                ? (d.shippingAddress as { zip: string }).zip
                : "",
          }
        : null

    return ok({
      id: snap.id,
      email: typeof d.email === "string" ? d.email : "",
      firstName: typeof d.firstName === "string" ? d.firstName : "",
      lastName: typeof d.lastName === "string" ? d.lastName : "",
      phone: typeof d.phone === "string" ? d.phone : "",
      shippingAddress,
      shippingMethod: typeof d.shippingMethod === "string" ? d.shippingMethod : "",
      paymentMethod: typeof d.paymentMethod === "string" ? d.paymentMethod : "",
      status: typeof d.status === "string" ? d.status : "pending",
      subtotal: typeof d.subtotal === "number" ? d.subtotal : 0,
      discountKzt: typeof d.discountKzt === "number" ? d.discountKzt : 0,
      promoCode: typeof d.promoCode === "string" ? d.promoCode : null,
      taxKzt: typeof d.taxKzt === "number" ? d.taxKzt : 0,
      shippingFee: typeof d.shippingFee === "number" ? d.shippingFee : 0,
      total: typeof d.total === "number" ? d.total : 0,
      trackingNumber:
        typeof d.trackingNumber === "string" && d.trackingNumber.trim()
          ? d.trackingNumber.trim()
          : null,
      trackingCarrier:
        typeof d.trackingCarrier === "string" && d.trackingCarrier.trim()
          ? d.trackingCarrier.trim()
          : null,
      createdAt: toIsoString(d.createdAt),
      updatedAt: toIsoString(d.updatedAt),
      items,
      statusHistory,
    })
  } catch (err) {
    return handleApiError(err)
  }
}
