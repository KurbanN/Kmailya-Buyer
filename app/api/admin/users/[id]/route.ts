import { type NextRequest } from "next/server"

import { adminDb } from "@/lib/firebase-admin"
import { handleApiError, ok } from "@/lib/server/api/responses"
import { requireAdminAccess } from "@/lib/server/auth/admin-route"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdminAccess(request, "users", "read")
    const { id } = await params
    const [userSnap, ordersSnap] = await Promise.all([
      adminDb.collection("users").doc(id).get(),
      adminDb.collection("orders").where("userId", "==", id).orderBy("createdAt", "desc").limit(30).get(),
    ])
    if (!userSnap.exists) return ok({ error: "User not found" }, 404)
    return ok({
      id: userSnap.id,
      ...userSnap.data(),
      orders: ordersSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
    })
  } catch (err) {
    return handleApiError(err)
  }
}
