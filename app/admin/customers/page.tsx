"use client"

import { useEffect, useState } from "react"

import { useAuth } from "@/components/auth-provider"

type UserRow = { id: string; email: string; name?: string; role?: string; blocked?: boolean }

export default function AdminCustomersPage() {
  const { user } = useAuth()
  const [rows, setRows] = useState<UserRow[]>([])
  const [error, setError] = useState<string | null>(null)

  async function headers(withJson = false) {
    const token = await user?.getIdToken(true)
    return withJson
      ? { "Content-Type": "application/json", Authorization: `Bearer ${token ?? ""}` }
      : { Authorization: `Bearer ${token ?? ""}` }
  }

  async function load() {
    if (!user) return
    const res = await fetch("/api/admin/users", { headers: await headers() })
    const json = await res.json()
    if (!res.ok) {
      setError(json?.error ?? "Не удалось загрузить пользователей")
      return
    }
    setRows(json.items ?? [])
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  async function updateRole(id: string, role: "admin" | "manager" | "customer") {
    const res = await fetch(`/api/admin/users/${id}/role`, {
      method: "PATCH",
      headers: await headers(true),
      body: JSON.stringify({ role }),
    })
    if (res.ok) await load()
  }

  async function toggleBlock(id: string, blocked: boolean) {
    const res = await fetch(`/api/admin/users/${id}/block`, {
      method: "PATCH",
      headers: await headers(true),
      body: JSON.stringify({ blocked }),
    })
    if (res.ok) await load()
  }

  return (
    <section className="border border-neutral-200 bg-white p-6">
      <h1 className="text-xl font-semibold uppercase tracking-[0.08em]">Покупатели</h1>
      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
      <div className="mt-4 overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-neutral-200 text-left text-[11px] uppercase tracking-[0.16em] text-neutral-500">
              <th className="py-2 pr-3">Email</th>
              <th className="py-2 pr-3">Имя</th>
              <th className="py-2 pr-3">Роль</th>
              <th className="py-2 pr-3">Блок</th>
              <th className="py-2 pr-3">Действия</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-neutral-100">
                <td className="py-2 pr-3">{r.email}</td>
                <td className="py-2 pr-3">{r.name ?? "-"}</td>
                <td className="py-2 pr-3">
                  {r.role === "admin"
                    ? "админ"
                    : r.role === "manager"
                      ? "менеджер"
                      : r.role === "customer" || !r.role
                        ? "клиент"
                        : r.role}
                </td>
                <td className="py-2 pr-3">{r.blocked ? "да" : "нет"}</td>
                <td className="py-2 pr-3">
                  <div className="flex flex-wrap gap-2">
                    {(
                      [
                        ["admin", "админ"],
                        ["manager", "менеджер"],
                        ["customer", "клиент"],
                      ] as const
                    ).map(([role, label]) => (
                      <button
                        key={role}
                        type="button"
                        className="border border-neutral-300 px-2 py-1 text-[10px] uppercase tracking-[0.16em]"
                        onClick={() => void updateRole(r.id, role)}
                      >
                        {label}
                      </button>
                    ))}
                    <button
                      type="button"
                      className="border border-red-300 px-2 py-1 text-[10px] uppercase tracking-[0.16em] text-red-700"
                      onClick={() => void toggleBlock(r.id, !r.blocked)}
                    >
                      {r.blocked ? "Разблокировать" : "Заблокировать"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
