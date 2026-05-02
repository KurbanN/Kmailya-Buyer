import { FieldValue } from "firebase-admin/firestore"
import { type NextRequest } from "next/server"

import { adminDb } from "@/lib/firebase-admin"
import { handleApiError, ok } from "@/lib/server/api/responses"
import { requireAdminAccess } from "@/lib/server/auth/admin-route"
import {
  categoryCreateSchema,
  paginationQuerySchema,
} from "@/lib/validators/admin-entities"

const COLLECTION = "categories"

export async function GET(request: NextRequest) {
  try {
    await requireAdminAccess(request, "categories", "read")
    const parsed = paginationQuerySchema.parse(
      Object.fromEntries(request.nextUrl.searchParams.entries()),
    )

    const snap = await adminDb
      .collection(COLLECTION)
      .orderBy("updatedAt", "desc")
      .limit(300)
      .get()

    let items = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
    if (parsed.q) {
      const q = parsed.q.toLowerCase()
      items = items.filter((item) =>
        [item.name, item.slug].some(
          (value) => typeof value === "string" && value.toLowerCase().includes(q),
        ),
      )
    }

    const start = (parsed.page - 1) * parsed.pageSize
    const paginated = items.slice(start, start + parsed.pageSize)

    return ok({
      items: paginated,
      page: parsed.page,
      pageSize: parsed.pageSize,
      total: items.length,
    })
  } catch (err) {
    return handleApiError(err)
  }
}

export async function POST(request: NextRequest) {
  try {
    const ctx = await requireAdminAccess(request, "categories", "create")
    const body = categoryCreateSchema.parse(await request.json())
    const ref = adminDb.collection(COLLECTION).doc()

    await ref.set({
      ...body,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      createdBy: ctx.uid,
      updatedBy: ctx.uid,
    })

    return ok({ id: ref.id }, 201)
  } catch (err) {
    return handleApiError(err)
  }
}
