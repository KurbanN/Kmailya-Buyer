"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { signOut } from "firebase/auth"
import { useEffect } from "react"

import { useAuth } from "@/components/auth-provider"
import { cn } from "@/lib/utils"
import { getClientAuth } from "@/lib/firebase-client"

const navItems = [
  { href: "/admin", label: "Панель" },
  { href: "/admin/products", label: "Товары" },
  { href: "/admin/categories", label: "Категории" },
  { href: "/admin/brands", label: "Бренды" },
  { href: "/admin/inventory", label: "Склад" },
  { href: "/admin/orders", label: "Заказы" },
  { href: "/admin/customers", label: "Покупатели" },
  { href: "/admin/promocodes", label: "Промокоды" },
]

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, profile, loading } = useAuth()
  const normalizedRole = (profile?.role ?? "USER").toLowerCase()

  useEffect(() => {
    if (loading) return
    if (!user) {
      router.replace("/login?callbackUrl=/admin")
      return
    }
    if (normalizedRole === "customer" || normalizedRole === "user") {
      router.replace("/account")
    }
  }, [loading, user, normalizedRole, router])

  if (loading || !user || normalizedRole === "customer" || normalizedRole === "user") {
    return (
      <div className="min-h-screen bg-neutral-100 px-4 py-10 text-sm text-neutral-500">
        Загрузка панели администратора…
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-100 text-neutral-900">
      <div className="mx-auto grid max-w-[1440px] grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="border-r border-neutral-200 bg-white">
          <div className="border-b border-neutral-200 px-6 py-5">
            <p className="text-[11px] uppercase tracking-[0.2em] text-neutral-500">Kamilya</p>
            <p className="mt-1 text-lg font-semibold uppercase tracking-[0.08em]">Админ</p>
          </div>
          <nav className="p-4">
            <ul className="space-y-1">
              {navItems.map((item) => {
                const active =
                  pathname === item.href ||
                  (item.href !== "/admin" && pathname.startsWith(item.href))
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "block rounded-none px-3 py-2 text-[12px] font-medium uppercase tracking-[0.16em] transition-colors",
                        active
                          ? "bg-neutral-900 text-white"
                          : "text-neutral-700 hover:bg-neutral-100",
                      )}
                    >
                      {item.label}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>
        </aside>
        <div className="min-w-0">
          <header className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 bg-white px-6 py-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.18em] text-neutral-500">
                Вошли как
              </p>
              <p className="text-sm text-neutral-900">{user.email ?? "неизвестно"}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="border border-neutral-300 px-2 py-1 text-[10px] uppercase tracking-[0.16em]">
                {normalizedRole}
              </span>
              <button
                type="button"
                onClick={async () => {
                  await signOut(getClientAuth())
                  router.push("/login")
                }}
                className="border border-neutral-300 px-3 py-2 text-[10px] uppercase tracking-[0.16em] hover:bg-neutral-100"
              >
                Выйти
              </button>
            </div>
          </header>
          <main className="p-6">{children}</main>
        </div>
      </div>
    </div>
  )
}
