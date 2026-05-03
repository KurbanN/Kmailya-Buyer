"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
} from "firebase/auth"
import { doc, serverTimestamp, setDoc } from "firebase/firestore"

import { getClientAuth, getClientDb } from "@/lib/firebase-client"
import { mapFirebaseClientError } from "@/lib/firebase-auth-errors"
import { ensureUserProfile } from "@/lib/firebase-user"
import { StoreHeader } from "@/components/store-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const inputClass =
  "h-12 rounded-none border border-neutral-200 bg-neutral-100/90 px-3 text-sm placeholder:text-neutral-400 focus-visible:border-neutral-400 focus-visible:ring-1 focus-visible:ring-neutral-400"

export default function RegisterPage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [googlePending, setGooglePending] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setPending(true)
    try {
      const auth = getClientAuth()
      const db = getClientDb()
      const credential = await createUserWithEmailAndPassword(
        auth,
        email.trim().toLowerCase(),
        password,
      )
      const safeName = name.trim()
      if (safeName) {
        await updateProfile(credential.user, { displayName: safeName })
      }
      await setDoc(doc(db, "users", credential.user.uid), {
        email: credential.user.email,
        name: safeName || null,
        role: "customer",
        createdAt: serverTimestamp(),
      })
    } catch (err) {
      setError(mapFirebaseClientError(err))
      setPending(false)
      return
    }
    setPending(false)
    router.push("/login?registered=1")
    router.refresh()
  }

  async function onGoogleRegister() {
    setError(null)
    setGooglePending(true)
    try {
      const auth = getClientAuth()
      const provider = new GoogleAuthProvider()
      provider.setCustomParameters({ prompt: "select_account" })
      const credential = await signInWithPopup(auth, provider)
      await ensureUserProfile(credential.user)
      router.push("/account")
      router.refresh()
    } catch (err) {
      setError(mapFirebaseClientError(err))
    } finally {
      setGooglePending(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f2f2f2] text-neutral-900 antialiased">
      <StoreHeader />
      <main className="mx-auto max-w-md px-4 py-16 sm:px-6">
        <h1
          className="text-center text-[clamp(1.25rem,3vw,1.5rem)] font-bold uppercase tracking-[0.12em] text-neutral-950"
          style={{ fontFamily: "var(--font-display), sans-serif" }}
        >
          Регистрация
        </h1>
        <p className="mt-2 text-center text-[13px] text-neutral-600">
          Уже есть аккаунт?{" "}
          <Link href="/login" className="font-medium text-neutral-900 underline-offset-2 hover:underline">
            Войти
          </Link>
        </p>
        <form onSubmit={onSubmit} className="mt-10 space-y-5">
          {error ? (
            <p className="text-center text-[12px] text-red-600" role="alert">
              {error}
            </p>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="reg-name">Имя (необязательно)</Label>
            <Input
              id="reg-name"
              name="name"
              type="text"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClass}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="reg-email">Электронная почта</Label>
            <Input
              id="reg-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="reg-password">Пароль (минимум 8 символов)</Label>
            <Input
              id="reg-password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
            />
          </div>
          <Button
            type="submit"
            disabled={pending}
            className="h-12 w-full rounded-none border-0 bg-neutral-900 text-[11px] font-medium uppercase tracking-[0.22em] text-white hover:bg-neutral-800 disabled:opacity-60"
          >
            {pending ? "Создание…" : "Создать аккаунт"}
          </Button>
        </form>
        <p className="mt-8 text-center text-[10px] uppercase tracking-[0.16em] text-neutral-400">или</p>
        <Button
          type="button"
          variant="outline"
          disabled={googlePending || pending}
          onClick={onGoogleRegister}
          className="mt-3 h-12 w-full rounded-none border-neutral-400 bg-transparent text-[11px] uppercase tracking-[0.18em] text-neutral-900 hover:bg-neutral-100"
        >
          <img
            src="https://www.citypng.com/public/uploads/preview/google-logo-icon-gsuite-hd-701751694791470gzbayltphh.png"
            alt=""
            className="h-4 w-4 object-contain"
            loading="lazy"
          />
          {googlePending ? "Подключение Google…" : "Продолжить с Google"}
        </Button>
      </main>
    </div>
  )
}
