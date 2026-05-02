import { type NextRequest } from "next/server"

import { adminDb } from "@/lib/firebase-admin"
import { handleApiError, ok } from "@/lib/server/api/responses"
import { requireAdminAccess } from "@/lib/server/auth/admin-route"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdminAccess(request, "orders", "read")
    const { id } = await params
    const ref = adminDb.collection("orders").doc(id)
    const [orderSnap, itemsSnap, historySnap] = await Promise.all([
      ref.get(),
      ref.collection("items").get(),
      ref.collection("statusHistory").orderBy("createdAt", "asc").get(),
    ])
    if (!orderSnap.exists) return ok({ error: "Order not found" }, 404)
    return ok({
      id: orderSnap.id,
      ...orderSnap.data(),
      items: itemsSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
      statusHistory: historySnap.docs.map((d) => ({ id: d.id, ...d.data() })),
    })
  } catch (err) {
    return handleApiError(err)
  }
}
