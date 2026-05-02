"use client"

import { useEffect, useState } from "react"

import { useAuth } from "@/components/auth-provider"

type Order = { id: string; email: string; status: string; total: number }

export default function AdminOrdersPage() {
  const { user } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [selected, setSelected] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  async function headers(withJson = false) {
    const token = await user?.getIdToken(true)
    return withJson
      ? { "Content-Type": "application/json", Authorization: `Bearer ${token ?? ""}` }
      : { Authorization: `Bearer ${token ?? ""}` }
  }

  async function loadOrders() {
    if (!user) return
    const res = await fetch("/api/admin/orders", { headers: await headers() })
    const json = await res.json()
    if (!res.ok) {
      setError(json?.error ?? "Не удалось загрузить заказы")
      return
    }
    setOrders(json.items ?? [])
  }

  async function openOrder(id: string) {
    const res = await fetch(`/api/admin/orders/${id}`, { headers: await headers() })
    const json = await res.json()
    if (res.ok) setSelected(json)
  }

  useEffect(() => {
    void loadOrders()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
      <section className="border border-neutral-200 bg-white p-6">
        <h1 className="text-xl font-semibold uppercase tracking-[0.08em]">Заказы</h1>
        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
        <ul className="mt-4 space-y-2">
          {orders.map((o) => (
            <li key={o.id} className="flex items-center justify-between border border-neutral-200 p-3">
              <div>
                <p className="text-sm">{o.email}</p>
                <p className="text-xs text-neutral-500">
                  {o.status} - ${o.total ?? 0}
                </p>
              </div>
              <button
                type="button"
                className="border border-neutral-300 px-2 py-1 text-[10px] uppercase tracking-[0.16em]"
                onClick={() => void openOrder(o.id)}
              >
                Открыть
              </button>
            </li>
          ))}
        </ul>
      </section>
      <section className="border border-neutral-200 bg-white p-6">
        <h2 className="text-sm font-semibold uppercase tracking-[0.16em]">Детали заказа</h2>
        {!selected ? <p className="mt-3 text-sm text-neutral-500">Выберите заказ.</p> : null}
        {selected ? (
          <div className="mt-3 space-y-4 text-sm">
            <p>
              {selected.firstName} {selected.lastName} - {selected.email}
            </p>
            <p>{selected.shippingAddress?.address}</p>
            <div>
              <p className="text-xs uppercase tracking-[0.14em] text-neutral-500">История статусов</p>
              <ul className="mt-2 space-y-1">
                {(selected.statusHistory ?? []).map((s: any) => (
                  <li key={s.id}>
                    {s.status} {s.note ? `- ${s.note}` : ""}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  )
}
