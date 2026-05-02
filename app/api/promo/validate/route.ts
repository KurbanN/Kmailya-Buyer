import { type NextRequest } from "next/server"

import { handleApiError, ok } from "@/lib/server/api/responses"
import { validatePromoForMerchandiseKzt } from "@/lib/server/promo/apply-promo-kzt"
import { z } from "zod"

const bodySchema = z.object({
  code: z.string().trim().min(3).max(32),
  subtotalKzt: z.coerce.number().min(0),
})

export async function POST(request: NextRequest) {
  try {
    const body = bodySchema.parse(await request.json())
    const result = await validatePromoForMerchandiseKzt(body.code, Math.round(body.subtotalKzt))
    if (!result.ok) {
      return ok({ valid: false, error: result.error, discountKzt: 0 })
    }
    return ok({
      valid: true,
      discountKzt: result.discountKzt,
      code: result.code,
    })
  } catch (err) {
    return handleApiError(err)
  }
}
