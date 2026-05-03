"use client"

import { useEffect, useState } from "react"

import { useAuth } from "@/components/auth-provider"

export default function AdminDashboardPage() {
  const { user } = useAuth()
  const [days, setDays] = useState(30)
  const [data, setData] = useState<any>(null)

  async function load() {
    if (!user) return
    const token = await user.getIdToken(true)
    const res = await fetch(`/api/admin/dashboard?days=${days}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const json = await res.json()
    if (res.ok) setData(json)
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, days])

  return (
    <div className="space-y-6">
      <section className="border border-neutral-200 bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-xl font-semibold uppercase tracking-[0.08em]">Панель</h1>
          <select
            className="h-10 border border-neutral-300 px-3 text-sm"
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
          >
            <option value={7}>Последние 7 дней</option>
            <option value={30}>Последние 30 дней</option>
            <option value={90}>Последние 90 дней</option>
          </select>
        </div>
        {!data ? (
          <p className="mt-3 text-sm text-neutral-500">Загрузка…</p>
        ) : (
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="border border-neutral-200 p-4">Товаров: {data.totalProducts}</div>
            <div className="border border-neutral-200 p-4">Заказов: {data.totalOrders}</div>
            <div className="border border-neutral-200 p-4">
              Выручка (₸): {typeof data.revenue === "number" ? Math.round(data.revenue).toLocaleString("ru-RU") : "0"}
            </div>
          </div>
        )}
      </section>
      {data ? (
        <section className="grid gap-6 lg:grid-cols-2">
          <div className="border border-neutral-200 bg-white p-6">
            <h2 className="text-sm font-semibold uppercase tracking-[0.16em]">Мало на складе</h2>
            <ul className="mt-3 space-y-1 text-sm">
              {(data.lowStock ?? []).map((v: any) => (
                <li key={v.id}>
                  {v.sku} - {v.stockQty}
                </li>
              ))}
            </ul>
          </div>
          <div className="border border-neutral-200 bg-white p-6">
            <h2 className="text-sm font-semibold uppercase tracking-[0.16em]">Топ товаров</h2>
            <ul className="mt-3 space-y-1 text-sm">
              {(data.topProducts ?? []).map((p: any) => (
                <li key={p.title}>
                  {p.title} - {p.qty}
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}
    </div>
  )
}
