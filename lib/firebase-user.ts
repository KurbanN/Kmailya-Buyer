"use client"

import type { User } from "firebase/auth"
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore"

import { getClientDb } from "@/lib/firebase-client"

export async function ensureUserProfile(user: User) {
  const db = getClientDb()
  const ref = doc(db, "users", user.uid)
  const snap = await getDoc(ref)
  if (snap.exists()) {
    await setDoc(
      ref,
      {
        email: user.email ?? null,
        name: user.displayName ?? null,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    )
    return
  }

  await setDoc(ref, {
    email: user.email ?? null,
    name: user.displayName ?? null,
    role: "USER",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}
