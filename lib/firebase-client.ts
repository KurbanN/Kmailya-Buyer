"use client"

import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"
import { getStorage } from "firebase/storage"

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

let app: FirebaseApp | undefined

function requireConfig() {
  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    throw new Error(
      "Firebase client env vars are missing. Fill NEXT_PUBLIC_FIREBASE_* in .env.local.",
    )
  }
}

export function getFirebaseApp() {
  if (app) return app
  requireConfig()
  app = getApps().length ? getApp() : initializeApp(firebaseConfig)
  return app
}

export function getClientAuth() {
  return getAuth(getFirebaseApp())
}

export function getClientDb() {
  return getFirestore(getFirebaseApp())
}

export function getClientStorage() {
  return getStorage(getFirebaseApp())
}
