import { type NextRequest } from "next/server"

import { getAllProductsRepo } from "@/lib/product-repository"
import { handleApiError, ok } from "@/lib/server/api/responses"

export async function GET(request: NextRequest) {
  try {
    const products = await getAllProductsRepo()
    const idsParam = request.nextUrl.searchParams.get("ids")

    if (idsParam) {
      const wanted = new Set(idsParam.split(",").map((id) => id.trim()))
      return ok({ items: products.filter((p) => wanted.has(p.id)) })
    }

    const excludeRaw = request.nextUrl.searchParams.get("exclude")
    const excludeId =
      excludeRaw != null && excludeRaw.trim() !== "" ? excludeRaw.trim() : undefined
    const limitRaw = request.nextUrl.searchParams.get("limit")
    if (excludeId != null || limitRaw != null) {
      const limit = Math.min(48, Math.max(1, limitRaw ? Number(limitRaw) || 8 : 8))
      let list = products
      if (excludeId) list = list.filter((p) => p.id !== excludeId)
      return ok({ items: list.slice(0, limit) })
    }

    return ok({ items: products })
  } catch (err) {
    return handleApiError(err)
  }
}
