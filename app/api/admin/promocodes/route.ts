import { FieldValue } from "firebase-admin/firestore"
import { type NextRequest } from "next/server"

import { adminDb } from "@/lib/firebase-admin"
import { handleApiError, ok } from "@/lib/server/api/responses"
import { requireAdminAccess } from "@/lib/server/auth/admin-route"
import { promoCodeSchema } from "@/lib/validators/promocodes"

export async function GET(request: NextRequest) {
  try {
    await requireAdminAccess(request, "promocodes", "read")
    const snap = await adminDb.collection("promocodes").orderBy("updatedAt", "desc").limit(200).get()
    return ok({ items: snap.docs.map((doc) => ({ code: doc.id, ...doc.data() })) })
  } catch (err) {
    return handleApiError(err)
  }
}

export async function POST(request: NextRequest) {
  try {
    const ctx = await requireAdminAccess(request, "promocodes", "create")
    const body = promoCodeSchema.parse(await request.json())
    const code = body.code.toUpperCase()
    await adminDb.collection("promocodes").doc(code).set({
      ...body,
      code,
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: ctx.uid,
      createdAt: FieldValue.serverTimestamp(),
      createdBy: ctx.uid,
    })
    return ok({ code }, 201)
  } catch (err) {
    return handleApiError(err)
  }
}
