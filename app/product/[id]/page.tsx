import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { ProductDetailView } from "@/components/product-detail-view"
import { getAllProductsRepo, getProductByIdRepo } from "@/lib/product-repository"
import { getSiteUrl } from "@/lib/site-config"

export async function generateStaticParams() {
  const products = await getAllProductsRepo()
  return products.map((p) => ({ id: p.id }))
}

async function resolveProductId(params: Promise<{ id: string }> | { id: string }) {
  const resolved =
    params != null ? await Promise.resolve(params) : ({} as { id?: unknown })
  const raw =
    typeof resolved === "object" && resolved !== null && "id" in resolved
      ? (resolved as { id: unknown }).id
      : undefined
  const rawId =
    typeof raw === "string"
      ? raw
      : Array.isArray(raw)
        ? raw[0]
        : raw != null
          ? String(raw)
          : undefined
  return rawId
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }> | { id: string }
}): Promise<Metadata> {
  const rawId = await resolveProductId(params)
  if (!rawId) return { title: "Товар — Kamilya" }
  const product = await getProductByIdRepo(rawId)
  if (!product) return { title: "Товар — Kamilya" }
  const title = `${product.title} — Kamilya`
  const description =
    product.description.replace(/\s+/g, " ").trim().slice(0, 155) ||
    `Купить «${product.title}» в интернет-магазине Kamilya.`
  const base = getSiteUrl()
  const imgPath = product.gallery[0]
  const ogImage =
    imgPath &&
    (imgPath.startsWith("http") ? imgPath : `${base}${imgPath.startsWith("/") ? "" : "/"}${imgPath}`)
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      images: ogImage ? [{ url: ogImage }] : [],
    },
  }
}

/**
 * `params` в Next.js 15 — Promise; в 14 — обычный объект.
 */
export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }> | { id: string }
}) {
  const rawId = await resolveProductId(params)
  if (!rawId) {
    notFound()
  }
  const product = await getProductByIdRepo(rawId)
  if (!product) {
    notFound()
  }
  return <ProductDetailView productId={rawId} initialProduct={product} />
}
