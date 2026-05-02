/** Порог суммы корзины (₸) для бесплатной доставки; настраивается в .env */
export function getFreeShippingThresholdKzt(): number {
  const raw = process.env.NEXT_PUBLIC_FREE_SHIPPING_THRESHOLD_KZT
  if (raw !== undefined && raw !== "") {
    const n = Number(raw)
    if (Number.isFinite(n) && n > 0) return Math.round(n)
  }
  return 30_000
}

export function getSiteUrl(): string {
  const u = process.env.NEXT_PUBLIC_SITE_URL
  if (typeof u === "string" && u.startsWith("http")) {
    return u.replace(/\/$/, "")
  }
  return "https://kamilya.example"
}
