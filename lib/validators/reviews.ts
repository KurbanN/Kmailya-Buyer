import { z } from "zod"

export const reviewCreateSchema = z.object({
  productId: z.string().trim().min(1).max(120),
  authorName: z.string().trim().min(1).max(100),
  rating: z.coerce.number().int().min(1).max(5),
  text: z.string().trim().min(3).max(2000),
})
