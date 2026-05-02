"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"

import { useAuth } from "@/components/auth-provider"
import { formatKzt, usdToKzt } from "@/lib/currency"

type ProductRow = {
  id: string
  title: string
  sku: string
  status: string
  basePrice: number
  salePrice?: number | null
}

export function ProductsTable() {
  const { user } = useAuth()
  const [rows, setRows] = useState<ProductRow[]>([])
  const [q, setQ] = useState("")
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const pageSize = 10

  async function headers() {
    const token = await user?.getIdToken(true)
    return { Authorization: `Bearer ${token ?? ""}` }
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
      })
      const res = await fetch(`/api/admin/products?${params.toString()}`, {
        headers: await headers(),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error ?? "Не удалось загрузить товары")
      setRows(json.items ?? [])
      setTotal(json.total ?? 0)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось загрузить товары")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, page, q])

  const maxPage = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <input
          className="h-10 w-full max-w-sm border border-neutral-300 px-3 text-sm"
          placeholder="Поиск по названию или SKU"
          value={q}
          onChange={(e) => {
            setPage(1)
            setQ(e.target.value)
          }}
        />
        <Link
          href="/admin/products/new"
          className="inline-flex h-10 items-center border border-neutral-900 bg-neutral-900 px-4 text-[11px] uppercase tracking-[0.16em] text-white"
        >
          Новый товар
        </Link>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {loading ? (
        <p className="text-sm text-neutral-500">Загрузка…</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-neutral-500">Товары не найдены.</p>
      ) : (
        <div className="overflow-x-auto border border-neutral-200 bg-white">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-neutral-200 text-left text-[11px] uppercase tracking-[0.16em] text-neutral-500">
                <th className="px-3 py-2">Название</th>
                <th className="px-3 py-2">SKU</th>
                <th className="px-3 py-2">Статус</th>
                <th className="px-3 py-2">Цена</th>
                <th className="px-3 py-2">Действия</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-neutral-100">
                  <td className="px-3 py-2">{row.title}</td>
                  <td className="px-3 py-2">{row.sku}</td>
                  <td className="px-3 py-2">{row.status}</td>
                  <td className="px-3 py-2">
                    {row.salePrice != null &&
                    typeof row.salePrice === "number" &&
                    row.salePrice < row.basePrice ? (
                      <span className="tabular-nums">
                        <span className="text-[11px] text-neutral-500 line-through">
                          {formatKzt(usdToKzt(row.basePrice))}
                        </span>
                        <span className="ml-2 font-medium">
                          {formatKzt(usdToKzt(row.salePrice))}
                        </span>
                      </span>
                    ) : (
                      <span className="tabular-nums">{formatKzt(usdToKzt(row.basePrice))}</span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <Link
                      href={`/admin/products/${row.id}`}
                      className="border border-neutral-300 px-2 py-1 text-[10px] uppercase tracking-[0.16em]"
                    >
                      Изменить
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex items-center justify-end gap-2">
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
    </div>
  )
}
