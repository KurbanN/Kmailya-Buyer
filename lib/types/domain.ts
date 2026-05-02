export const PRODUCT_STATUSES = [
  "draft",
  "active",
  "archived",
  "out_of_stock",
] as const

export const AUDIENCES = ["men", "women", "kids", "unisex"] as const

export const USER_ROLES = ["admin", "manager", "customer"] as const

export const ORDER_STATUSES = [
  "pending",
  "paid",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
] as const

export type ProductStatus = (typeof PRODUCT_STATUSES)[number]
export type Audience = (typeof AUDIENCES)[number]
export type UserRole = (typeof USER_ROLES)[number]
export type OrderStatus = (typeof ORDER_STATUSES)[number]
