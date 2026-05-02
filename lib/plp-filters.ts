import type { ProductDetail } from "@/lib/products-data"

export type ShopChipId =
  | "all"
  | "new"
  | "shirts"
  | "polo"
  | "shorts"
  | "bestsellers"
  | "tshirts"
  | "jeans"
  | "jackets"

const SHIRTS_IDS = new Set(["n1", "c1"])
const TEE_IDS = new Set(["n2", "n3", "c1"])
const BEST_IDS = new Set(["c1", "n1", "n2", "n3"])

/** Верхняя панель категорий (как в UI Kit) */
export function matchesShopChip(p: ProductDetail, chip: ShopChipId): boolean {
  if (chip === "all") return true
  const t = p.title.toLowerCase()
  switch (chip) {
    case "new":
      if (p.merchandisingTag === "new") return true
      if (p.merchandisingTag === "hit") return false
      if (p.merchandisingTag == null) return p.id.startsWith("n")
      return false
    case "shirts":
      return SHIRTS_IDS.has(p.id) || (t.includes("shirt") && !t.includes("tee"))
    case "polo":
      return t.includes("polo")
    case "shorts":
      return t.includes("short")
    case "tshirts":
      return (
        TEE_IDS.has(p.id) ||
        t.includes("tee") ||
        t.includes("t-shirt") ||
        t.includes("pullover")
      )
    case "jeans":
      return t.includes("jean")
    case "jackets":
      return t.includes("jacket")
    case "bestsellers":
      if (p.merchandisingTag === "hit") return true
      if (p.merchandisingTag === "new") return false
      if (p.merchandisingTag == null) return BEST_IDS.has(p.id)
      return false
    default:
      return true
  }
}

export type SidebarCategoryKey = "newArrivals" | "cottonTee" | "knit" | "loungewear" | "longsleeve"

export const SIDEBAR_CATEGORY_OPTIONS: {
  key: SidebarCategoryKey
  label: string
  ids: readonly string[]
}[] = [
  { key: "newArrivals", label: "Новинки", ids: ["n1", "n2", "n3", "n4"] },
  { key: "cottonTee", label: "Хлопковая футболка", ids: ["c1"] },
  { key: "knit", label: "Трикотаж и дом", ids: ["c2", "c3"] },
  { key: "loungewear", label: "Домашняя одежда", ids: ["c3"] },
  { key: "longsleeve", label: "С длинным рукавом", ids: ["n4"] },
]

export type CollectionFilterKey = "summer24" | "studio"

export const COLLECTION_OPTIONS: {
  key: CollectionFilterKey
  label: string
  ids: readonly string[]
}[] = [
  { key: "summer24", label: "Лето 2024", ids: ["n1", "n2", "n3", "n4", "c1", "c2", "c3"] },
  { key: "studio", label: "Студия", ids: ["c2", "c3"] },
]

export function parsePriceUsd(price: string): number {
  const n = Number.parseFloat(price.replace(/[^0-9.]/g, ""))
  return Number.isFinite(n) ? n : 0
}

export function isInStock(p: ProductDetail): boolean {
  return p.inStock !== false
}
