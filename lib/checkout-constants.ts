import { usdToKzt } from "@/lib/currency"

/** Должно совпадать с расчётом на клиенте (checkout). */
export const CHECKOUT_TAX_RATE = 0.08

export function checkoutShippingFeeKzt(method: string): number {
  const m = method.toLowerCase()
  if (m === "express") return usdToKzt(19)
  return usdToKzt(9)
}
