import { FieldValue } from "firebase-admin/firestore"
import { type NextRequest } from "next/server"

import { adminDb } from "@/lib/firebase-admin"
import {
  sendOrderPaidEmail,
  sendOrderShippedEmail,
} from "@/lib/server/email/transactional"
import { handleApiError, ok } from "@/lib/server/api/responses"
import { requireAdminAccess } from "@/lib/server/auth/admin-route"
import { updateOrderStatusSchema } from "@/lib/validators/orders"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const ctx = await requireAdminAccess(request, "orders", "status-change")
    const { id } = await params
    const body = updateOrderStatusSchema.parse(await request.json())
    const ref = adminDb.collection("orders").doc(id)
    const beforeSnap = await ref.get()
    const beforeData = beforeSnap.data()
    const prevStatus = typeof beforeData?.status === "string" ? beforeData.status : ""

    await ref.set(
      { status: body.status, updatedAt: FieldValue.serverTimestamp() },
      { merge: true },
    )
    await ref.collection("statusHistory").add({
      status: body.status,
      note: body.note ?? "",
      actorUid: ctx.uid,
      createdAt: FieldValue.serverTimestamp(),
    })

    const afterSnap = await ref.get()
    const d = afterSnap.data() ?? {}
    const email = typeof d.email === "string" ? d.email : ""
    const total = typeof d.total === "number" ? d.total : 0

    if (email) {
      if (body.status === "paid" && prevStatus !== "paid") {
        void sendOrderPaidEmail({
          to: email,
          orderId: id,
          totalKzt: Math.round(total),
        }).catch((err) => console.error("[email] paid failed", id, err))
      }
      if (body.status === "shipped" && prevStatus !== "shipped") {
        void sendOrderShippedEmail({
          to: email,
          orderId: id,
          trackingNumber: typeof d.trackingNumber === "string" ? d.trackingNumber : null,
          trackingCarrier: typeof d.trackingCarrier === "string" ? d.trackingCarrier : null,
        }).catch((err) => console.error("[email] shipped failed", id, err))
      }
    }

    return ok({ ok: true })
  } catch (err) {
    return handleApiError(err)
  }
}
