"use client"

import Link from "next/link"
import { useCallback, useEffect, useMemo, useState } from "react"
import {
  GitCompare,
  Heart,
  HelpCircle,
  Menu,
  Minus,
  Package,
  Plus,
  Share2,
  ShoppingBag,
  Star,
  Truck,
  User,
} from "lucide-react"

import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { ShoppingCartSheet } from "@/components/shopping-cart-sheet"
import { WishlistNavTriggerIcon, WishlistSheet } from "@/components/wishlist-sheet"
import { useShop } from "@/components/shop-provider"
import { displayPriceKztFromCatalog, formatKzt, kztFromPriceString } from "@/lib/currency"
import { getFreeShippingThresholdKzt } from "@/lib/site-config"
import { getProduct, type ProductDetail } from "@/lib/products-data"
import { cn } from "@/lib/utils"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { SiteLogo } from "@/components/site-logo"
import { ProductReviewsSection } from "@/components/product-reviews-section"
import { RelatedProducts } from "@/components/related-products"

type Props = { productId: string; initialProduct?: ProductDetail | null }

function discountPercent(price: string, listPrice?: string): number | null {
  if (!listPrice) return null
  const cur = kztFromPriceString(price)
  const old = kztFromPriceString(listPrice)
  if (old <= 0 || cur >= old) return null
  return Math.round(((old - cur) / old) * 100)
}

/**
 * Берём данные на клиенте по `productId`, чтобы не тащить весь объект через RSC Flight
 * (у части окружений это давало 500 на навигации / первому запросу).
 */
function WishlistHeart({
  active,
  onPress,
  className,
  iconClassName,
}: {
  active: boolean
  onPress: () => void
  className?: string
  iconClassName?: string
}) {
  return (
    <button
      type="button"
      onClick={onPress}
      aria-pressed={active}
        aria-label={active ? "Убрать из избранного" : "В избранное"}
      className={className}
    >
      <Heart
        className={cn(
          iconClassName,
          active ? "fill-neutral-950 text-neutral-950" : "text-neutral-900",
        )}
        fill={active ? "currentColor" : "none"}
        strokeWidth={1.25}
      />
    </button>
  )
}

export function ProductDetailView({ productId, initialProduct = null }: Props) {
  const { user } = useAuth()
  const [fetchedProduct, setFetchedProduct] = useState<ProductDetail | null>(null)
  const [pdpLoading, setPdpLoading] = useState(
    () => !initialProduct && !getProduct(productId),
  )
  const product =
    initialProduct ?? getProduct(productId) ?? fetchedProduct
  const { isInWishlist, toggleWishlist, addToCart, cartCount, wishlist } = useShop()

  useEffect(() => {
    if (initialProduct || getProduct(productId)) {
      setPdpLoading(false)
      return
    }
    let cancelled = false
    setPdpLoading(true)
    void fetch(`/api/products?ids=${encodeURIComponent(productId)}`)
      .then((r) => r.json())
      .then((j) => {
        if (cancelled || !j?.items?.[0]) return
        setFetchedProduct(j.items[0] as ProductDetail)
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setPdpLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [productId, initialProduct])
  const [activeIdx, setActiveIdx] = useState(0)

  useEffect(() => {
    setActiveIdx(0)
    setQty(1)
    setSize(null)
    setColorIdx(0)
    setSizeHint(false)
  }, [productId])
  const [size, setSize] = useState<string | null>(null)
  const [colorIdx, setColorIdx] = useState(0)
  const [sizeHint, setSizeHint] = useState(false)
  const [qty, setQty] = useState(1)
  const [reviewStats, setReviewStats] = useState<{
    avg: number | null
    count: number
  }>({ avg: null, count: 0 })

  const handleReviewStats = useCallback((avg: number | null, count: number) => {
    setReviewStats({ avg, count })
  }, [])

  const discountPct = useMemo(
    () => (product ? discountPercent(product.price, product.listPrice) : null),
    [product],
  )

  const stockBarPct = useMemo(() => {
    const sc = product?.stockCount ?? 0
    if (sc <= 0) return 0
    return Math.min(100, Math.round((sc / 50) * 100))
  }, [product?.stockCount])

  useEffect(() => {
    if (!product) return
    setReviewStats({
      avg: product.averageRating ?? null,
      count: product.reviewCount ?? 0,
    })
  }, [product?.id, product?.averageRating, product?.reviewCount])

  const wishlisted = product ? isInWishlist(product.id) : false

  if (!product) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-neutral-100 px-4 text-neutral-800">
        <p>{pdpLoading ? "Загрузка…" : "Товар не найден."}</p>
        <Link href="/products" className="text-sm uppercase tracking-widest underline">
          В каталог
        </Link>
      </div>
    )
  }

  const mainSrc =
    product.gallery[activeIdx] ?? product.gallery[0] ?? "/logo.png"
  const thumbs = product.gallery.slice(0, 7)
  const wishlistCount = wishlist.length

  const brandLabel = product.brandName?.trim() || "KAMILYA"
  const filledStars =
    reviewStats.count > 0 && reviewStats.avg != null
      ? Math.min(5, Math.round(reviewStats.avg))
      : 0
  const stockCountDisplay = product.stockCount ?? 0

  return (
    <div className="min-h-screen bg-white text-neutral-900 antialiased">
      {/* Шапка как в UI Kit: меню · навигация · лого · избранное · корзина (Cart + сумка) · профиль */}
      <header className="sticky top-0 z-50 border-b border-neutral-300/80 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1320px] items-center justify-between gap-2 py-2.5 pl-1.5 pr-3 sm:gap-3 sm:py-3 sm:pl-2 sm:pr-6">
          <Link
            href="/"
            className="flex h-11 shrink-0 items-center overflow-hidden sm:h-[52px]"
            style={{ maxWidth: "min(260px, 46vw)" }}
            aria-label="Kamilya — на главную"
          >
            <SiteLogo
              sizeClassName="h-full max-h-full w-auto"
              imgClassName="object-left"
              className="max-w-full object-contain"
            />
          </Link>

          <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-4 lg:gap-7">
            <Sheet>
              <SheetTrigger asChild>
                <button
                  type="button"
                  className="shrink-0 text-neutral-900 lg:hidden"
                  aria-label="Открыть меню"
                >
                  <Menu className="h-6 w-6" strokeWidth={1.5} />
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[280px]">
                <SheetHeader>
                  <SheetTitle className="text-left uppercase tracking-[0.2em]">Меню</SheetTitle>
                </SheetHeader>
                <nav className="mt-8 flex flex-col gap-4 text-sm font-medium uppercase tracking-[0.15em]">
                  <Link href="/" className="text-neutral-800">
                    Главная
                  </Link>
                  <Link href="/products" className="text-neutral-800">
                    Каталог
                  </Link>
                  <Link href="/#collections" className="text-neutral-800">
                    Коллекции
                  </Link>
                  <Link href="/#deals" className="text-neutral-800">
                    Новинки
                  </Link>
                </nav>
              </SheetContent>
            </Sheet>

            <nav className="hidden min-w-0 items-center gap-5 text-[12px] font-medium uppercase tracking-[0.1em] text-neutral-900 sm:gap-7 sm:text-[13px] lg:flex">
              <Link href="/" className="whitespace-nowrap transition-colors hover:text-neutral-500">
                Главная
              </Link>
              <Link href="/products" className="whitespace-nowrap transition-colors hover:text-neutral-500">
                Каталог
              </Link>
              <Link href="/#collections" className="whitespace-nowrap transition-colors hover:text-neutral-500">
                Коллекции
              </Link>
              <Link href="/#deals" className="whitespace-nowrap transition-colors hover:text-neutral-500">
                Новинки
              </Link>
            </nav>
          </div>

          <div className="flex shrink-0 items-center justify-end gap-1.5 sm:gap-3 md:pl-2">
            <WishlistSheet>
              <button
                type="button"
                className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-neutral-900 hover:bg-neutral-100"
                aria-label="Избранное"
              >
                <WishlistNavTriggerIcon active={wishlistCount > 0} className="h-6 w-6" />
                {wishlistCount > 0 ? (
                  <span className="absolute -right-0.5 -top-0.5 flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-neutral-900 px-1 text-[9px] font-semibold leading-none text-white ring-2 ring-white">
                    {wishlistCount > 99 ? "99+" : wishlistCount}
                  </span>
                ) : null}
              </button>
            </WishlistSheet>

            <ShoppingCartSheet>
              <button
                type="button"
                className="relative inline-flex h-[50px] shrink-0 items-center gap-3 rounded-[22px] bg-neutral-900 pl-5 pr-4 text-white"
                aria-label="Корзина"
              >
                <span className="text-[12px] font-medium uppercase tracking-[0.15em]">
                  Корзина
                </span>
                <span className="relative flex h-9 w-9 items-center justify-center rounded-full bg-white/15">
                  <ShoppingBag className="h-5 w-5 text-white" strokeWidth={1.25} />
                  {cartCount > 0 ? (
                    <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-white text-[10px] font-semibold leading-none text-neutral-900">
                      {cartCount > 99 ? "99+" : cartCount}
                    </span>
                  ) : null}
                </span>
              </button>
            </ShoppingCartSheet>

            <Link
              href={user ? "/account" : "/login?callbackUrl=/account"}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-neutral-900 hover:bg-neutral-100"
              aria-label="Профиль"
            >
              <User className="h-6 w-6" strokeWidth={1.25} />
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1320px] px-4 py-8 sm:px-6 lg:py-10">
        <Link
          href="/products"
          className="mb-8 inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.2em] text-neutral-600 hover:text-neutral-900"
        >
          ← В каталог
        </Link>

        {/* Галерея: превью слева от основного фото (как в UI Kit), справа — блок покупки, строго ч/б */}
        <div className="flex w-full flex-col gap-10 lg:flex-row lg:items-start lg:gap-12 xl:gap-16">
          <div className="flex min-h-0 w-full flex-1 flex-col gap-4 lg:flex-row lg:gap-5">
            {/* Превью — на десктопе слева вертикальной колонкой */}
            <div className="order-2 flex flex-row gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] lg:order-1 lg:w-[76px] lg:flex-shrink-0 lg:flex-col lg:gap-2 lg:overflow-y-auto lg:overflow-x-visible lg:pb-0 [&::-webkit-scrollbar]:hidden">
              {thumbs.map((src, i) => (
                <button
                  key={`${src}-${i}`}
                  type="button"
                  onClick={() => setActiveIdx(i)}
                  className={cn(
                    "relative aspect-[56/72] w-14 shrink-0 overflow-hidden rounded-md border bg-neutral-100 sm:w-16 lg:aspect-square lg:w-full lg:max-h-[88px]",
                    activeIdx === i
                      ? "border-neutral-900 ring-1 ring-neutral-900"
                      : "border-neutral-200 opacity-70 hover:opacity-100",
                  )}
                >
                  <img src={src} alt="" className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
                </button>
              ))}
            </div>

            <div className="order-1 relative aspect-[3/4] w-full max-w-[520px] overflow-hidden rounded-lg border border-neutral-200 bg-neutral-100 lg:order-2 lg:max-h-[min(88vh,720px)] lg:flex-1">
              <img
                src={mainSrc}
                alt={product.title}
                className="absolute inset-0 h-full w-full object-cover"
                decoding="async"
                fetchPriority="high"
              />
            </div>
          </div>

          <aside className="relative w-full max-w-xl flex-shrink-0 border border-neutral-200 bg-white p-6 sm:p-8 lg:sticky lg:top-24 lg:max-w-[480px] lg:self-start">
            <WishlistHeart
              active={wishlisted}
              onPress={() => toggleWishlist(product.id)}
              className="absolute right-5 top-5 text-neutral-800 hover:opacity-70 sm:right-6 sm:top-6"
              iconClassName="h-8 w-8 sm:h-9 sm:w-9"
            />

            <div className="pr-10">
              <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-neutral-500">
                {brandLabel}
              </p>
              <h1 className="mt-2 font-sans text-[1.65rem] font-semibold leading-[1.15] tracking-tight text-neutral-950 sm:text-3xl">
                {product.title}
              </h1>

              <a
                href="#otzyvy"
                className="mt-4 inline-flex flex-wrap items-center gap-2 text-neutral-900 transition-opacity hover:opacity-80"
              >
                <span className="flex gap-0.5" aria-hidden>
                  {[0, 1, 2, 3, 4].map((i) => (
                    <Star
                      key={i}
                      className={cn(
                        "h-4 w-4",
                        i < filledStars
                          ? "fill-neutral-900 text-neutral-900"
                          : "fill-none text-neutral-300",
                      )}
                      strokeWidth={1.2}
                    />
                  ))}
                </span>
                <span className="text-sm tabular-nums text-neutral-500">
                  ({reviewStats.count})
                </span>
              </a>

              <div className="mt-5 flex flex-wrap items-end gap-3">
                <span className="text-2xl font-semibold tabular-nums text-neutral-950 sm:text-[1.75rem]">
                  {displayPriceKztFromCatalog(product.price)}
                </span>
                {product.listPrice ? (
                  <span className="text-base text-neutral-400 line-through tabular-nums decoration-neutral-300">
                    {displayPriceKztFromCatalog(product.listPrice)}
                  </span>
                ) : null}
                {discountPct != null && discountPct > 0 ? (
                  <span className="rounded border border-neutral-900 bg-neutral-900 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
                    −{discountPct}%
                  </span>
                ) : null}
              </div>

              <div className="mt-6">
                <p className="text-[12px] font-medium text-neutral-900">
                  Осталось всего{" "}
                  <span className="tabular-nums font-semibold">{stockCountDisplay}</span> шт.!
                </p>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-neutral-200">
                  <div
                    className="h-full rounded-full bg-neutral-900 transition-[width]"
                    style={{ width: `${stockBarPct}%` }}
                  />
                </div>
              </div>

              <p className="mt-8 text-[11px] font-medium uppercase tracking-[0.12em] text-neutral-800">
                Размер:{" "}
                <span className="font-semibold text-neutral-950">{size ?? "—"}</span>
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {product.sizes.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                      setSize(s)
                      setSizeHint(false)
                    }}
                    className={cn(
                      "flex h-10 min-w-[42px] items-center justify-center rounded-md border text-[11px] font-semibold transition-colors",
                      size === s
                        ? "border-neutral-900 bg-neutral-900 text-white"
                        : "border-neutral-300 bg-white text-neutral-900 hover:border-neutral-900",
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>

              <p className="mt-8 text-[11px] font-medium uppercase tracking-[0.12em] text-neutral-800">
                Цвет
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {product.colors.map((c, i) => (
                  <button
                    key={c.hex}
                    type="button"
                    onClick={() => setColorIdx(i)}
                    className={cn(
                      "h-7 w-7 rounded-full border border-neutral-200 p-px transition-shadow sm:h-8 sm:w-8",
                      colorIdx === i ? "border-neutral-900 ring-1 ring-neutral-900 ring-offset-1" : "",
                    )}
                    aria-label={`Цвет ${i + 1}`}
                  >
                    <span
                      className="block h-full w-full rounded-full border border-neutral-200"
                      style={{ backgroundColor: c.hex }}
                    />
                  </button>
                ))}
              </div>

              <p className="mt-4 text-[10px] uppercase tracking-[0.08em] text-neutral-500">
                <Link href="/size-guide" className="underline-offset-2 hover:underline">
                  Таблица размеров
                </Link>
              </p>

              <p className="mt-6 text-[12px] leading-relaxed text-neutral-700">{product.description}</p>

              {sizeHint ? (
                <p className="mt-4 text-[12px] font-medium text-neutral-900">Выберите размер.</p>
              ) : null}

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="flex h-11 items-stretch border border-neutral-900">
                  <button
                    type="button"
                    className="flex w-10 items-center justify-center text-neutral-900 hover:bg-neutral-100"
                    aria-label="Меньше"
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                  >
                    <Minus className="h-4 w-4" strokeWidth={1.5} />
                  </button>
                  <span className="flex min-w-[2.5rem] items-center justify-center border-x border-neutral-900 text-sm font-semibold tabular-nums">
                    {qty}
                  </span>
                  <button
                    type="button"
                    className="flex w-10 items-center justify-center text-neutral-900 hover:bg-neutral-100"
                    aria-label="Больше"
                    onClick={() => setQty((q) => q + 1)}
                  >
                    <Plus className="h-4 w-4" strokeWidth={1.5} />
                  </button>
                </div>
                <Button
                  type="button"
                  className="h-11 flex-1 rounded-md border-2 border-neutral-900 bg-neutral-900 text-[12px] font-semibold uppercase tracking-[0.12em] text-white hover:bg-neutral-800"
                  onClick={() => {
                    if (!size) {
                      setSizeHint(true)
                      return
                    }
                    setSizeHint(false)
                    const colorHex = product.colors[colorIdx]?.hex ?? "#000000"
                    addToCart({
                      productId: product.id,
                      size,
                      colorHex,
                      quantity: qty,
                      title: product.title,
                      imageUrl: product.gallery[0],
                      unitPriceKzt: kztFromPriceString(product.price),
                    })
                  }}
                >
                  В корзину
                </Button>
              </div>

              <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 border-t border-neutral-200 pt-5 text-[10px] font-medium uppercase tracking-[0.15em] text-neutral-700">
                <button type="button" className="inline-flex items-center gap-1.5 hover:text-neutral-950">
                  <GitCompare className="h-3.5 w-3.5" strokeWidth={1.5} />
                  Сравнить
                </button>
                <button type="button" className="inline-flex items-center gap-1.5 hover:text-neutral-950">
                  <HelpCircle className="h-3.5 w-3.5" strokeWidth={1.5} />
                  Вопрос
                </button>
                <button type="button" className="inline-flex items-center gap-1.5 hover:text-neutral-950">
                  <Share2 className="h-3.5 w-3.5" strokeWidth={1.5} />
                  Поделиться
                </button>
              </div>

              <div className="mt-6 space-y-3 text-[12px] text-neutral-700">
                <p className="flex gap-2">
                  <Truck className="mt-0.5 h-4 w-4 shrink-0 text-neutral-900" strokeWidth={1.5} />
                  <span>
                    Ориентировочная доставка:{" "}
                    <span className="font-medium text-neutral-950">5–9 рабочих дней</span>
                  </span>
                </p>
                <p className="flex gap-2">
                  <Package className="mt-0.5 h-4 w-4 shrink-0 text-neutral-900" strokeWidth={1.5} />
                  <span>
                    Бесплатная доставка от {formatKzt(getFreeShippingThresholdKzt())} · возврат 14 дней
                  </span>
                </p>
              </div>

              <div className="mt-6 rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-4 text-center">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-500">
                  Visa · Mastercard · UnionPay · Kaspi
                </p>
                <p className="mt-2 text-[11px] text-neutral-600">Безопасная оплата и защита данных</p>
              </div>
            </div>
          </aside>
        </div>

        <div className="mt-14 w-full px-4 sm:px-6">
          <ProductReviewsSection productId={product.id} onStatsChange={handleReviewStats} />
        </div>

        <RelatedProducts excludeProductId={product.id} />
      </main>
    </div>
  )
}
