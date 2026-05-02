"use client"

import { useEffect, useState } from "react"

import { useAuth } from "@/components/auth-provider"

export default function AdminPromocodesPage() {
  const { user } = useAuth()
  const [items, setItems] = useState<any[]>([])
  const [form, setForm] = useState({
    code: "",
    type: "percent",
    value: "10",
    startAt: new Date().toISOString(),
    endAt: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
    minOrderAmount: "0",
    maxUses: "100",
    isActive: true,
  })

  async function headers(withJson = false) {
    const token = await user?.getIdToken(true)
    return withJson
      ? { "Content-Type": "application/json", Authorization: `Bearer ${token ?? ""}` }
      : { Authorization: `Bearer ${token ?? ""}` }
  }

  async function load() {
    if (!user) return
    const res = await fetch("/api/admin/promocodes", { headers: await headers() })
    const json = await res.json()
    if (res.ok) setItems(json.items ?? [])
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  async function createPromo(e: React.FormEvent) {
    e.preventDefault()
    const payload = {
      ...form,
      value: Number(form.value),
      minOrderAmount: Number(form.minOrderAmount),
      maxUses: Number(form.maxUses),
      usedCount: 0,
    }
    const res = await fetch("/api/admin/promocodes", {
      method: "POST",
      headers: await headers(true),
      body: JSON.stringify(payload),
    })
    if (res.ok) await load()
  }

  async function deactivate(code: string) {
    if (!window.confirm(`Отключить промокод ${code}?`)) return
    const res = await fetch(`/api/admin/promocodes/${code}`, {
      method: "DELETE",
      headers: await headers(),
    })
    if (res.ok) await load()
  }

  return (
    <div className="space-y-6">
      <section className="border border-neutral-200 bg-white p-6">
        <h1 className="text-xl font-semibold uppercase tracking-[0.08em]">Промокоды</h1>
        <form onSubmit={createPromo} className="mt-4 grid gap-3 md:grid-cols-3">
          <input className="h-10 border border-neutral-300 px-3 text-sm" placeholder="Код" value={form.code} onChange={(e) => setForm((v) => ({ ...v, code: e.target.value }))} />
          <select className="h-10 border border-neutral-300 px-3 text-sm" value={form.type} onChange={(e) => setForm((v) => ({ ...v, type: e.target.value }))}>
            <option value="percent">процент</option>
            <option value="fixed">фикс. сумма</option>
          </select>
          <input className="h-10 border border-neutral-300 px-3 text-sm" placeholder="Значение" value={form.value} onChange={(e) => setForm((v) => ({ ...v, value: e.target.value }))} />
          <button className="h-10 border border-neutral-900 bg-neutral-900 px-4 text-[11px] uppercase tracking-[0.16em] text-white">
            Создать
          </button>
        </form>
      </section>
      <section className="border border-neutral-200 bg-white p-6">
        <ul className="space-y-2 text-sm">
          {items.map((promo) => (
            <li key={promo.code} className="flex items-center justify-between border border-neutral-200 p-3">
              <span>
                {promo.code} — {promo.type} {promo.value} ({promo.isActive ? "активен" : "неактивен"})
              </span>
              <button
                type="button"
                className="border border-red-300 px-2 py-1 text-[10px] uppercase tracking-[0.16em] text-red-700"
                onClick={() => void deactivate(promo.code)}
              >
                Отключить
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
