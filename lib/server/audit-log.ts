import { FieldValue } from "firebase-admin/firestore"

import { adminDb } from "@/lib/firebase-admin"

export async function writeAuditLog(input: {
  actorUid: string
  resource: string
  action: string
  meta?: Record<string, unknown>
}) {
  await adminDb.collection("auditLogs").add({
    actorUid: input.actorUid,
    resource: input.resource,
    action: input.action,
    meta: input.meta ?? {},
    createdAt: FieldValue.serverTimestamp(),
  })
}
