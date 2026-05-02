import { cert, getApps, initializeApp } from "firebase-admin/app"
import type { App } from "firebase-admin/app"
import { getAuth } from "firebase-admin/auth"
import type { Auth } from "firebase-admin/auth"
import { getFirestore } from "firebase-admin/firestore"
import type { Firestore } from "firebase-admin/firestore"

const hasServiceAccount =
  typeof process.env.FIREBASE_PROJECT_ID === "string" &&
  process.env.FIREBASE_PROJECT_ID.length > 0 &&
  typeof process.env.FIREBASE_CLIENT_EMAIL === "string" &&
  process.env.FIREBASE_CLIENT_EMAIL.length > 0 &&
  typeof process.env.FIREBASE_PRIVATE_KEY === "string" &&
  process.env.FIREBASE_PRIVATE_KEY.length > 0

function initAdmin(): App | null {
  if (!hasServiceAccount) return null
  try {
    return (
      getApps()[0] ??
      initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, "\n"),
        }),
      })
    )
  } catch {
    return null
  }
}

const app = initAdmin()

function proxyDb(real: Firestore | null): Firestore {
  return new Proxy({} as Firestore, {
    get(_target, prop, receiver) {
      if (!real) {
        if (prop === "then") return undefined
        throw new Error("Firebase Admin is not configured (set FIREBASE_* env vars)")
      }
      const value = Reflect.get(real as object, prop, receiver)
      return typeof value === "function" ? (value as (...a: unknown[]) => unknown).bind(real) : value
    },
  }) as Firestore
}

function proxyAuth(real: Auth | null): Auth {
  return new Proxy({} as Auth, {
    get(_target, prop, receiver) {
      if (!real) {
        if (prop === "then") return undefined
        throw new Error("Firebase Admin is not configured (set FIREBASE_* env vars)")
      }
      const value = Reflect.get(real as object, prop, receiver)
      return typeof value === "function" ? (value as (...a: unknown[]) => unknown).bind(real) : value
    },
  }) as Auth
}

const firestore = app ? getFirestore(app) : null
const auth = app ? getAuth(app) : null

export const adminAuth = proxyAuth(auth)
export const adminDb = proxyDb(firestore)
