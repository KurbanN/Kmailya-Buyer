import { z } from "zod"

import { moneySchema, skuSchema } from "@/lib/validators/common"

export const variantCreateSchema = z.object({
  sku: skuSchema,
  size: z.string().trim().min(1).max(24),
  colorName: z.string().trim().min(1).max(40),
  colorHex: z.string().trim().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, "Invalid hex color"),
  priceOverride: moneySchema.nullable().optional(),
  stockQty: z.number().int().min(0),
  reservedQty: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
})

export const variantUpdateSchema = variantCreateSchema.partial().refine(
  (v) => Object.keys(v).length > 0,
  "No changes provided",
)

export const inventoryAdjustSchema = z.object({
  delta: z.number().int().min(-100000).max(100000),
  reason: z.string().trim().min(3).max(140),
})
