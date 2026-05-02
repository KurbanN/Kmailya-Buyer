"use client"

import { format, parseISO } from "date-fns"
import { ru } from "date-fns/locale"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useState } from "react"
import { signOut } from "firebase/auth"

import { getClientAuth } from "@/lib/firebase-client"
import { useAuth } from "@/components/auth-provider"
import { StoreHeader } from "@/components/store-header"
import { formatKzt } from "@/lib/currency"

type OrderRow = {
  id: string
  status: string
  total: number
  createdAt: string | null
}

const ORDER_STATUS_RU: Record<string, string> = {
  pending: "Ожидает оплаты",
  paid: "Оплачен",
  processing: "В обработке",
  shipped: "Отправлен",
  delivered: "Доставлен",
  cancelled: "Отменён",
  refunded: "Возврат",
}

function formatOrderDate(iso: string | null): string {
  if (!iso) return "—"
  try {
    const d = parseISO(iso)
    if (Number.isNaN(d.getTime())) return iso
    return format(d, "d MMMM yyyy, HH:mm", { locale: ru })
  } catch {
    return iso
  }
}

export default function AccountPage() {
  const router = useRouter()
  const { user, profile, loading } = useAuth()
  const [orders, setOrders] = useState<OrderRow[]>([])
  const [ordersLoading, setOrdersLoading] = useState(true)
  const [ordersError, setOrdersError] = useState<string | null>(null)

  const loadOrders = useCallback(async () => {
    if (!user) return
    setOrdersLoading(true)
    setOrdersError(null)
    try {
      const token = await user.getIdToken(true)
      const res = await fetch("/api/orders/me", {
        headers: { Authorization: `Bearer ${token}` },
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error ?? "Не удалось загрузить заказы")
      setOrders(Array.isArray(json.items) ? json.items : [])
    } catch (e) {
      setOrdersError(e instanceof Error ? e.message : "Ошибка загрузки заказов")
      setOrders([])
    } finally {
      setOrdersLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login?callbackUrl=/account")
    }
  }, [loading, user, router])

  useEffect(() => {
    if (user) void loadOrders()
  }, [user, loadOrders])

  const displayName =
    profile?.name?.trim() ||
    user?.email?.split("@")[0] ||
    "Покупатель"
  const initial = displayName.charAt(0).toUpperCase() || "?"
  const isAdmin = profile?.role === "ADMIN"

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-[#f2f2f2] text-neutral-900 antialiased">
        <StoreHeader />
        <main className="mx-auto max-w-4xl px-4 py-16 text-center text-sm text-neutral-500 sm:px-6">
          Загрузка профиля…
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f2f2f2] text-neutral-900 antialiased">
      <StoreHeader />
      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-center gap-4">
            <div
              className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-neutral-200 bg-white text-2xl font-bold text-neutral-900"
              style={{ fontFamily: "var(--font-display), sans-serif" }}
              aria-hidden
            >
              {initial}
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-neutral-500">
                Личный кабинет
              </p>
              <h1
                className="mt-1 text-2xl font-bold uppercase tracking-[0.08em] text-neutral-950 sm:text-3xl"
                style={{ fontFamily: "var(--font-display), sans-serif" }}
              >
                Здравствуйте, {displayName}
              </h1>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            {isAdmin ? (
              <Link
                href="/admin"
                className="inline-flex h-11 items-center border border-neutral-900 bg-white px-5 text-[11px] uppercase tracking-[0.16em] text-neutral-900 transition-colors hover:bg-neutral-100"
              >
                Админка
              </Link>
            ) : null}
            <Link
              href="/products"
              className="inline-flex h-11 items-center border border-neutral-900 bg-neutral-900 px-5 text-[11px] uppercase tracking-[0.16em] text-white transition-colors hover:bg-neutral-800"
            >
              В каталог
            </Link>
            <button
              type="button"
              className="inline-flex h-11 items-center border border-neutral-300 bg-white px-5 text-[11px] uppercase tracking-[0.16em] text-neutral-900 transition-colors hover:bg-neutral-100"
              onClick={async () => {
                await signOut(getClientAuth())
                router.push("/")
              }}
            >
              Выйти
            </button>
          </div>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
          <section className="border border-neutral-200 bg-white p-6 sm:p-8">
            <h2 className="text-[12px] font-bold uppercase tracking-[0.18em] text-neutral-950">
              Данные аккаунта
            </h2>
            <dl className="mt-6 space-y-4 text-[13px]">
              <div>
                <dt className="text-[10px] font-medium uppercase tracking-[0.2em] text-neutral-500">
                  Почта
                </dt>
                <dd className="mt-1 text-neutral-900">{user.email ?? "—"}</dd>
              </div>
              {profile?.name ? (
                <div>
                  <dt className="text-[10px] font-medium uppercase tracking-[0.2em] text-neutral-500">
                    Имя
                  </dt>
                  <dd className="mt-1 text-neutral-900">{profile.name}</dd>
                </div>
              ) : null}
              <div>
                <dt className="text-[10px] font-medium uppercase tracking-[0.2em] text-neutral-500">
                  Роль
                </dt>
                <dd className="mt-1 text-neutral-900">{profile?.role ?? "USER"}</dd>
              </div>
            </dl>
          </section>

          <section className="border border-neutral-200 bg-white p-6 sm:p-8">
            <h2 className="text-[12px] font-bold uppercase tracking-[0.18em] text-neutral-950">
              Быстрые действия
            </h2>
            <ul className="mt-6 space-y-3 text-[13px]">
              <li>
                <Link href="/products" className="text-neutral-800 underline-offset-4 hover:text-neutral-950 hover:underline">
                  Перейти в каталог
                </Link>
              </li>
              <li>
                <span className="text-neutral-600">
                  Корзина и избранное — в шапке сайта (иконки справа).
                </span>
              </li>
              <li>
                <Link href="/checkout" className="text-neutral-800 underline-offset-4 hover:text-neutral-950 hover:underline">
                  Оформить заказ
                </Link>
              </li>
            </ul>
          </section>
        </div>

        <section className="mt-6 border border-neutral-200 bg-white p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-[12px] font-bold uppercase tracking-[0.18em] text-neutral-950">
              Мои заказы
            </h2>
            <button
              type="button"
              onClick={() => void loadOrders()}
              className="text-[11px] uppercase tracking-[0.14em] text-neutral-600 hover:text-neutral-900"
            >
              Обновить
            </button>
          </div>
          {ordersError ? (
            <p className="mt-4 text-sm text-red-600">{ordersError}</p>
          ) : null}
          {ordersLoading ? (
            <p className="mt-6 text-sm text-neutral-500">Загрузка заказов…</p>
          ) : orders.length === 0 ? (
            <p className="mt-6 text-sm text-neutral-600">
              Пока нет заказов. Оформите покупку в{" "}
              <Link href="/checkout" className="underline-offset-4 hover:underline">
                корзине
              </Link>
              .
            </p>
          ) : (
            <div className="mt-6 overflow-x-auto">
              <table className="w-full min-w-[520px] border-collapse text-left text-[13px]">
                <thead>
                  <tr className="border-b border-neutral-200 text-[10px] uppercase tracking-[0.16em] text-neutral-500">
                    <th className="pb-3 pr-4 font-medium">Номер</th>
                    <th className="pb-3 pr-4 font-medium">Дата</th>
                    <th className="pb-3 pr-4 font-medium">Статус</th>
                    <th className="pb-3 text-right font-medium">Сумма</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o.id} className="border-b border-neutral-100">
                      <td className="py-3 pr-4 font-mono text-[12px] text-neutral-800">
                        <Link
                          href={`/account/orders/${o.id}`}
                          className="text-neutral-900 underline-offset-4 hover:underline"
                        >
                          {o.id.slice(0, 8)}…
                        </Link>
                      </td>
                      <td className="py-3 pr-4 text-neutral-700">{formatOrderDate(o.createdAt)}</td>
                      <td className="py-3 pr-4 text-neutral-900">
                        {ORDER_STATUS_RU[o.status] ?? o.status}
                      </td>
                      <td className="py-3 text-right tabular-nums font-medium text-neutral-950">
                        {formatKzt(Math.round(o.total))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p className="mt-6 text-[11px] text-neutral-500">
            Заказы привязаны к аккаунту после входа при оформлении. Гостевые заказы здесь не отображаются.
          </p>
        </section>
      </main>
    </div>
  )
}
