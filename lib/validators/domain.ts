import { z } from "zod"

import {
  AUDIENCES,
  ORDER_STATUSES,
  PRODUCT_STATUSES,
  USER_ROLES,
} from "@/lib/types/domain"
import { moneySchema, percentSchema, skuSchema } from "@/lib/validators/common"

/** Принимает полный ISO или дату `YYYY-MM-DD` (как в форме). */
function preprocessOptionalDiscountDate(val: unknown) {
  if (val === undefined) return undefined
  if (val === null || val === "") return null
  if (typeof val !== "string") return val
  const t = val.trim()
  if (!t) return null
  if (/^\d{4}-\d{2}-\d{2}$/.test(t)) return `${t}T00:00:00.000Z`
  return t
}

export const productStatusSchema = z.enum(PRODUCT_STATUSES)
export const audienceSchema = z.enum(AUDIENCES)
export const userRoleSchema = z.enum(USER_ROLES)
export const orderStatusSchema = z.enum(ORDER_STATUSES)

const sizesSchema = z
  .array(z.string().trim().min(1).max(12))
  .min(1)
  .max(24)

export const productBaseFieldsSchema = z.object({
  title: z.string().trim().min(2).max(160),
  description: z.string().trim().min(3).max(5000),
  categoryId: z.string().trim().min(1),
  brandId: z.string().trim().min(1),
  basePrice: moneySchema,
  salePrice: moneySchema.nullable().optional(),
  discountPercent: percentSchema.nullable().optional(),
  discountStartAt: z.preprocess(
    preprocessOptionalDiscountDate,
    z.union([z.null(), z.string().datetime()]).optional(),
  ),
  discountEndAt: z.preprocess(
    preprocessOptionalDiscountDate,
    z.union([z.null(), z.string().datetime()]).optional(),
  ),
  sku: skuSchema,
  material: z.string().trim().max(120).optional().default(""),
  season: z.string().trim().max(60).optional().default(""),
  audience: audienceSchema,
  status: productStatusSchema,
  isEnabled: z.boolean().default(true),
  /** Остаток в штуках (витрина «Осталось всего N шт.»). */
  stockCount: z.coerce.number().int().min(0).max(999999).optional().default(0),
  /** Доступные размеры на PDP и в фильтре каталога. */
  sizes: sizesSchema.optional().default(["S", "M", "L"]),
  /** Витрина: новинка / хит / без метки (фильтры «Новинки», «Хиты»). */
  merchandisingTag: z.enum(["none", "new", "hit"]).optional().default("none"),
  /** Порядок в сортировке «Рекомендуемые» на PLP (меньше — выше). */
  plpSortKey: z.coerce.number().int().min(0).max(9_999_999).optional().default(1000),
})

export const productBaseSchema = productBaseFieldsSchema.superRefine((data, ctx) => {
    if (
      typeof data.salePrice === "number" &&
      typeof data.basePrice === "number" &&
      data.salePrice > data.basePrice
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["salePrice"],
        message: "Sale price cannot exceed base price",
      })
    }
})
