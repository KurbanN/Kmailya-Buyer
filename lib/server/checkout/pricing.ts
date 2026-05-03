/** Цена заказа из документа продукта Firestore (USD → расчёт как в product-repository). */

export function effectiveUsdFromProductData(data: Record<string, unknown>): number {
  const basePrice = typeof data.basePrice === "number" ? data.basePrice : 0
  const salePrice = typeof data.salePrice === "number" ? data.salePrice : null
  const hasSale =
    salePrice != null &&
    Number.isFinite(salePrice) &&
    salePrice >= 0 &&
    salePrice < basePrice
  return hasSale && salePrice != null ? salePrice : basePrice
}

export function titleFromProductData(data: Record<string, unknown>): string {
  if (typeof data.title === "string" && data.title.trim()) return data.title.trim()
  if (typeof data.name === "string" && data.name.trim()) return data.name.trim()
  return "Товар"
}

export function isProductOrderable(data: Record<string, unknown>): boolean {
  if (data.isEnabled === false) return false
  const status = typeof data.status === "string" ? data.status : ""
  return status === "active"
}
