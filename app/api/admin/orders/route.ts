import { type NextRequest } from "next/server"

import { adminDb } from "@/lib/firebase-admin"
import { handleApiError, ok } from "@/lib/server/api/responses"
import { requireAdminAccess } from "@/lib/server/auth/admin-route"

export async function GET(request: NextRequest) {
  try {
    await requireAdminAccess(request, "orders", "read")
    const q = request.nextUrl.searchParams.get("q")?.toLowerCase() ?? ""
    const snap = await adminDb.collection("orders").orderBy("createdAt", "desc").limit(200).get()
    let items = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
    if (q) {
      items = items.filter((item) =>
        [item.email, item.status, item.trackingNumber].some(
          (v) => typeof v === "string" && v.toLowerCase().includes(q),
        ),
      )
    }
    return ok({ items })
  } catch (err) {
    return handleApiError(err)
  }
}
