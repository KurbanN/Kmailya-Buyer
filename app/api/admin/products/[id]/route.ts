import { FieldValue } from "firebase-admin/firestore"
import { type NextRequest } from "next/server"

import { adminDb } from "@/lib/firebase-admin"
import { handleApiError, ok } from "@/lib/server/api/responses"
import { requireAdminAccess } from "@/lib/server/auth/admin-route"
import { syncDefaultVariantsForProduct } from "@/lib/server/inventory/sync-default-variants"
import { idParamSchema } from "@/lib/validators/admin-entities"
import { productUpdateSchema } from "@/lib/validators/products"

const COLLECTION = "products"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdminAccess(request, "products", "read")
    const { id } = idParamSchema.parse(await params)
    const snap = await adminDb.collection(COLLECTION).doc(id).get()
    if (!snap.exists) return ok({ error: "Product not found" }, 404)
    return ok({ id: snap.id, ...snap.data() })
  } catch (err) {
    return handleApiError(err)
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const ctx = await requireAdminAccess(request, "products", "update")
    const { id } = idParamSchema.parse(await params)
    const body = productUpdateSchema.parse(await request.json())

    await adminDb.collection(COLLECTION).doc(id).set(
      {
        ...body,
        updatedAt: FieldValue.serverTimestamp(),
        updatedBy: ctx.uid,
      },
      { merge: true },
    )

    const merged = await adminDb.collection(COLLECTION).doc(id).get()
    const d = merged.data() ?? {}
    await syncDefaultVariantsForProduct({
      productId: id,
      baseSku: typeof d.sku === "string" ? d.sku : "",
      sizes: Array.isArray(d.sizes) ? (d.sizes as string[]) : [],
      colors: d.colors,
      stockCount: typeof d.stockCount === "number" ? d.stockCount : 0,
      actorUid: ctx.uid,
      mode: "missing_only",
    })

    return ok({ ok: true })
  } catch (err) {
    return handleApiError(err)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdminAccess(request, "products", "delete")
    const { id } = idParamSchema.parse(await params)

    await adminDb.collection(COLLECTION).doc(id).set(
      {
        status: "archived",
        isEnabled: false,
        archivedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    )
    return ok({ ok: true })
  } catch (err) {
    return handleApiError(err)
  }
}
