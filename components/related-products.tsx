"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useState } from "react"

import { ProductPriceKzt } from "@/components/product-price-kzt"
import type { ProductDetail } from "@/lib/products-data"
import { publicAssetUrl, siteFetchUrl, withPublicAssetUrls } from "@/lib/public-asset-url"

type Props = {
  excludeProductId: string
}

export function RelatedProducts({ excludeProductId }: Props) {
  const [items, setItems] = useState<ProductDetail[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const res = await fetch(
          siteFetchUrl(
            `/api/products?exclude=${encodeURIComponent(excludeProductId)}&limit=8`,
          ),
        )
        const j = await res.json()
        if (!cancelled && res.ok && Array.isArray(j.items)) {
          setItems(
            j.items.slice(0, 8).map((p: ProductDetail) => withPublicAssetUrls(p)),
          )
        }
      } catch {
        if (!cancelled) setItems([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [excludeProductId])

  if (loading || items.length === 0) return null

  return (
    <section className="mx-auto mt-16 w-full max-w-[1320px] border-t border-neutral-200 px-4 pb-12 pt-12 sm:px-6">
      <h2 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-neutral-950">
        Вам может понравиться
      </h2>
      <ul className="mt-8 grid grid-cols-2 gap-x-5 gap-y-10 lg:grid-cols-4">
        {items.map((p) => (
          <li key={p.id}>
            <Link href={`/product/${p.id}`} className="group block">
              <div className="relative mb-3 aspect-[3/4] overflow-hidden border border-neutral-200 bg-neutral-100">
                <Image
                  src={p.gallery[0] ?? publicAssetUrl("/logo.png")}
                  alt=""
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                  sizes="(max-width: 1024px) 50vw, 25vw"
                />
              </div>
              <p className="text-[12px] font-semibold leading-snug text-neutral-950">{p.title}</p>
              <ProductPriceKzt
                className="mt-1"
                price={p.price}
                listPrice={p.listPrice}
                currentPriceClassName="text-[12px] font-medium tabular-nums text-neutral-900"
                comparePriceClassName="text-[11px] text-neutral-400"
              />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
