import { parsePriceUsd } from "@/lib/plp-filters"

/** Курс для отображения: цены в каталоге заданы в USD, витрина — в ₸. */
export function getUsdToKztRate(): number {
  const raw = process.env.NEXT_PUBLIC_USD_TO_KZT
  if (raw !== undefined && raw !== "") {
    const n = Number(raw)
    if (Number.isFinite(n) && n > 0) return n
  }
  return 450
}

export function usdToKzt(usd: number): number {
  return Math.round(usd * getUsdToKztRate())
}

/** Тенге → USD для сохранения в Firestore (цены в каталоге хранятся как USD). */
export function kztToUsd(kzt: number): number {
  const r = kzt / getUsdToKztRate()
  return Math.round(r * 100) / 100
}

/** Число из строки цены (USD) → сумма в тенге. */
export function kztFromPriceString(price: string): number {
  return usdToKzt(parsePriceUsd(price))
}

export function formatKzt(amountKzt: number): string {
  const r = Math.round(amountKzt)
  return `${r.toLocaleString("ru-RU")} ₸`
}

/** Строка цены из каталога (в USD) → отображение в тенге. */
export function displayPriceKztFromCatalog(price: string): string {
  return formatKzt(kztFromPriceString(price))
}
