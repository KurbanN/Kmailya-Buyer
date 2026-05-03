"use client"

import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useState } from "react"
import {
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth"

import { mapFirebaseClientError } from "@/lib/firebase-auth-errors"
import { getClientAuth } from "@/lib/firebase-client"
import { ensureUserProfile } from "@/lib/firebase-user"
import { StoreHeader } from "@/components/store-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const inputClass =
  "h-12 rounded-none border border-neutral-200 bg-neutral-100/90 px-3 text-sm placeholder:text-neutral-400 focus-visible:border-neutral-400 focus-visible:ring-1 focus-visible:ring-neutral-400"

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get("callbackUrl") ?? "/account"
  const registered = searchParams.get("registered") === "1"

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
      await signInWithEmailAndPassword(getClientAuth(), email.trim().toLowerCase(), password)
    } catch (err) {
      setError(mapFirebaseClientError(err))
      setPending(false)
      return
    }
    setPending(false)
    router.push(callbackUrl)
    router.refresh()
  }

  async function onGoogleSignIn() {
    setError(null)
    setGooglePending(true)
    try {
      const auth = getClientAuth()
      const provider = new GoogleAuthProvider()
      provider.setCustomParameters({ prompt: "select_account" })
      const credential = await signInWithPopup(auth, provider)
      await ensureUserProfile(credential.user)
      router.push(callbackUrl)
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
          Вход
        </h1>
        <p className="mt-2 text-center text-[13px] text-neutral-600">
          Впервые здесь?{" "}
          <Link href="/register" className="font-medium text-neutral-900 underline-offset-2 hover:underline">
            Создать аккаунт
          </Link>
        </p>
        {registered ? (
          <p className="mt-4 rounded-none border border-emerald-200 bg-emerald-50 px-3 py-2 text-center text-[12px] text-emerald-900">
            Аккаунт создан. Теперь можно войти.
          </p>
        ) : null}
        <form onSubmit={onSubmit} className="mt-10 space-y-5">
          {error ? (
            <p className="text-center text-[12px] text-red-600" role="alert">
              {error}
            </p>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="login-email">Электронная почта</Label>
            <Input
              id="login-email"
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
            <Label htmlFor="login-password">Пароль</Label>
            <Input
              id="login-password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
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
            {pending ? "Вход…" : "Войти"}
          </Button>
        </form>
        <p className="mt-8 text-center text-[10px] uppercase tracking-[0.16em] text-neutral-400">или</p>
        <Button
          type="button"
          variant="outline"
          disabled={googlePending || pending}
          onClick={onGoogleSignIn}
          className="mt-3 h-12 w-full rounded-none border-neutral-400 bg-transparent text-[11px] uppercase tracking-[0.18em] text-neutral-900 hover:bg-neutral-100"
        >
          <img
            src="https://www.citypng.com/public/uploads/preview/google-logo-icon-gsuite-hd-701751694791470gzbayltphh.png"
            alt=""
            className="h-4 w-4 object-contain"
            loading="lazy"
          />
          {googlePending ? "Подключение Google…" : "Войти через Google"}
        </Button>
      </main>
    </div>
  )
}
