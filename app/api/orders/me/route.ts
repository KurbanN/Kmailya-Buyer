import { type NextRequest } from "next/server"

import { adminDb } from "@/lib/firebase-admin"
import { handleApiError, ok } from "@/lib/server/api/responses"
import { verifyFirebaseToken } from "@/lib/server/auth/verify"

export async function GET(request: NextRequest) {
  try {
    const ctx = await verifyFirebaseToken(request)
    const snap = await adminDb
      .collection("orders")
      .where("userId", "==", ctx.uid)
      .orderBy("createdAt", "desc")
      .limit(50)
      .get()

    const items = snap.docs.map((doc) => {
      const d = doc.data()
      let createdAt: string | null = null
      const ca = d.createdAt
      if (ca && typeof ca === "object" && "toDate" in ca && typeof (ca as { toDate: () => Date }).toDate === "function") {
        createdAt = (ca as { toDate: () => Date }).toDate().toISOString()
      } else if (typeof ca === "string") {
        createdAt = ca
      }
      return {
        id: doc.id,
        status: typeof d.status === "string" ? d.status : "pending",
        total: typeof d.total === "number" ? d.total : 0,
        subtotal: typeof d.subtotal === "number" ? d.subtotal : 0,
        shippingFee: typeof d.shippingFee === "number" ? d.shippingFee : 0,
        createdAt,
        email: typeof d.email === "string" ? d.email : undefined,
      }
    })
    return ok({ items })
  } catch (err) {
    return handleApiError(err)
  }
}
