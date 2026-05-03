import { FieldValue } from "firebase-admin/firestore"
import { type NextRequest } from "next/server"

import { adminDb } from "@/lib/firebase-admin"
import { handleApiError, ok } from "@/lib/server/api/responses"
import { requireAdminAccess } from "@/lib/server/auth/admin-route"
import { paginationQuerySchema } from "@/lib/validators/admin-entities"
import { syncDefaultVariantsForProduct } from "@/lib/server/inventory/sync-default-variants"
import { productCreateSchema } from "@/lib/validators/products"

const COLLECTION = "products"

export async function GET(request: NextRequest) {
  try {
    await requireAdminAccess(request, "products", "read")
    const parsed = paginationQuerySchema.parse(
      Object.fromEntries(request.nextUrl.searchParams.entries()),
    )

    const snap = await adminDb
      .collection(COLLECTION)
      .orderBy("updatedAt", "desc")
      .limit(500)
      .get()
    let items = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }))

    if (parsed.q) {
      const q = parsed.q.toLowerCase()
      items = items.filter((item) =>
        [item.title, item.sku].some(
          (value) => typeof value === "string" && value.toLowerCase().includes(q),
        ),
      )
    }

    const start = (parsed.page - 1) * parsed.pageSize
    return ok({
      items: items.slice(start, start + parsed.pageSize),
      total: items.length,
      page: parsed.page,
      pageSize: parsed.pageSize,
    })
  } catch (err) {
    return handleApiError(err)
  }
}

export async function POST(request: NextRequest) {
  try {
    const ctx = await requireAdminAccess(request, "products", "create")
    const body = productCreateSchema.parse(await request.json())

    const ref = adminDb.collection(COLLECTION).doc()
    await ref.set({
      ...body,
      imageUrls: body.imageUrls ?? [],
      coverImageUrl: body.coverImageUrl ?? null,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      createdBy: ctx.uid,
      updatedBy: ctx.uid,
    })

    const variantSync = await syncDefaultVariantsForProduct({
      productId: ref.id,
      baseSku: body.sku,
      sizes: body.sizes ?? [],
      colors: body.colors,
      stockCount: body.stockCount ?? 0,
      actorUid: ctx.uid,
      mode: "initial",
    })

    return ok({ id: ref.id, variantsCreated: variantSync.created }, 201)
  } catch (err) {
    return handleApiError(err)
  }
}
