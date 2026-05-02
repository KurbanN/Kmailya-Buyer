import { FieldValue } from "firebase-admin/firestore"
import { type NextRequest } from "next/server"

import { adminDb } from "@/lib/firebase-admin"
import { CHECKOUT_TAX_RATE, checkoutShippingFeeKzt } from "@/lib/checkout-constants"
import { getFreeShippingThresholdKzt } from "@/lib/site-config"
import { handleApiError, ok } from "@/lib/server/api/responses"
import { ApiError } from "@/lib/server/api/errors"
import { verifyFirebaseToken } from "@/lib/server/auth/verify"
import { validatePromoForMerchandiseKzt } from "@/lib/server/promo/apply-promo-kzt"
import { sendOrderPlacedEmail } from "@/lib/server/email/transactional"
import { createOrderSchema } from "@/lib/validators/orders"

function nearEqual(a: number, b: number, eps: number) {
  return Math.abs(a - b) <= eps
}

export async function POST(request: NextRequest) {
  try {
    const body = createOrderSchema.parse(await request.json())
    const userCtx = await verifyFirebaseToken(request).catch(() => null)

    const promoCodeArg =
      typeof body.promoCode === "string" && body.promoCode.trim().length >= 3
        ? body.promoCode.trim().toUpperCase()
        : undefined

    const merchandiseTotal = body.items.reduce(
      (s, it) => s + it.unitPrice * it.quantity,
      0,
    )
    if (!nearEqual(merchandiseTotal, body.subtotal, 1.5)) {
      throw new ApiError(400, "Сумма товаров не совпадает с позициями заказа")
    }

    const promo = await validatePromoForMerchandiseKzt(promoCodeArg, Math.round(merchandiseTotal))
    if (!promo.ok) {
      throw new ApiError(400, promo.error)
    }

    const discountKzt = promo.discountKzt
    const taxableBase = Math.max(0, Math.round(merchandiseTotal) - discountKzt)
    const threshold = getFreeShippingThresholdKzt()
    const shipExpected =
      threshold > 0 && taxableBase >= threshold ? 0 : checkoutShippingFeeKzt(body.shippingMethod)
    if (!nearEqual(body.shippingFee, shipExpected, 0.5)) {
      throw new ApiError(400, "Некорректная стоимость доставки")
    }
    const taxKzt = Math.round(taxableBase * CHECKOUT_TAX_RATE * 100) / 100
    const totalExpected = taxableBase + body.shippingFee + taxKzt
    if (!nearEqual(body.total, totalExpected, 2.5)) {
      throw new ApiError(400, "Некорректная итоговая сумма. Обновите страницу оформления.")
    }

    const orderRef = adminDb.collection("orders").doc()

    await adminDb.runTransaction(async (t) => {
      if (promo.code) {
        const pref = adminDb.collection("promocodes").doc(promo.code)
        const ps = await t.get(pref)
        if (!ps.exists) throw new ApiError(400, "Промокод не найден")
        const d = ps.data() ?? {}
        const used = typeof d.usedCount === "number" ? d.usedCount : 0
        const maxU = typeof d.maxUses === "number" ? d.maxUses : 1
        if (used >= maxU) throw new ApiError(400, "Лимит активаций промокода исчерпан")
        t.update(pref, {
          usedCount: FieldValue.increment(1),
          updatedAt: FieldValue.serverTimestamp(),
        })
      }

      t.set(orderRef, {
        email: body.email,
        userId: userCtx?.uid ?? null,
        firstName: body.firstName,
        lastName: body.lastName,
        phone: body.phone,
        shippingAddress: {
          address: body.address,
          city: body.city,
          stateRegion: body.stateRegion,
          country: body.country,
          zip: body.zip,
        },
        shippingMethod: body.shippingMethod,
        paymentMethod: body.paymentMethod,
        subtotal: merchandiseTotal,
        discountKzt,
        promoCode: promo.code || null,
        taxKzt,
        shippingFee: body.shippingFee,
        total: totalExpected,
        status: "pending",
        trackingNumber: null,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      })

      body.items.forEach((item) => {
        const itemRef = orderRef.collection("items").doc()
        t.set(itemRef, item)
      })

      t.set(orderRef.collection("statusHistory").doc(), {
        status: "pending",
        note: "Order created",
        createdAt: FieldValue.serverTimestamp(),
        actorUid: userCtx?.uid ?? "system",
      })
    })

    for (const item of body.items) {
      const variantSnap = await adminDb
        .collection("productVariants")
        .where("productId", "==", item.productId)
        .where("size", "==", item.size)
        .where("colorHex", "==", item.colorHex)
        .limit(1)
        .get()
      if (!variantSnap.empty) {
        const doc = variantSnap.docs[0]
        const beforeQty = typeof doc.data().stockQty === "number" ? doc.data().stockQty : 0
        const afterQty = Math.max(0, beforeQty - item.quantity)
        await doc.ref.set(
          { stockQty: afterQty, updatedAt: FieldValue.serverTimestamp() },
          { merge: true },
        )
        await adminDb.collection("inventoryLogs").add({
          variantId: doc.id,
          delta: -item.quantity,
          beforeQty,
          afterQty,
          reason: `order:${orderRef.id}`,
          actorUid: userCtx?.uid ?? "system",
          createdAt: FieldValue.serverTimestamp(),
        })
      }
    }

    void sendOrderPlacedEmail({
      to: body.email,
      orderId: orderRef.id,
      totalKzt: Math.round(totalExpected),
      firstName: body.firstName,
    }).catch((err) => {
      console.error("[email] order placed failed", orderRef.id, err)
    })

    return ok({ id: orderRef.id }, 201)
  } catch (err) {
    return handleApiError(err)
  }
}
