import { Suspense } from "react"

import { LoginForm } from "@/components/login-form"

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#f2f2f2] text-neutral-900">
          <div className="mx-auto max-w-md px-4 py-16 text-center text-sm text-neutral-500 sm:px-6">
            Загрузка…
          </div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  )
}
