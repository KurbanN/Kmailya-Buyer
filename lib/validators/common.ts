import { z } from "zod"

export const moneySchema = z
  .number({ invalid_type_error: "Must be a number" })
  .finite("Must be a finite number")
  .nonnegative("Must be >= 0")

export const percentSchema = z
  .number({ invalid_type_error: "Must be a number" })
  .min(0, "Must be >= 0")
  .max(99, "Must be <= 99")

export const skuSchema = z
  .string()
  .trim()
  .min(3, "SKU is too short")
  .max(64, "SKU is too long")
  .regex(/^[A-Za-z0-9._-]+$/, "SKU contains invalid characters")

export const idSchema = z.string().trim().min(1, "Id is required")
