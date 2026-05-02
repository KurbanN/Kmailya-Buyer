"use client"

import Image from "next/image"
import Link from "next/link"
import { useCallback, useEffect, useMemo, useState } from "react"
import { Heart } from "lucide-react"

import { ProductsCategoryChips } from "@/components/products-category-chips"
import { ProductsFilterSidebar } from "@/components/products-filter-sidebar"
import { useShop } from "@/components/shop-provider"
import { StoreHeader } from "@/components/store-header"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ProductPriceKzt } from "@/components/product-price-kzt"
import { ProductReviewPlpLink } from "@/components/product-review-plp-link"
import { kztFromPriceString } from "@/lib/currency"
import {
  COLLECTION_OPTIONS,
  SIDEBAR_CATEGORY_OPTIONS,
  isInStock,
  matchesShopChip,
  parsePriceUsd,
  type CollectionFilterKey,
  type ShopChipId,
  type SidebarCategoryKey,
} from "@/lib/plp-filters"
import { withPublicAssetUrls } from "@/lib/public-asset-url"
import { PRODUCTS, type ProductDetail } from "@/lib/products-data"
import { cn } from "@/lib/utils"

const noiseBg = `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.06'/%3E%3C/svg%3E")`

function toggleInSet<T>(set: Set<T>, key: T): Set<T> {
  const n = new Set(set)
  if (n.has(key)) n.delete(key)
  else n.add(key)
  return n
}

/** Строка типа товара над названием (как в макете). */
function plpCategoryLine(p: ProductDetail): string {
  if (p.listCategory) return p.listCategory
  const t = p.title.toLowerCase()
  if (t.includes("tee") || t.includes("cotton")) return "Футболка"
  if (t.includes("shirt")) return "Рубашка"
  if (t.includes("pullover") || t.includes("knit")) return "Трикотаж"
  if (t.includes("rib") || t.includes("set")) return "Домашняя одежда"
  return "Одежда"
}

export default function ProductsPage() {
  const { isInWishlist, toggleWishlist } = useShop()
  const [products, setProducts] = useState<ProductDetail[]>(Object.values(PRODUCTS))
  const [searchQuery, setSearchQuery] = useState("")
  const [activeChip, setActiveChip] = useState<ShopChipId>("new")
  const [sort, setSort] = useState<"featured" | "price-asc" | "price-desc" | "az">(
    "featured",
  )

  const [selectedSizes, setSelectedSizes] = useState<Set<string>>(new Set())
  const [availIn, setAvailIn] = useState(true)
  const [availOut, setAvailOut] = useState(true)
  const [categoryKeys, setCategoryKeys] = useState<Set<SidebarCategoryKey>>(new Set())
  const [collectionKeys, setCollectionKeys] = useState<Set<CollectionFilterKey>>(new Set())
  const [selectedColors, setSelectedColors] = useState<Set<string>>(new Set())
  const [priceMin, setPriceMin] = useState("")
  const [priceMax, setPriceMax] = useState("")

  const colorPalette = useMemo(() => {
    const s = new Set<string>()
    products.forEach((p) => p.colors.forEach((c) => s.add(c.hex)))
    return Array.from(s)
  }, [products])

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/products")
        const json = await res.json()
        if (res.ok && Array.isArray(json.items)) {
          setProducts(json.items.map(withPublicAssetUrls))
        }
      } catch {
        // Keep static fallback already loaded in state
      }
    })()
  }, [])

  const filtered = useMemo(() => {
    let list: ProductDetail[] = [...products]

    list = list.filter((p) => matchesShopChip(p, activeChip))

    const q = searchQuery.trim().toLowerCase()
    if (q) {
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          (p.listCategory?.toLowerCase().includes(q) ?? false),
      )
    }

    if (selectedSizes.size > 0) {
      list = list.filter((p) => p.sizes.some((sz) => selectedSizes.has(sz)))
    }

    if (selectedColors.size > 0) {
      list = list.filter((p) =>
        p.colors.some((c) => selectedColors.has(c.hex)),
      )
    }

    const minN = priceMin.trim() === "" ? null : Number(priceMin)
    const maxN = priceMax.trim() === "" ? null : Number(priceMax)
    if (minN !== null && Number.isFinite(minN)) {
      list = list.filter((p) => kztFromPriceString(p.price) >= minN)
    }
    if (maxN !== null && Number.isFinite(maxN)) {
      list = list.filter((p) => kztFromPriceString(p.price) <= maxN)
    }

    if (availIn && !availOut) {
      list = list.filter((p) => isInStock(p))
    } else if (!availIn && availOut) {
      list = list.filter((p) => !isInStock(p))
    } else if (!availIn && !availOut) {
      list = []
    }

    if (categoryKeys.size > 0) {
      const allowed = new Set<string>()
      for (const k of categoryKeys) {
        const opt = SIDEBAR_CATEGORY_OPTIONS.find((o) => o.key === k)
        opt?.ids.forEach((id) => allowed.add(id))
      }
      list = list.filter((p) => allowed.has(p.id))
    }

    if (collectionKeys.size > 0) {
      const allowed = new Set<string>()
      for (const k of collectionKeys) {
        const opt = COLLECTION_OPTIONS.find((o) => o.key === k)
        opt?.ids.forEach((id) => allowed.add(id))
      }
      list = list.filter((p) => allowed.has(p.id))
    }

    if (sort === "price-asc") {
      list = [...list].sort((a, b) => parsePriceUsd(a.price) - parsePriceUsd(b.price))
    } else if (sort === "price-desc") {
      list = [...list].sort((a, b) => parsePriceUsd(b.price) - parsePriceUsd(a.price))
    } else if (sort === "az") {
      list = [...list].sort((a, b) => a.title.localeCompare(b.title))
    } else {
      list = [...list].sort((a, b) => {
        const ka = a.plpSortKey ?? 1000
        const kb = b.plpSortKey ?? 1000
        if (ka !== kb) return ka - kb
        return a.id.localeCompare(b.id)
      })
    }

    return list
  }, [
    activeChip,
    sort,
    searchQuery,
    selectedSizes,
    selectedColors,
    priceMin,
    priceMax,
    availIn,
    availOut,
    categoryKeys,
    collectionKeys,
    products,
  ])

  const onToggleSize = useCallback((s: string) => {
    setSelectedSizes((prev) => toggleInSet(prev, s))
  }, [])

  const onToggleCategory = useCallback((k: SidebarCategoryKey) => {
    setCategoryKeys((prev) => toggleInSet(prev, k))
  }, [])

  const onToggleCollection = useCallback((k: CollectionFilterKey) => {
    setCollectionKeys((prev) => toggleInSet(prev, k))
  }, [])

  const onToggleColor = useCallback((hex: string) => {
    setSelectedColors((prev) => toggleInSet(prev, hex))
  }, [])

  const filterSidebar = (
    <ProductsFilterSidebar
      selectedSizes={selectedSizes}
      onToggleSize={onToggleSize}
      availIn={availIn}
      availOut={availOut}
      onAvailIn={setAvailIn}
      onAvailOut={setAvailOut}
      categoryKeys={categoryKeys}
      onToggleCategory={onToggleCategory}
      collectionKeys={collectionKeys}
      onToggleCollection={onToggleCollection}
      colorPalette={colorPalette}
      selectedColors={selectedColors}
      onToggleColor={onToggleColor}
      priceMin={priceMin}
      priceMax={priceMax}
      onPriceMin={setPriceMin}
      onPriceMax={setPriceMax}
    />
  )

  return (
    <div
      className="min-h-screen text-neutral-900 antialiased"
      style={{
        backgroundColor: "#f2f2f2",
        backgroundImage: noiseBg,
      }}
    >
      <StoreHeader />

      <main className="mx-auto max-w-[1320px] px-4 py-8 sm:px-6 lg:py-10">
        <nav className="mb-6 flex flex-wrap items-center gap-2 text-[11px] font-medium uppercase tracking-[0.2em] text-neutral-500">
          <Link href="/" className="transition-colors hover:text-neutral-900">
            Главная
          </Link>
          <span className="text-neutral-400">/</span>
          <span className="text-neutral-900">Каталог</span>
        </nav>

        <div className="mb-8 flex flex-col gap-4 sm:mb-10 sm:flex-row sm:items-center sm:justify-between">
          <h1
            className="text-[clamp(1.875rem,5vw,2.75rem)] font-bold uppercase leading-none tracking-[0.08em] text-neutral-950"
            style={{ fontFamily: "var(--font-display), sans-serif" }}
          >
            Каталог
          </h1>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <Select value={sort} onValueChange={(v) => setSort(v as typeof sort)}>
              <SelectTrigger className="h-11 w-full rounded-none border-neutral-900 bg-white sm:w-[200px]">
                <SelectValue placeholder="Сортировка" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="featured">Рекомендуемые</SelectItem>
                <SelectItem value="az">По алфавиту</SelectItem>
                <SelectItem value="price-asc">Цена: по возрастанию</SelectItem>
                <SelectItem value="price-desc">Цена: по убыванию</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-x-8 lg:gap-y-0 xl:gap-x-10">
          <div className="flex w-full min-w-0 shrink-0 flex-col gap-8 lg:w-[288px]">
            <div className="relative z-0 min-w-0">
              <Input
                type="search"
                placeholder="Поиск"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-12 w-full rounded-none border-0 bg-neutral-100 pr-4 text-right text-sm placeholder:text-neutral-400 placeholder:text-right focus-visible:ring-1 focus-visible:ring-neutral-400"
              />
            </div>

            <aside
              className="relative z-0 min-w-0 border border-neutral-200/60 p-5 lg:sticky lg:top-28 lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto xl:p-6"
              style={{
                backgroundColor: "#f2f2f2",
                backgroundImage: noiseBg,
              }}
            >
              {filterSidebar}
            </aside>
          </div>

          <div className="relative z-10 flex min-w-0 flex-1 flex-col gap-6">
            <ProductsCategoryChips active={activeChip} onChange={setActiveChip} />
            <div className="min-w-0">
            <ul className="grid grid-cols-2 gap-x-5 gap-y-10 lg:grid-cols-3">
          {filtered.map((p, index) => {
            const categoryLine = plpCategoryLine(p)
            const restColors = Math.max(0, p.colors.length - 1)
            const firstHex = p.colors[0]?.hex ?? "#e5e5e5"
            const wishlisted = isInWishlist(p.id)

            return (
              <li key={p.id}>
                <article className="group">
                  <div className="relative mb-4 aspect-square w-full overflow-hidden border border-neutral-200 bg-neutral-100">
                    <Link
                      href={`/product/${p.id}`}
                      className="relative block h-full w-full"
                    >
                      <Image
                        src={p.gallery[0]!}
                        alt={p.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                        sizes="(max-width: 1024px) 50vw, 33vw"
                        priority={index < 4}
                      />
                    </Link>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        toggleWishlist(p.id)
                      }}
                      className="absolute left-2 top-2 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200/80 bg-white/95 shadow-sm backdrop-blur transition hover:bg-white"
                      aria-pressed={wishlisted}
                      aria-label={
                        wishlisted ? `Убрать «${p.title}» из избранного` : `Добавить «${p.title}» в избранное`
                      }
                    >
                      <Heart
                        className={cn(
                          "h-4 w-4 transition-colors",
                          wishlisted ? "fill-neutral-950 text-neutral-950" : "text-neutral-600",
                        )}
                        fill={wishlisted ? "currentColor" : "none"}
                        strokeWidth={1.5}
                      />
                    </button>
                  </div>

                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-neutral-700">
                      <span className="font-normal">{categoryLine}</span>
                      <span className="inline-flex items-center gap-1.5">
                        <span
                          className="h-3.5 w-3.5 shrink-0 border border-neutral-300"
                          style={{ backgroundColor: firstHex }}
                          title={firstHex}
                        />
                        {restColors > 0 ? (
                          <span className="text-neutral-500">+{restColors}</span>
                        ) : null}
                      </span>
                    </div>
                    <div className="flex items-start justify-between gap-3">
                      <Link
                        href={`/product/${p.id}`}
                        className="min-w-0 flex-1 text-[13px] font-semibold leading-snug text-neutral-950"
                      >
                        {p.title}
                      </Link>
                      <ProductPriceKzt
                        className="shrink-0 justify-end font-normal"
                        price={p.price}
                        listPrice={p.listPrice}
                      />
                    </div>
                    <ProductReviewPlpLink
                      productId={p.id}
                      reviewCount={p.reviewCount}
                      averageRating={p.averageRating}
                      className="mt-1"
                    />
                  </div>
                </article>
              </li>
            )
          })}
        </ul>

            {filtered.length === 0 ? (
              <p className="py-16 text-center text-sm text-neutral-500 lg:py-20">
                Нет товаров по выбранным условиям. Измените поиск или фильтры.
              </p>
            ) : null}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
