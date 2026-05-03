import { FieldValue } from "firebase-admin/firestore"
import { type NextRequest } from "next/server"

import { adminDb } from "@/lib/firebase-admin"
import { CHECKOUT_TAX_RATE, checkoutShippingFeeKzt } from "@/lib/checkout-constants"
import { usdToKzt } from "@/lib/currency"
import { getFreeShippingThresholdKzt } from "@/lib/site-config"
import {
  effectiveUsdFromProductData,
  isProductOrderable,
  titleFromProductData,
} from "@/lib/server/checkout/pricing"
import type { CheckoutLineRef } from "@/lib/server/checkout/resolve-checkout-lines"
import { resolveCheckoutVariantRefs } from "@/lib/server/checkout/resolve-checkout-lines"
import { handleApiError, ok } from "@/lib/server/api/responses"
import { ApiError } from "@/lib/server/api/errors"
import { verifyFirebaseToken } from "@/lib/server/auth/verify"
import { applyPromoFromDocData } from "@/lib/server/promo/apply-promo-kzt"
import { sendOrderPlacedEmail } from "@/lib/server/email/transactional"
import { createOrderSchema } from "@/lib/validators/orders"

function nearEqual(a: number, b: number, eps: number) {
  return Math.abs(a - b) <= eps
}

type ResolvedLine = {
  line: CheckoutLineRef
  unitPriceKzt: number
  title: string
  stockBefore: number
}

export async function POST(request: NextRequest) {
  try {
    const body = createOrderSchema.parse(await request.json())
    const userCtx = await verifyFirebaseToken(request).catch(() => null)

    const promoCodeArg =
      typeof body.promoCode === "string" && body.promoCode.trim().length >= 3
        ? body.promoCode.trim().toUpperCase()
        : undefined

    const lineRefs = await resolveCheckoutVariantRefs(body.items)

    const orderRef = adminDb.collection("orders").doc()

    let merchandiseTotal = 0
    let discountKzt = 0
    let promoCodeApplied: string | null = null
    let totalExpected = 0

    await adminDb.runTransaction(async (t) => {
      const resolved: ResolvedLine[] = []

      for (const line of lineRefs) {
        const pRef = adminDb.collection("products").doc(line.productId)
        const pSnap = await t.get(pRef)
        if (!pSnap.exists) {
          throw new ApiError(400, `Товар не найден: ${line.productId}`)
        }
        const pdata = pSnap.data() ?? {}
        if (!isProductOrderable(pdata as Record<string, unknown>)) {
          throw new ApiError(
            400,
            `Товар «${titleFromProductData(pdata as Record<string, unknown>)}» недоступен для заказа`,
          )
        }

        const unitUsd = effectiveUsdFromProductData(pdata as Record<string, unknown>)
        const unitPriceKzt = usdToKzt(unitUsd)
        const title = titleFromProductData(pdata as Record<string, unknown>)

        const vSnap = await t.get(line.variantRef)
        if (!vSnap.exists) {
          throw new ApiError(400, `Вариант товара «${title}» недоступен`)
        }
        const stockBefore =
          typeof vSnap.data()?.stockQty === "number" ? vSnap.data()!.stockQty : 0
        if (stockBefore < line.quantity) {
          throw new ApiError(
            400,
            `Недостаточно «${title}» на складе (доступно ${stockBefore} шт.)`,
          )
        }

        resolved.push({ line, unitPriceKzt, title, stockBefore })
      }

      merchandiseTotal = resolved.reduce(
        (s, r) => s + r.unitPriceKzt * r.line.quantity,
        0,
      )

      if (!nearEqual(body.subtotal, merchandiseTotal, 1.5)) {
        throw new ApiError(
          400,
          "Сумма товаров не совпадает с актуальными ценами каталога. Обновите страницу оформления.",
        )
      }

      if (promoCodeArg) {
        const pref = adminDb.collection("promocodes").doc(promoCodeArg)
        const ps = await t.get(pref)
        if (!ps.exists) throw new ApiError(400, "Промокод не найден")
        const promo = applyPromoFromDocData(
          ps.data() ?? {},
          promoCodeArg,
          Math.round(merchandiseTotal),
        )
        if (!promo.ok) throw new ApiError(400, promo.error)
        discountKzt = promo.discountKzt
        promoCodeApplied = promo.code || null
      } else {
        discountKzt = 0
        promoCodeApplied = null
      }

      const taxableBase = Math.max(0, Math.round(merchandiseTotal) - discountKzt)
      const threshold = getFreeShippingThresholdKzt()
      const shipExpected =
        threshold > 0 && taxableBase >= threshold ? 0 : checkoutShippingFeeKzt(body.shippingMethod)
      if (!nearEqual(body.shippingFee, shipExpected, 0.5)) {
        throw new ApiError(400, "Некорректная стоимость доставки")
      }
      const taxKzt = Math.round(taxableBase * CHECKOUT_TAX_RATE * 100) / 100
      totalExpected = taxableBase + body.shippingFee + taxKzt
      if (!nearEqual(body.total, totalExpected, 2.5)) {
        throw new ApiError(400, "Некорректная итоговая сумма. Обновите страницу оформления.")
      }

      if (promoCodeArg && promoCodeApplied) {
        const pref = adminDb.collection("promocodes").doc(promoCodeApplied)
        t.update(pref, {
          usedCount: FieldValue.increment(1),
          updatedAt: FieldValue.serverTimestamp(),
        })
      }

      for (const r of resolved) {
        const afterQty = r.stockBefore - r.line.quantity
        t.update(r.line.variantRef, {
          stockQty: afterQty,
          updatedAt: FieldValue.serverTimestamp(),
        })

        const logRef = adminDb.collection("inventoryLogs").doc()
        t.set(logRef, {
          variantId: r.line.variantRef.id,
          delta: -r.line.quantity,
          beforeQty: r.stockBefore,
          afterQty,
          reason: `order:${orderRef.id}`,
          actorUid: userCtx?.uid ?? "system",
          createdAt: FieldValue.serverTimestamp(),
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
        promoCode: promoCodeApplied,
        taxKzt,
        shippingFee: body.shippingFee,
        total: totalExpected,
        status: "pending",
        trackingNumber: null,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      })

      for (const r of resolved) {
        const itemRef = orderRef.collection("items").doc()
        t.set(itemRef, {
          productId: r.line.productId,
          quantity: r.line.quantity,
          size: r.line.size,
          colorHex: r.line.colorHex,
          unitPrice: r.unitPriceKzt,
          title: r.title,
        })
      }

      t.set(orderRef.collection("statusHistory").doc(), {
        status: "pending",
        note: "Order created",
        createdAt: FieldValue.serverTimestamp(),
        actorUid: userCtx?.uid ?? "system",
      })
    })

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
