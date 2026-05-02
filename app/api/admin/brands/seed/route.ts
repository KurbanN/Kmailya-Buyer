import { FieldValue } from "firebase-admin/firestore"
import { type NextRequest } from "next/server"

import { adminDb } from "@/lib/firebase-admin"
import { POPULAR_BRANDS } from "@/lib/popular-brands"
import { handleApiError, ok } from "@/lib/server/api/responses"
import { requireAdminAccess } from "@/lib/server/auth/admin-route"

const COLLECTION = "brands"

export async function POST(request: NextRequest) {
  try {
    const ctx = await requireAdminAccess(request, "brands", "create")

    const created: { id: string; slug: string }[] = []
    const skipped: string[] = []

    for (const { name, slug } of POPULAR_BRANDS) {
      const dup = await adminDb
        .collection(COLLECTION)
        .where("slug", "==", slug)
        .limit(1)
        .get()

      if (!dup.empty) {
        skipped.push(slug)
        continue
      }

      const ref = adminDb.collection(COLLECTION).doc()
      await ref.set({
        name,
        slug,
        isEnabled: true,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        createdBy: ctx.uid,
        updatedBy: ctx.uid,
      })
      created.push({ id: ref.id, slug })
    }

    return ok({ created, skipped })
  } catch (err) {
    return handleApiError(err)
  }
}
