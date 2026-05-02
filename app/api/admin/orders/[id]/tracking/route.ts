import { FieldValue } from "firebase-admin/firestore"
import { type NextRequest } from "next/server"

import { adminDb } from "@/lib/firebase-admin"
import { handleApiError, ok } from "@/lib/server/api/responses"
import { requireAdminAccess } from "@/lib/server/auth/admin-route"
import { updateOrderTrackingSchema } from "@/lib/validators/orders"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdminAccess(request, "orders", "update")
    const { id } = await params
    const body = updateOrderTrackingSchema.parse(await request.json())
    await adminDb.collection("orders").doc(id).set(
      {
        trackingNumber: body.trackingNumber,
        trackingCarrier: body.carrier ?? null,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    )
    return ok({ ok: true })
  } catch (err) {
    return handleApiError(err)
  }
}
