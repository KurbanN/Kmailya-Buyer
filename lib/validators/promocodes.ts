import { z } from "zod"

import { moneySchema, percentSchema } from "@/lib/validators/common"

export const promoCodeSchema = z.object({
  code: z
    .string()
    .trim()
    .min(3)
    .max(32)
    .regex(/^[A-Za-z0-9_-]+$/)
    .transform((v) => v.toUpperCase()),
  type: z.enum(["percent", "fixed"]),
  value: z.union([percentSchema, moneySchema]),
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
  minOrderAmount: moneySchema.default(0),
  maxUses: z.number().int().min(1).default(1),
  usedCount: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
})

export const promoCodeUpdateSchema = promoCodeSchema.partial().refine(
  (v) => Object.keys(v).length > 0,
  "No changes provided",
)
