"use client"

import Image from "next/image"
import Link from "next/link"
import { Heart, Plus } from "lucide-react"

import { ProductPriceKzt } from "@/components/product-price-kzt"
import { cn } from "@/lib/utils"

export type ProductCardOverlay = "none" | "wishlist" | "plus"

type Props = {
  href: string
  imageSrc: string
  imageAlt: string
  title: string
  price: string
  listPrice?: string
  /** Подпись категории / типа (caps, мелко) */
  categoryLine?: string
  /** Ряд свотчей как на PLP */
  colorHex?: string
  restColorCount?: number
  overlay?: ProductCardOverlay
  wishlisted?: boolean
  onWishlistToggle?: () => void
  className?: string
}

/**
 * Карточка товара: рамка, белый фон, портрет 3:4 — в духе e-commerce UI Kit, без цветных акцентов.
 */
export function ProductCard({
  href,
  imageSrc,
  imageAlt,
  title,
  price,
  listPrice,
  categoryLine,
  colorHex,
  restColorCount,
  overlay = "none",
  wishlisted,
  onWishlistToggle,
  className,
}: Props) {
  const showMeta =
    Boolean(categoryLine) || Boolean(colorHex) || (restColorCount ?? 0) > 0

  return (
    <article
      className={cn(
        "group flex flex-col border border-neutral-900 bg-white text-neutral-900",
        className,
      )}
    >
      <div className="relative">
        <Link href={href} className="relative block aspect-[3/4] overflow-hidden bg-white">
          <Image
            src={imageSrc}
            alt={imageAlt}
            fill
            className="object-cover transition-transform duration-300 ease-out group-hover:scale-[1.02]"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        </Link>

        {overlay === "wishlist" ? (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onWishlistToggle?.()
            }}
            className="absolute right-2 top-2 z-10 flex h-9 w-9 items-center justify-center border border-neutral-900 bg-white text-neutral-900 transition hover:bg-neutral-900 hover:text-white"
            aria-pressed={wishlisted}
            aria-label={
              wishlisted
                ? `Убрать «${title}» из избранного`
                : `Добавить «${title}» в избранное`
            }
          >
            <Heart
              className="h-4 w-4"
              fill={wishlisted ? "currentColor" : "none"}
              strokeWidth={1.5}
            />
          </button>
        ) : null}

        {overlay === "plus" ? (
          <Link
            href={href}
            className="absolute bottom-3 right-3 z-10 flex h-9 w-9 items-center justify-center border border-neutral-900 bg-white text-neutral-900 transition hover:bg-neutral-900 hover:text-white"
            aria-label={`Открыть ${title}`}
          >
            <Plus className="h-4 w-4" strokeWidth={2} />
          </Link>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col border-t border-neutral-900 px-3 py-3 sm:px-4 sm:py-3.5">
        {showMeta ? (
          <div className="mb-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] font-medium uppercase tracking-[0.18em] text-neutral-500">
            {categoryLine ? <span>{categoryLine}</span> : null}
            {colorHex ? (
              <span className="inline-flex items-center gap-1.5">
                <span
                  className="h-3 w-3 shrink-0 border border-neutral-900"
                  style={{ backgroundColor: colorHex }}
                />
                {(restColorCount ?? 0) > 0 ? (
                  <span className="font-normal tracking-normal text-neutral-400">
                    +{restColorCount}
                  </span>
                ) : null}
              </span>
            ) : null}
          </div>
        ) : null}

        <div className="mt-auto flex items-start justify-between gap-3">
          <Link
            href={href}
            className="min-w-0 flex-1 text-[13px] font-semibold leading-snug tracking-tight text-neutral-900"
          >
            {title}
          </Link>
          <ProductPriceKzt
            className="shrink-0 justify-end text-right"
            price={price}
            listPrice={listPrice}
            currentPriceClassName="text-[13px] font-semibold tabular-nums text-neutral-900"
            comparePriceClassName="text-[11px] text-neutral-400"
          />
        </div>
      </div>
    </article>
  )
}
