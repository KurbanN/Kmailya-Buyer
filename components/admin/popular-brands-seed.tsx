"use client"

import { useState } from "react"

import { useAuth } from "@/components/auth-provider"

export function PopularBrandsSeed() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function run() {
    if (!user) return
    setLoading(true)
    setMessage(null)
    try {
      const token = await user.getIdToken(true)
      const res = await fetch("/api/admin/brands/seed", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error ?? "Не удалось добавить бренды")
      const created = (json.created as { id: string; slug: string }[])?.length ?? 0
      const skipped = (json.skipped as string[])?.length ?? 0
      setMessage(
        `Готово: добавлено ${created}, уже были в базе (пропущено) — ${skipped}.`,
      )
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Ошибка")
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="border border-neutral-200 bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-neutral-900">Популярные бренды</p>
          <p className="mt-1 text-xs text-neutral-500">
            Одним нажатием создать отсутствующие бренды (Nike, Adidas, Zara и др.). Дубликаты по
            slug не создаются.
          </p>
        </div>
        <button
          type="button"
          disabled={!user || loading}
          onClick={() => void run()}
          className="h-10 shrink-0 border border-neutral-900 bg-neutral-900 px-4 text-[11px] uppercase tracking-[0.14em] text-white disabled:opacity-50"
        >
          {loading ? "Добавление…" : "Добавить популярные"}
        </button>
      </div>
      {message ? <p className="mt-3 text-sm text-neutral-700">{message}</p> : null}
    </section>
  )
}
