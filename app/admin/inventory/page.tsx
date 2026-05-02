"use client"

import { useEffect, useState } from "react"

import { useAuth } from "@/components/auth-provider"

type Variant = {
  id: string
  sku: string
  size: string
  colorName: string
  stockQty: number
}

export default function AdminInventoryPage() {
  const { user } = useAuth()
  const [items, setItems] = useState<Variant[]>([])
  const [lowStock, setLowStock] = useState<Variant[]>([])
  const [q, setQ] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function headers(withJson = false) {
    const token = await user?.getIdToken(true)
    return withJson
      ? { "Content-Type": "application/json", Authorization: `Bearer ${token ?? ""}` }
      : { Authorization: `Bearer ${token ?? ""}` }
  }

  async function load() {
    if (!user) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/inventory?q=${encodeURIComponent(q)}`, {
        headers: await headers(),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error ?? "Не удалось загрузить склад")
      setItems(json.items ?? [])
      setLowStock(json.lowStock ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось загрузить склад")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, q])

  async function adjust(variantId: string) {
    const deltaRaw = window.prompt("Изменение остатка (+/- число):", "1")
    const reason = window.prompt("Причина:", "manual_adjustment")
    if (!deltaRaw || !reason) return
    const delta = Number(deltaRaw)
    if (Number.isNaN(delta)) return
    const res = await fetch(`/api/admin/inventory/variants/${variantId}`, {
      method: "PATCH",
      headers: await headers(true),
      body: JSON.stringify({ delta, reason }),
    })
    if (res.ok) await load()
  }

  return (
    <div className="space-y-6">
      <section className="border border-neutral-200 bg-white p-6">
        <h1 className="text-xl font-semibold uppercase tracking-[0.08em]">Склад</h1>
        <input
          className="mt-4 h-10 w-full max-w-sm border border-neutral-300 px-3 text-sm"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Поиск по SKU, размеру, цвету"
        />
        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
        {loading ? (
          <p className="mt-3 text-sm text-neutral-500">Загрузка…</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-neutral-200 text-left text-[11px] uppercase tracking-[0.16em] text-neutral-500">
                  <th className="py-2 pr-3">SKU</th>
                  <th className="py-2 pr-3">Размер</th>
                  <th className="py-2 pr-3">Цвет</th>
                  <th className="py-2 pr-3">Остаток</th>
                  <th className="py-2 pr-3">Действия</th>
                </tr>
              </thead>
              <tbody>
                {items.map((v) => (
                  <tr key={v.id} className="border-b border-neutral-100">
                    <td className="py-2 pr-3">{v.sku}</td>
                    <td className="py-2 pr-3">{v.size}</td>
                    <td className="py-2 pr-3">{v.colorName}</td>
                    <td className="py-2 pr-3">{v.stockQty}</td>
                    <td className="py-2 pr-3">
                      <button
                        type="button"
                        className="border border-neutral-300 px-2 py-1 text-[10px] uppercase tracking-[0.16em]"
                        onClick={() => void adjust(v.id)}
                      >
                        Корректировать
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="border border-amber-300 bg-amber-50 p-6">
        <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-amber-900">
          Мало на складе (≤ 5)
        </h2>
        <ul className="mt-3 space-y-1 text-sm text-amber-900">
          {lowStock.length === 0 ? <li>Всё в норме.</li> : null}
          {lowStock.map((v) => (
            <li key={`low-${v.id}`}>
              {v.sku} - {v.colorName}/{v.size}: {v.stockQty}
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
