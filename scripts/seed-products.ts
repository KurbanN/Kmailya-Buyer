import { FieldValue } from "firebase-admin/firestore"

import { adminDb } from "@/lib/firebase-admin"
import { PRODUCTS } from "@/lib/products-data"

const dryRun = process.env.SEED_DRY_RUN === "1"

async function main() {
  let created = 0
  let updated = 0
  let skipped = 0

  for (const [id, product] of Object.entries(PRODUCTS)) {
    const sku = product.sku ?? id
    const existing = await adminDb
      .collection("products")
      .where("sku", "==", sku)
      .limit(1)
      .get()

    const payload = {
      title: product.title,
      description: product.description,
      sku,
      basePrice: Number(product.price?.replace?.("$", "") ?? 0),
      salePrice: null,
      audience: "unisex",
      status: "active",
      isEnabled: true,
      categoryId: product.category ?? "general",
      brandId: "default",
      coverImageUrl: product.gallery?.[0] ?? null,
      imageUrls: product.gallery ?? [],
      updatedAt: FieldValue.serverTimestamp(),
      source: "seed:products-data",
    }

    if (existing.empty) {
      created += 1
      if (!dryRun) {
        await adminDb.collection("products").doc(id).set({
          ...payload,
          createdAt: FieldValue.serverTimestamp(),
        })
      }
      continue
    }

    const doc = existing.docs[0]
    const old = doc.data()
    const same =
      old.title === payload.title &&
      old.sku === payload.sku &&
      old.basePrice === payload.basePrice

    if (same) {
      skipped += 1
      continue
    }

    updated += 1
    if (!dryRun) {
      await doc.ref.set(payload, { merge: true })
    }
  }

  console.log(
    JSON.stringify(
      {
        dryRun,
        created,
        updated,
        skipped,
      },
      null,
      2,
    ),
  )
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
