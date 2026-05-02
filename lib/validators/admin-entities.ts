import { z } from "zod"

import { idSchema } from "@/lib/validators/common"

export const paginationQuerySchema = z.object({
  q: z.string().trim().optional().default(""),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(20),
  sortBy: z.string().trim().optional().default("updatedAt"),
  sortDir: z.enum(["asc", "desc"]).optional().default("desc"),
})

export const categoryCreateSchema = z.object({
  name: z.string().trim().min(2).max(80),
  slug: z.string().trim().min(2).max(120),
  isEnabled: z.boolean().default(true),
})

export const categoryUpdateSchema = categoryCreateSchema.partial().refine(
  (v) => Object.keys(v).length > 0,
  "No changes provided",
)

export const brandCreateSchema = z.object({
  name: z.string().trim().min(2).max(80),
  slug: z.string().trim().min(2).max(120),
  isEnabled: z.boolean().default(true),
})

export const brandUpdateSchema = brandCreateSchema.partial().refine(
  (v) => Object.keys(v).length > 0,
  "No changes provided",
)

export const idParamSchema = z.object({ id: idSchema })
