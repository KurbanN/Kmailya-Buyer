"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { Heart } from "lucide-react"

import { useShop } from "@/components/shop-provider"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { ProductPriceKzt } from "@/components/product-price-kzt"
import type { ProductDetail } from "@/lib/products-data"
import { PRODUCTS } from "@/lib/products-data"
import { cn } from "@/lib/utils"

type Props = { children: React.ReactNode }

export function WishlistSheet({ children }: Props) {
  const { wishlist, toggleWishlist } = useShop()
  const ids = wishlist
  const count = ids.length

  const [resolved, setResolved] = useState<Record<string, ProductDetail>>({})
  const idsKey = useMemo(() => [...ids].sort().join(","), [ids])

  useEffect(() => {
    if (ids.length === 0) {
      setResolved({})
      return
    }
    void fetch(`/api/products?ids=${ids.map(encodeURIComponent).join(",")}`)
      .then((r) => r.json())
      .then((j) => {
        if (!Array.isArray(j?.items)) return
        const m: Record<string, ProductDetail> = {}
        ;(j.items as ProductDetail[]).forEach((p) => {
          if (p?.id) m[p.id] = p
        })
        setResolved(m)
      })
      .catch(() => {})
  }, [idsKey])

  return (
    <Sheet>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent
        side="right"
        className="flex w-full flex-col border-l border-neutral-200 bg-[#fafafa] p-0 sm:max-w-[420px]"
      >
        <SheetHeader className="border-b border-neutral-200 bg-white px-6 pb-5 pt-6 pr-14">
          <SheetTitle
            className="text-left font-semibold uppercase tracking-[0.2em] text-neutral-950"
            style={{ fontFamily: "var(--font-display), sans-serif" }}
          >
            Избранное
          </SheetTitle>
          <SheetDescription className="text-left text-[11px] uppercase tracking-[0.18em] text-neutral-500">
            {count === 0 ? "Нет сохранённых товаров" : `${count} шт.`}
          </SheetDescription>
        </SheetHeader>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="flex min-h-0 flex-1 flex-col gap-0 overflow-y-auto px-6 py-6">
            {count === 0 ? (
              <div className="flex flex-col items-center justify-center gap-6 py-16 text-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-300">
                  <Heart className="h-9 w-9" strokeWidth={1.25} fill="none" />
                </div>
                <div className="space-y-2">
                  <p className="text-[13px] font-medium text-neutral-900">Пока ничего нет</p>
                  <p className="max-w-[260px] text-[12px] leading-relaxed text-neutral-500">
                    Нажмите сердечко на карточке товара, чтобы сохранить его сюда.
                  </p>
                </div>
                <Button
                  asChild
                  className="h-11 rounded-none border border-neutral-900 bg-neutral-900 px-8 text-[11px] font-medium uppercase tracking-[0.2em] text-white hover:bg-neutral-800"
                >
                  <Link href="/products">В каталог</Link>
                </Button>
              </div>
            ) : (
              <ul className="flex flex-col gap-0">
                {ids.map((id) => {
                  const p = resolved[id] ?? PRODUCTS[id]
                  const thumb = p?.gallery[0] ?? "/logo.png"
                  const title = p?.title ?? `Товар ${id}`
                  return (
                    <li
                      key={id}
                      className="border-b border-neutral-200/90 bg-white py-5 first:pt-0 last:border-b-0"
                    >
                      <div className="flex gap-4">
                        <Link
                          href={`/product/${id}`}
                          className="relative h-[112px] w-[88px] shrink-0 overflow-hidden border border-neutral-200 bg-neutral-100"
                        >
                          <Image
                            src={thumb}
                            alt=""
                            fill
                            className="object-cover"
                            sizes="88px"
                          />
                        </Link>
                        <div className="flex min-w-0 flex-1 flex-col">
                          <Link
                            href={`/product/${id}`}
                            className="text-[13px] font-semibold leading-snug text-neutral-950 hover:underline"
                          >
                            {title}
                          </Link>
                          {p ? (
                            <p className="mt-2 text-[13px]">
                              <ProductPriceKzt price={p.price} listPrice={p.listPrice} />
                            </p>
                          ) : (
                            <p className="mt-2 text-[12px] text-neutral-500">
                              Откройте карточку для цены
                            </p>
                          )}
                          <button
                            type="button"
                            className="mt-4 flex w-fit items-center gap-2 text-[10px] uppercase tracking-[0.16em] text-neutral-500 transition-colors hover:text-neutral-900"
                            onClick={() => toggleWishlist(id)}
                          >
                            <Heart
                              className="h-3.5 w-3.5 fill-neutral-950 text-neutral-950"
                              strokeWidth={1.25}
                              fill="currentColor"
                            />
                            Убрать
                          </button>
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

/** Иконка сердца для триггера в шапке: заливка, если есть избранное. */
export function WishlistNavTriggerIcon({
  active,
  className,
}: {
  active: boolean
  className?: string
}) {
  return (
    <Heart
      className={cn(
        "transition-colors",
        active ? "fill-neutral-950 text-neutral-950" : "text-neutral-800",
        className,
      )}
      fill={active ? "currentColor" : "none"}
      strokeWidth={1.5}
    />
  )
}
