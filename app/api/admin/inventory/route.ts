import { type NextRequest } from "next/server"

import { adminDb } from "@/lib/firebase-admin"
import { handleApiError, ok } from "@/lib/server/api/responses"
import { requireAdminAccess } from "@/lib/server/auth/admin-route"

export async function GET(request: NextRequest) {
  try {
    await requireAdminAccess(request, "inventory", "read")
    const q = request.nextUrl.searchParams.get("q")?.toLowerCase() ?? ""
    const snap = await adminDb.collection("productVariants").orderBy("updatedAt", "desc").limit(500).get()
    let items = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
    if (q) {
      items = items.filter((v) =>
        [v.sku, v.colorName, v.size].some(
          (x) => typeof x === "string" && x.toLowerCase().includes(q),
        ),
      )
    }
    const lowStock = items.filter((v) => typeof v.stockQty === "number" && v.stockQty <= 5)
    return ok({ items, lowStock })
  } catch (err) {
    return handleApiError(err)
  }
}
