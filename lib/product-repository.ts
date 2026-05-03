import { adminDb } from "@/lib/firebase-admin"
import { publicAssetUrl } from "@/lib/public-asset-url"
import { PRODUCTS, type ProductDetail } from "@/lib/products-data"

function fromStatic(): ProductDetail[] {
  return Object.values(PRODUCTS)
}

function expandProductHex(raw: string): string {
  const s = raw.startsWith("#") ? raw.slice(1) : raw
  if (s.length === 3) {
    return `#${s[0]}${s[0]}${s[1]}${s[1]}${s[2]}${s[2]}`.toLowerCase()
  }
  return `#${s.toLowerCase()}`
}

function parseProductColors(data: Record<string, unknown>): { hex: string; name?: string }[] {
  const raw = data.colors
  if (!Array.isArray(raw) || raw.length === 0) return [{ hex: "#d9d9d9" }]
  const out: { hex: string; name?: string }[] = []
  for (const item of raw) {
    if (!item || typeof item !== "object") continue
    const o = item as Record<string, unknown>
    let hexRaw = typeof o.hex === "string" ? o.hex.trim() : ""
    if (!hexRaw) continue
    if (!hexRaw.startsWith("#")) hexRaw = `#${hexRaw}`
    if (!/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(hexRaw)) continue
    const hex = expandProductHex(hexRaw)
    const name = typeof o.name === "string" && o.name.trim() ? o.name.trim() : undefined
    out.push(name ? { hex, name } : { hex })
  }
  return out.length > 0 ? out : [{ hex: "#d9d9d9" }]
}

async function brandNamesByIds(ids: string[]): Promise<Map<string, string>> {
  const uniq = [...new Set(ids.filter((x) => x && typeof x === "string"))]
  if (uniq.length === 0) return new Map()
  const refs = uniq.map((id) => adminDb.collection("brands").doc(id))
  const snaps = await adminDb.getAll(...refs)
  const map = new Map<string, string>()
  for (const s of snaps) {
    if (!s.exists) continue
    const name = s.data()?.name
    if (typeof name === "string" && name.trim()) {
      map.set(s.id, name.trim())
    }
  }
  return map
}

function toProductDetail(
  id: string,
  data: Record<string, unknown>,
  brandName?: string,
): ProductDetail {
  const basePrice = typeof data.basePrice === "number" ? data.basePrice : 0
  const salePrice = typeof data.salePrice === "number" ? data.salePrice : null
  const hasSale =
    salePrice != null &&
    Number.isFinite(salePrice) &&
    salePrice >= 0 &&
    salePrice < basePrice
  const effective = hasSale && salePrice != null ? salePrice : basePrice
  const rawTitle =
    typeof data.title === "string"
      ? data.title
      : typeof data.name === "string"
        ? data.name
        : "Untitled"
  /** Название без бренда — бренд показывается отдельной строкой на PDP/PLP */
  const title = rawTitle

  const stockRaw = data.stockCount ?? data.stockQuantity
  const stockCount =
    typeof stockRaw === "number" && Number.isFinite(stockRaw)
      ? Math.max(0, Math.floor(stockRaw))
      : 0

  let sizes: string[] = ["S", "M", "L"]
  if (Array.isArray(data.sizes) && data.sizes.length > 0) {
    const parsed = data.sizes.filter((x): x is string => typeof x === "string" && x.trim().length > 0)
    if (parsed.length > 0) sizes = parsed.map((s) => s.trim())
  }

  const reviewCount =
    typeof data.reviewCount === "number" && Number.isFinite(data.reviewCount)
      ? Math.max(0, Math.floor(data.reviewCount))
      : undefined
  const averageRating =
    typeof data.averageRating === "number" &&
    Number.isFinite(data.averageRating) &&
    data.averageRating >= 1 &&
    data.averageRating <= 5
      ? Math.round(data.averageRating * 10) / 10
      : undefined

  const tagRaw = data.merchandisingTag
  const merchandisingTag: "new" | "hit" | undefined =
    tagRaw === "new" || tagRaw === "hit" ? tagRaw : undefined
  const plpSortKey =
    typeof data.plpSortKey === "number" && Number.isFinite(data.plpSortKey)
      ? Math.max(0, Math.floor(data.plpSortKey))
      : undefined

  return {
    id,
    title,
    brandName,
    price: `$${effective}`,
    listPrice: hasSale ? `$${basePrice}` : undefined,
    mrpNote: "",
    description:
      typeof data.description === "string" ? data.description : "",
    gallery: (
      Array.isArray(data.imageUrls) && data.imageUrls.length > 0
        ? (data.imageUrls.filter((x) => typeof x === "string") as string[])
        : typeof data.coverImageUrl === "string"
          ? [data.coverImageUrl]
          : ["/logo.png"]
    ).map(publicAssetUrl),
    colors: parseProductColors(data),
    sizes,
    listCategory: typeof data.categoryId === "string" ? data.categoryId : undefined,
    inStock: data.status !== "out_of_stock",
    stockCount,
    reviewCount,
    averageRating,
    merchandisingTag,
    plpSortKey,
  }
}

export async function getAllProductsRepo(): Promise<ProductDetail[]> {
  try {
    const snap = await adminDb
      .collection("products")
      .where("isEnabled", "==", true)
      .limit(600)
      .get()
    if (snap.empty) throw new Error("No firestore products")
    if (process.env.NODE_ENV !== "production") console.log("[product-repository] source=firestore")
    const brandIds = snap.docs
      .map((d) => d.data().brandId)
      .filter((x): x is string => typeof x === "string")
    const brandMap = await brandNamesByIds(brandIds)
    return snap.docs.map((doc) => {
      const data = doc.data()
      const bn =
        typeof data.brandId === "string" ? brandMap.get(data.brandId) : undefined
      return toProductDetail(doc.id, data, bn)
    })
  } catch {
    if (process.env.NODE_ENV !== "production") console.log("[product-repository] source=fallback")
    return fromStatic()
  }
}

export async function getProductByIdRepo(id: string): Promise<ProductDetail | null> {
  try {
    const snap = await adminDb.collection("products").doc(id).get()
    if (snap.exists) {
      if (process.env.NODE_ENV !== "production") console.log("[product-repository] source=firestore")
      const data = snap.data() ?? {}
      let bn: string | undefined
      if (typeof data.brandId === "string") {
        const bs = await adminDb.collection("brands").doc(data.brandId).get()
        const name = bs.data()?.name
        if (typeof name === "string" && name.trim()) bn = name.trim()
      }
      return toProductDetail(snap.id, data, bn)
    }
  } catch {
    // fallback below
  }
  if (process.env.NODE_ENV !== "production") console.log("[product-repository] source=fallback")
  return PRODUCTS[id] ?? null
}

export async function getProductsByIdsRepo(ids: string[]): Promise<Record<string, ProductDetail>> {
  const all = await getAllProductsRepo()
  const map = new Map(all.map((p) => [p.id, p]))
  const result: Record<string, ProductDetail> = {}
  ids.forEach((id) => {
    const p = map.get(id) ?? PRODUCTS[id]
    if (p) result[id] = p
  })
  return result
}
