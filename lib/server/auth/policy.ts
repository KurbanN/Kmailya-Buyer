import type { UserRole } from "@/lib/types/domain"
import { ApiError } from "@/lib/server/api/errors"

export type PolicyResource =
  | "dashboard"
  | "products"
  | "categories"
  | "brands"
  | "inventory"
  | "orders"
  | "users"
  | "promocodes"

export type PolicyAction = "read" | "create" | "update" | "delete" | "status-change"

const matrix: Record<UserRole, Record<PolicyResource, PolicyAction[]>> = {
  admin: {
    dashboard: ["read"],
    products: ["read", "create", "update", "delete", "status-change"],
    categories: ["read", "create", "update", "delete"],
    brands: ["read", "create", "update", "delete"],
    inventory: ["read", "create", "update", "delete", "status-change"],
    orders: ["read", "create", "update", "delete", "status-change"],
    users: ["read", "create", "update", "delete", "status-change"],
    promocodes: ["read", "create", "update", "delete", "status-change"],
  },
  manager: {
    dashboard: ["read"],
    products: ["read", "create", "update", "status-change"],
    categories: ["read", "create", "update"],
    brands: ["read", "create", "update"],
    inventory: ["read", "update", "status-change"],
    orders: ["read", "update", "status-change"],
    users: ["read"],
    promocodes: ["read", "create", "update", "status-change"],
  },
  customer: {
    dashboard: [],
    products: [],
    categories: [],
    brands: [],
    inventory: [],
    orders: [],
    users: [],
    promocodes: [],
  },
}

export function can(
  role: UserRole,
  resource: PolicyResource,
  action: PolicyAction,
) {
  return matrix[role][resource].includes(action)
}

export function requirePolicy(
  role: UserRole,
  resource: PolicyResource,
  action: PolicyAction,
) {
  if (!can(role, resource, action)) {
    throw new ApiError(403, "Insufficient permissions", {
      role,
      resource,
      action,
    })
  }
}
