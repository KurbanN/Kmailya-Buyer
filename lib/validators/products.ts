import { z } from "zod"

import { productBaseFieldsSchema, productBaseSchema, productStatusSchema } from "@/lib/validators/domain"

const productCreateFieldsSchema = productBaseFieldsSchema.extend({
  coverImageUrl: z.string().url().nullable().optional(),
  imageUrls: z.array(z.string().url()).max(20).optional().default([]),
})

export const productCreateSchema = productCreateFieldsSchema.superRefine((data, ctx) => {
  const parsed = productBaseSchema.safeParse(data)
  if (!parsed.success) {
    parsed.error.issues.forEach((issue) => ctx.addIssue(issue))
  }
})

export const productUpdateSchema = productCreateFieldsSchema.partial().refine(
  (v) => Object.keys(v).length > 0,
  "No changes provided",
)

export const productStatusUpdateSchema = z.object({
  status: productStatusSchema,
  isEnabled: z.boolean().optional(),
})
