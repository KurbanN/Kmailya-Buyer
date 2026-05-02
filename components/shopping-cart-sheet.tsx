"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { ShoppingBag } from "lucide-react"

import { cartSubtotalKzt, useShop } from "@/components/shop-provider"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { formatKzt, kztFromPriceString } from "@/lib/currency"
import { getFreeShippingThresholdKzt } from "@/lib/site-config"
import type { ProductDetail } from "@/lib/products-data"
import { PRODUCTS } from "@/lib/products-data"

type Props = { children: React.ReactNode }

export function ShoppingCartSheet({ children }: Props) {
  const { cartLines, cartCount, removeFromCart, setLineQuantity } = useShop()
  const subtotal = cartSubtotalKzt(cartLines)
  const freeShipThreshold = getFreeShippingThresholdKzt()
  const untilFreeShip = Math.max(0, freeShipThreshold - subtotal)
  const freeShipProgress =
    freeShipThreshold <= 0 ? 100 : Math.min(100, Math.round((subtotal / freeShipThreshold) * 100))

  const [resolved, setResolved] = useState<Record<string, ProductDetail>>({})
  const idsKey = useMemo(
    () => [...new Set(cartLines.map((l) => l.productId))].sort().join(","),
    [cartLines],
  )

  useEffect(() => {
    const ids = [...new Set(cartLines.map((l) => l.productId))]
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
            Корзина
          </SheetTitle>
          <SheetDescription className="text-left text-[11px] uppercase tracking-[0.18em] text-neutral-500">
            {cartCount === 0 ? "Пока пусто" : `${cartCount} шт.`}
          </SheetDescription>
        </SheetHeader>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="flex min-h-0 flex-1 flex-col gap-0 overflow-y-auto px-6 py-6">
            {cartLines.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-6 py-16 text-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-400">
                  <ShoppingBag className="h-9 w-9" strokeWidth={1.25} />
                </div>
                <div className="space-y-2">
                  <p className="text-[13px] font-medium text-neutral-900">Корзина пуста</p>
                  <p className="max-w-[240px] text-[12px] leading-relaxed text-neutral-500">
                    Добавьте понравившиеся вещи — размер и цвет сохраняются для каждой позиции.
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
                {cartLines.map((line, index) => {
                  const p = resolved[line.productId] ?? PRODUCTS[line.productId]
                  const title = p?.title ?? line.title ?? "Товар"
                  const thumb = p?.gallery[0] ?? line.imageUrl ?? "/logo.png"
                  const unit = p
                    ? kztFromPriceString(p.price)
                    : (line.unitPriceKzt ?? 0)
                  const lineSum = unit * line.quantity
                  const pid = line.productId

                  return (
                    <li
                      key={`${line.productId}-${line.size}-${line.colorHex}-${index}`}
                      className="border-b border-neutral-200/90 bg-white py-5 first:pt-0 last:border-b-0"
                    >
                      <div className="flex gap-4">
                        <Link
                          href={`/product/${pid}`}
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
                            href={`/product/${pid}`}
                            className="text-[13px] font-semibold leading-snug text-neutral-950 hover:underline"
                          >
                            {title}
                          </Link>

                          <div className="mt-3 space-y-1.5 text-[10px] uppercase tracking-[0.14em] text-neutral-500">
                            <p>
                              <span className="text-neutral-400">Размер · </span>
                              {line.size}
                            </p>
                            <p className="flex items-center gap-2">
                              <span className="text-neutral-400">Цвет · </span>
                              <span
                                className="inline-block h-3 w-3 shrink-0 border border-neutral-300"
                                style={{ backgroundColor: line.colorHex }}
                              />
                            </p>
                          </div>

                          <p className="mt-3 text-[13px] tabular-nums text-neutral-900">
                            {formatKzt(lineSum)}
                            {line.quantity > 1 ? (
                              <span className="ml-1.5 text-[11px] font-normal text-neutral-500">
                                ({formatKzt(unit)} за шт.)
                              </span>
                            ) : null}
                          </p>

                          <div className="mt-4 flex flex-wrap items-center gap-3">
                            <span className="text-[10px] uppercase tracking-[0.12em] text-neutral-500">
                              Кол-во
                            </span>
                            <div className="inline-flex items-center border border-neutral-900">
                              <button
                                type="button"
                                className="flex h-8 w-8 items-center justify-center text-lg leading-none text-neutral-900 transition-colors hover:bg-neutral-100"
                                onClick={() => setLineQuantity(index, line.quantity - 1)}
                                aria-label="Уменьшить количество"
                              >
                                −
                              </button>
                              <span className="flex min-w-[2rem] justify-center text-[13px] tabular-nums">
                                {line.quantity}
                              </span>
                              <button
                                type="button"
                                className="flex h-8 w-8 items-center justify-center text-lg leading-none text-neutral-900 transition-colors hover:bg-neutral-100"
                                onClick={() => setLineQuantity(index, line.quantity + 1)}
                                aria-label="Увеличить количество"
                              >
                                +
                              </button>
                            </div>
                            <button
                              type="button"
                              className="ml-auto text-[10px] uppercase tracking-[0.16em] text-neutral-500 underline-offset-4 hover:text-neutral-900 hover:underline"
                              onClick={() => removeFromCart(index)}
                            >
                              Удалить
                            </button>
                          </div>
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>

          {cartLines.length > 0 ? (
            <div className="border-t border-neutral-200 bg-white px-6 py-6">
              <div className="flex items-baseline justify-between gap-4">
                <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-neutral-600">
                  Промежуточный итог
                </span>
                <span
                  className="text-lg font-semibold tabular-nums text-neutral-950"
                  style={{ fontFamily: "var(--font-display), sans-serif" }}
                >
                  {formatKzt(subtotal)}
                </span>
              </div>
              {subtotal > 0 && subtotal < freeShipThreshold ? (
                <div className="mt-4 space-y-2">
                  <p className="text-[11px] leading-snug text-neutral-600">
                    До бесплатной доставки осталось{" "}
                    <span className="font-medium text-neutral-900">{formatKzt(untilFreeShip)}</span>
                  </p>
                  <div className="h-1 w-full overflow-hidden rounded-full bg-neutral-200">
                    <div
                      className="h-full rounded-full bg-neutral-900 transition-[width]"
                      style={{ width: `${freeShipProgress}%` }}
                    />
                  </div>
                </div>
              ) : subtotal >= freeShipThreshold && freeShipThreshold > 0 ? (
                <p className="mt-4 text-[11px] font-medium text-neutral-900">
                  Бесплатная доставка применится при оформлении
                </p>
              ) : null}
              <p className="mt-2 text-[10px] uppercase tracking-[0.12em] text-neutral-400">
                Доставка и налоги — на шаге оформления заказа
              </p>
              <Button
                asChild
                className="mt-6 h-12 w-full rounded-none border-0 bg-neutral-900 text-[11px] font-medium uppercase tracking-[0.22em] text-white hover:bg-neutral-800"
              >
                <Link href="/checkout">Оформить заказ</Link>
              </Button>
              <Button
                asChild
                variant="ghost"
                className="mt-3 h-auto w-full rounded-none py-2 text-[10px] uppercase tracking-[0.18em] text-neutral-600 hover:bg-transparent hover:text-neutral-900"
              >
                <Link href="/products">Продолжить покупки</Link>
              </Button>
            </div>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  )
}
