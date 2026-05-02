"use client"

import { useEffect, useMemo, useState } from "react"

import { useAuth } from "@/components/auth-provider"

type Row = {
  id: string
  name: string
  slug: string
  isEnabled?: boolean
}

type Props = {
  title: string
  endpoint: "categories" | "brands"
}

function formatApiValidation(json: { error?: string; details?: unknown }): string {
  const d = json.details as {
    fieldErrors?: Record<string, string[] | undefined>
    formErrors?: string[]
  } | undefined
  const parts: string[] = []
  if (d?.formErrors?.length) parts.push(...d.formErrors)
  if (d?.fieldErrors) {
    for (const [key, msgs] of Object.entries(d.fieldErrors)) {
      if (msgs?.length) parts.push(`${key}: ${msgs.join(", ")}`)
    }
  }
  if (parts.length) return `${json.error ?? "Ошибка валидации"} — ${parts.join("; ")}`
  return json.error ?? "Запрос не выполнен"
}

function normalizeSlug(raw: string) {
  return raw.trim().toLowerCase().replace(/\s+/g, "-")
}

export function EntityCrudPage({ title, endpoint }: Props) {
  const { user } = useAuth()
  const [rows, setRows] = useState<Row[]>([])
  const [q, setQ] = useState("")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc")
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [editing, setEditing] = useState<Row | null>(null)
  const [form, setForm] = useState({ name: "", slug: "", isEnabled: true })
  const pageSize = 10

  async function authHeaders() {
    const token = await user?.getIdToken(true)
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token ?? ""}`,
    }
  }

  async function load() {
    if (!user) return
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({
        q,
        page: String(page),
        pageSize: String(pageSize),
        sortDir,
      })
      const res = await fetch(`/api/admin/${endpoint}?${params.toString()}`, {
        headers: await authHeaders(),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error ?? "Не удалось загрузить")
      setRows(json.items ?? [])
      setTotal(json.total ?? 0)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось загрузить")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, q, page, sortDir])

  const maxPage = useMemo(
    () => Math.max(1, Math.ceil(total / pageSize)),
    [total],
  )

  async function onSave(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return
    const name = form.name.trim()
    const slug = normalizeSlug(form.slug)
    if (name.length < 2 || slug.length < 2) {
      setError("Название и slug — не менее 2 символов каждое.")
      return
    }
    const payload = { name, slug, isEnabled: form.isEnabled }
    setSaving(true)
    setError(null)
    setNotice(null)
    try {
      const method = editing ? "PATCH" : "POST"
      const url = editing
        ? `/api/admin/${endpoint}/${editing.id}`
        : `/api/admin/${endpoint}`
      const res = await fetch(url, {
        method,
        headers: await authHeaders(),
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(formatApiValidation(json))
      setNotice(editing ? "Сохранено" : "Создано")
      setEditing(null)
      setForm({ name: "", slug: "", isEnabled: true })
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось сохранить")
    } finally {
      setSaving(false)
    }
  }

  async function onDelete(row: Row) {
    if (!user) return
    const confirmed = window.confirm(`Удалить «${row.name}»? Действие необратимо.`)
    if (!confirmed) return
    setError(null)
    setNotice(null)
    try {
      const res = await fetch(`/api/admin/${endpoint}/${row.id}`, {
        method: "DELETE",
        headers: await authHeaders(),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error ?? "Не удалось удалить")
      setNotice("Удалено")
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось удалить")
    }
  }

  return (
    <div className="space-y-6">
      <section className="border border-neutral-200 bg-white p-6">
        <h1 className="text-xl font-semibold uppercase tracking-[0.08em]">{title}</h1>
        <form onSubmit={onSave} className="mt-4 grid gap-3 md:grid-cols-4">
          <input
            className="h-10 border border-neutral-300 px-3 text-sm"
            placeholder="Название (мин. 2 символа)"
            value={form.name}
            minLength={2}
            maxLength={80}
            onChange={(e) => setForm((v) => ({ ...v, name: e.target.value }))}
            required
          />
          <input
            className="h-10 border border-neutral-300 px-3 text-sm"
            placeholder="Slug (мин. 2, напр. nike-line)"
            value={form.slug}
            minLength={2}
            maxLength={120}
            onChange={(e) => setForm((v) => ({ ...v, slug: e.target.value }))}
            required
          />
          <label className="flex h-10 items-center gap-2 border border-neutral-300 px-3 text-sm">
            <input
              type="checkbox"
              checked={form.isEnabled}
              onChange={(e) => setForm((v) => ({ ...v, isEnabled: e.target.checked }))}
            />
            Включено
          </label>
          <button
            type="submit"
            disabled={saving}
            className="h-10 border border-neutral-900 bg-neutral-900 px-4 text-[11px] uppercase tracking-[0.16em] text-white disabled:opacity-60"
          >
            {saving ? "Сохранение…" : editing ? "Обновить" : "Создать"}
          </button>
        </form>
      </section>

      <section className="border border-neutral-200 bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <input
            className="h-10 w-full max-w-sm border border-neutral-300 px-3 text-sm"
            placeholder="Поиск по названию или slug"
            value={q}
            onChange={(e) => {
              setPage(1)
              setQ(e.target.value)
            }}
          />
          <button
            type="button"
            className="h-10 border border-neutral-300 px-3 text-[11px] uppercase tracking-[0.16em]"
            onClick={() => setSortDir((v) => (v === "desc" ? "asc" : "desc"))}
          >
            Сортировка: {sortDir}
          </button>
        </div>

        {notice ? <p className="mt-3 text-sm text-emerald-700">{notice}</p> : null}
        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

        {loading ? (
          <p className="mt-5 text-sm text-neutral-500">Загрузка…</p>
        ) : rows.length === 0 ? (
          <p className="mt-5 text-sm text-neutral-500">Записей не найдено.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-neutral-200 text-left text-[11px] uppercase tracking-[0.16em] text-neutral-500">
                  <th className="py-2 pr-3">Название</th>
                  <th className="py-2 pr-3">Slug</th>
                  <th className="py-2 pr-3">Вкл.</th>
                  <th className="py-2 pr-3">Действия</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-b border-neutral-100">
                    <td className="py-2 pr-3">{row.name}</td>
                    <td className="py-2 pr-3">{row.slug}</td>
                    <td className="py-2 pr-3">{row.isEnabled ? "Да" : "Нет"}</td>
                    <td className="py-2 pr-3">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          className="border border-neutral-300 px-2 py-1 text-[10px] uppercase tracking-[0.16em]"
                          onClick={() => {
                            setEditing(row)
                            setForm({
                              name: row.name,
                              slug: row.slug,
                              isEnabled: row.isEnabled ?? true,
                            })
                          }}
                        >
                          Изменить
                        </button>
                        <button
                          type="button"
                          className="border border-red-300 px-2 py-1 text-[10px] uppercase tracking-[0.16em] text-red-700"
                          onClick={() => void onDelete(row)}
                        >
                          Удалить
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-4 flex items-center justify-end gap-2">
          <button
            type="button"
            disabled={page <= 1}
            className="border border-neutral-300 px-3 py-1 text-[10px] uppercase tracking-[0.16em] disabled:opacity-50"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Назад
          </button>
          <span className="text-xs text-neutral-500">
            Стр. {page} / {maxPage}
          </span>
          <button
            type="button"
            disabled={page >= maxPage}
            className="border border-neutral-300 px-3 py-1 text-[10px] uppercase tracking-[0.16em] disabled:opacity-50"
            onClick={() => setPage((p) => Math.min(maxPage, p + 1))}
          >
            Далее
          </button>
        </div>
      </section>
    </div>
  )
}
