import { randomUUID } from "crypto"
import { FieldValue } from "firebase-admin/firestore"

import { adminDb } from "@/lib/firebase-admin"

/** Совпадает с типичным свотчем в каталоге / product-repository. */
export const DEFAULT_VARIANT_COLOR_HEX = "#d9d9d9"
export const DEFAULT_VARIANT_COLOR_NAME = "Основной"

export type ProductColorInput = { hex: string; name?: string }

/** Равномерно делит целое `total` на `n` позиций (остаток отдаём первым слотам). */
export function distributeStock(total: number, n: number): number[] {
  if (n <= 0) return []
  const totalSafe = Math.max(0, Math.floor(total))
  const base = Math.floor(totalSafe / n)
  const remainder = totalSafe % n
  return Array.from({ length: n }, (_, i) => base + (i < remainder ? 1 : 0))
}

export function normalizeVariantHex(hex: string): string {
  const t = hex.trim()
  const withHash = t.startsWith("#") ? t : `#${t}`
  const s = withHash.slice(1).toLowerCase()
  if (s.length === 3) {
    return `#${s[0]}${s[0]}${s[1]}${s[1]}${s[2]}${s[2]}`
  }
  return `#${s}`
}

function displayColorName(hex: string, name?: string): string {
  const n = name?.trim()
  if (n) return n
  return `Цвет ${hex.slice(1)}`
}

function dedupeColors(colors: ProductColorInput[]): ProductColorInput[] {
  const seen = new Set<string>()
  const out: ProductColorInput[] = []
  for (const c of colors) {
    const h = normalizeVariantHex(c.hex)
    if (seen.has(h)) continue
    seen.add(h)
    out.push({ hex: h, name: c.name })
  }
  return out.length > 0
    ? out
    : [{ hex: DEFAULT_VARIANT_COLOR_HEX, name: DEFAULT_VARIANT_COLOR_NAME }]
}

function childSku(baseSku: string, size: string, colorHex: string): string {
  const hexShort = normalizeVariantHex(colorHex).slice(1)
  const raw = `${baseSku}-${size}-${hexShort}`.replace(/[^A-Za-z0-9._-]/g, "-")
  return raw.length <= 64 ? raw : raw.slice(0, 64)
}

const SIZE_ORDER = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "3XL"]

function sortSizes(sizes: string[]): string[] {
  const order = new Map(SIZE_ORDER.map((s, i) => [s, i]))
  return [...new Set(sizes.map((s) => s.trim()).filter(Boolean))].sort(
    (a, b) => (order.get(a) ?? 99) - (order.get(b) ?? 99),
  )
}

function buildCombos(
  sizes: string[],
  colors: ProductColorInput[],
): { size: string; hex: string; name: string }[] {
  const uniqSizes = sortSizes(sizes)
  const uniqColors = dedupeColors(colors)
  const combos: { size: string; hex: string; name: string }[] = []
  for (const size of uniqSizes) {
    for (const c of uniqColors) {
      const hex = normalizeVariantHex(c.hex)
      combos.push({
        size,
        hex,
        name: displayColorName(hex, c.name),
      })
    }
  }
  return combos
}

async function existingVariantKeys(productId: string): Promise<Set<string>> {
  const snap = await adminDb.collection("productVariants").where("productId", "==", productId).get()
  const set = new Set<string>()
  snap.docs.forEach((d) => {
    const data = d.data()
    const sz = data?.size
    const ch = data?.colorHex
    if (typeof sz === "string" && sz.trim() && typeof ch === "string" && ch.trim()) {
      set.add(`${sz.trim()}|${normalizeVariantHex(ch)}`)
    }
  })
  return set
}

/** Firestore batch max 500 ops; каждый вариант — 2 записи. */
const BATCH_MAX_OPS = 450

export type SyncVariantsMode = "initial" | "missing_only"

function normalizeColorsArg(colors: unknown): ProductColorInput[] {
  if (!Array.isArray(colors) || colors.length === 0) {
    return [{ hex: DEFAULT_VARIANT_COLOR_HEX, name: DEFAULT_VARIANT_COLOR_NAME }]
  }
  const out: ProductColorInput[] = []
  for (const item of colors) {
    if (!item || typeof item !== "object") continue
    const o = item as Record<string, unknown>
    const hexRaw = typeof o.hex === "string" ? o.hex.trim() : ""
    if (!hexRaw) continue
    const hex = normalizeVariantHex(hexRaw)
    const name = typeof o.name === "string" ? o.name : undefined
    out.push({ hex, name })
  }
  return out.length > 0 ? out : [{ hex: DEFAULT_VARIANT_COLOR_HEX, name: DEFAULT_VARIANT_COLOR_NAME }]
}

/**
 * Создаёт недостающие варианты (размер × цвет) в `productVariants` и `products/.../variants`.
 *
 * - **initial** — новый товар: делит `stockCount` между всеми комбинациями (все строки новые).
 * - **missing_only** — правка карточки: только новые пары размер×цвет, остаток 0 (дальше — «Склад»).
 */
export async function syncDefaultVariantsForProduct(args: {
  productId: string
  baseSku: string
  sizes: string[]
  colors?: unknown
  stockCount: number
  actorUid: string
  mode: SyncVariantsMode
}): Promise<{ created: number }> {
  const { productId, baseSku, stockCount, actorUid, mode } = args
  const uniqSizes = [...new Set(args.sizes.map((s) => String(s).trim()).filter(Boolean))]
  const colorsIn = normalizeColorsArg(args.colors)
  if (uniqSizes.length === 0 || baseSku.trim().length < 3) {
    return { created: 0 }
  }

  const combos = buildCombos(uniqSizes, colorsIn)
  const existing = await existingVariantKeys(productId)
  const missing = combos.filter((c) => !existing.has(`${c.size}|${c.hex}`))
  if (missing.length === 0) return { created: 0 }

  let quantities: number[]
  if (mode === "initial") {
    quantities = distributeStock(stockCount, missing.length)
  } else {
    quantities = Array.from({ length: missing.length }, () => 0)
  }

  let batch = adminDb.batch()
  let opsInBatch = 0
  let created = 0

  const flush = async () => {
    if (opsInBatch === 0) return
    await batch.commit()
    batch = adminDb.batch()
    opsInBatch = 0
  }

  for (let i = 0; i < missing.length; i++) {
    const combo = missing[i]!
    const qty = quantities[i] ?? 0
    const variantId = randomUUID()
    const data = {
      sku: childSku(baseSku, combo.size, combo.hex),
      size: combo.size,
      colorName: combo.name,
      colorHex: combo.hex,
      priceOverride: null,
      stockQty: qty,
      reservedQty: 0,
      isActive: true,
      productId,
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: actorUid,
    }
    const nestedRef = adminDb.collection("products").doc(productId).collection("variants").doc(variantId)
    const topRef = adminDb.collection("productVariants").doc(variantId)

    if (opsInBatch + 2 > BATCH_MAX_OPS) {
      await flush()
    }
    batch.set(nestedRef, data)
    batch.set(topRef, data)
    opsInBatch += 2
    created++
  }

  await flush()
  return { created }
}
