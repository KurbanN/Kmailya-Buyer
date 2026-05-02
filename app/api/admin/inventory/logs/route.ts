import { type NextRequest } from "next/server"

import { adminDb } from "@/lib/firebase-admin"
import { handleApiError, ok } from "@/lib/server/api/responses"
import { requireAdminAccess } from "@/lib/server/auth/admin-route"

export async function GET(request: NextRequest) {
  try {
    await requireAdminAccess(request, "inventory", "read")
    const limit = Number(request.nextUrl.searchParams.get("limit") ?? "100")
    const snap = await adminDb
      .collection("inventoryLogs")
      .orderBy("createdAt", "desc")
      .limit(Math.min(Math.max(limit, 1), 300))
      .get()
    return ok({ items: snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })) })
  } catch (err) {
    return handleApiError(err)
  }
}
