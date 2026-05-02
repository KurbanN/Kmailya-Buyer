import { adminDb } from "@/lib/firebase-admin"
import { usdToKzt } from "@/lib/currency"

function toDate(v: unknown): Date | null {
  if (v == null) return null
  if (v instanceof Date) return Number.isNaN(v.getTime()) ? null : v
  if (typeof v === "string") {
    const d = new Date(v)
    return Number.isNaN(d.getTime()) ? null : d
  }
  if (typeof v === "object" && v !== null && "toDate" in v && typeof (v as { toDate: () => Date }).toDate === "function") {
    const d = (v as { toDate: () => Date }).toDate()
    return Number.isNaN(d.getTime()) ? null : d
  }
  if (typeof v === "object" && v !== null && "seconds" in v) {
    const s = (v as { seconds: number }).seconds
    if (typeof s === "number") return new Date(s * 1000)
  }
  return null
}

export type PromoApplyResult =
  | { ok: true; discountKzt: number; code: string }
  | { ok: false; error: string }

/**
 * Считает скидку в ₸ по документу промокода. Сумма заказа (товары) — в тенге.
 * minOrderAmount и fixed value в Firestore — в USD (как цены в каталоге).
 */
export async function validatePromoForMerchandiseKzt(
  rawCode: string | undefined | null,
  merchandiseSubtotalKzt: number,
): Promise<PromoApplyResult> {
  const trimmed = typeof rawCode === "string" ? rawCode.trim().toUpperCase() : ""
  if (!trimmed) {
    return { ok: true, discountKzt: 0, code: "" }
  }

  const snap = await adminDb.collection("promocodes").doc(trimmed).get()
  if (!snap.exists) {
    return { ok: false, error: "Промокод не найден" }
  }

  const d = snap.data() ?? {}
  if (d.isActive === false) {
    return { ok: false, error: "Промокод недоступен" }
  }

  const now = new Date()
  const start = toDate(d.startAt)
  const end = toDate(d.endAt)
  if (start && now < start) return { ok: false, error: "Промокод ещё не действует" }
  if (end && now > end) return { ok: false, error: "Промокод истёк" }

  const maxUses = typeof d.maxUses === "number" ? d.maxUses : 1
  const usedCount = typeof d.usedCount === "number" ? d.usedCount : 0
  if (usedCount >= maxUses) {
    return { ok: false, error: "Лимит активаций промокода исчерпан" }
  }

  const minUsd =
    typeof d.minOrderAmount === "number" && Number.isFinite(d.minOrderAmount)
      ? Math.max(0, d.minOrderAmount)
      : 0
  const minKzt = usdToKzt(minUsd)
  if (merchandiseSubtotalKzt + 0.5 < minKzt) {
    return {
      ok: false,
      error: `Минимальная сумма заказа для промокода — ${minKzt.toLocaleString("ru-RU")} ₸`,
    }
  }

  const typ = d.type === "percent" || d.type === "fixed" ? d.type : null
  if (!typ) {
    return { ok: false, error: "Некорректный тип промокода" }
  }

  const val = typeof d.value === "number" && Number.isFinite(d.value) ? d.value : 0

  let discountKzt = 0
  if (typ === "percent") {
    const pct = Math.min(99, Math.max(0, val))
    discountKzt = Math.round((merchandiseSubtotalKzt * pct) / 100)
  } else {
    discountKzt = usdToKzt(Math.max(0, val))
  }

  discountKzt = Math.min(discountKzt, Math.max(0, Math.round(merchandiseSubtotalKzt)))
  return { ok: true, discountKzt, code: trimmed }
}
