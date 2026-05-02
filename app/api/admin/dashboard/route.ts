import { type NextRequest } from "next/server"

import { adminDb } from "@/lib/firebase-admin"
import { handleApiError, ok } from "@/lib/server/api/responses"
import { requireAdminAccess } from "@/lib/server/auth/admin-route"

export async function GET(request: NextRequest) {
  try {
    await requireAdminAccess(request, "dashboard", "read")
    const period = Number(request.nextUrl.searchParams.get("days") ?? "30")
    const since = Date.now() - period * 24 * 3600 * 1000

    const [productsSnap, ordersSnap, variantsSnap] = await Promise.all([
      adminDb.collection("products").get(),
      adminDb.collection("orders").orderBy("createdAt", "desc").limit(400).get(),
      adminDb.collection("productVariants").where("stockQty", "<=", 5).limit(50).get(),
    ])

    const orders = ordersSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
    const recentOrders = orders.filter((o) => {
      const ms = o.createdAt?.toMillis?.()
      return typeof ms === "number" ? ms >= since : true
    })
    const revenue = recentOrders.reduce(
      (sum, o) => sum + (typeof o.total === "number" ? o.total : 0),
      0,
    )

    const topProductsMap = new Map<string, number>()
    for (const order of recentOrders) {
      const itemsSnap = await adminDb.collection("orders").doc(order.id).collection("items").get()
      itemsSnap.docs.forEach((itemDoc) => {
        const item = itemDoc.data()
        const key = typeof item.title === "string" ? item.title : item.productId
        topProductsMap.set(
          key,
          (topProductsMap.get(key) ?? 0) + (typeof item.quantity === "number" ? item.quantity : 0),
        )
      })
    }
    const topProducts = [...topProductsMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([title, qty]) => ({ title, qty }))

    return ok({
      totalProducts: productsSnap.size,
      totalOrders: recentOrders.length,
      revenue,
      lowStock: variantsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
      latestOrders: orders.slice(0, 10),
      topProducts,
    })
  } catch (err) {
    return handleApiError(err)
  }
}
