"use client"

import { format } from "date-fns"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useMemo, useState } from "react"

import { useAuth } from "@/components/auth-provider"
import { DiscountDateField } from "@/components/admin/discount-date-field"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { kztToUsd, usdToKzt } from "@/lib/currency"

const SIZE_OPTIONS = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "3XL"] as const

const defaultForm = {
  title: "",
  description: "",
  categoryId: "",
  brandId: "",
  basePrice: 0,
  salePrice: "",
  discountPercent: "",
  discountStartAt: "",
  discountEndAt: "",
  sku: "",
  material: "",
  season: "",
  audience: "unisex",
  status: "draft",
  isEnabled: true,
  coverImageUrl: "",
  imageUrls: "",
  stockCount: 0,
  sizes: ["S", "M", "L"] as string[],
  colors: [{ hex: "#d9d9d9", name: "Основной" }] as { hex: string; name: string }[],
  merchandisingTag: "none" as "none" | "new" | "hit",
  plpSortKey: 1000,
}

type EntityRef = { id: string; name: string }

/** Firestore/API часто отдают null вместо строки — для input и .trim() нужна строка. */
function str(v: unknown): string {
  if (v == null) return ""
  return typeof v === "string" ? v : String(v)
}

function normalizeSlug(raw: string) {
  return raw.trim().toLowerCase().replace(/\s+/g, "-")
}

/** Нормализует hex для API (#RGB → #rrggbb). Пустая строка — невалидный ввод. */
function normalizeHexInput(raw: string): string {
  let t = str(raw).trim()
  if (!t) return ""
  if (!t.startsWith("#")) t = `#${t}`
  if (!/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(t)) return ""
  const s = t.slice(1)
  if (s.length === 3) {
    return `#${s[0]}${s[0]}${s[1]}${s[1]}${s[2]}${s[2]}`.toLowerCase()
  }
  return `#${s.toLowerCase()}`
}

function colorsFromApi(raw: unknown): { hex: string; name: string }[] {
  if (!Array.isArray(raw) || raw.length === 0) {
    return [{ hex: "#d9d9d9", name: "Основной" }]
  }
  const out: { hex: string; name: string }[] = []
  for (const item of raw) {
    if (!item || typeof item !== "object") continue
    const o = item as Record<string, unknown>
    const hex = normalizeHexInput(str(o.hex))
    if (!hex) continue
    out.push({ hex, name: str(o.name).trim() })
  }
  return out.length > 0 ? out : [{ hex: "#d9d9d9", name: "Основной" }]
}

function toFormDate(v: unknown): string {
  if (v == null || v === "") return ""
  if (typeof v === "string") {
    const m = /^(\d{4}-\d{2}-\d{2})/.exec(v.trim())
    if (m) return m[1]!
    const d = new Date(v)
    return Number.isNaN(d.getTime()) ? "" : format(d, "yyyy-MM-dd")
  }
  if (typeof v === "object" && v !== null) {
    const o = v as Record<string, unknown>
    if (typeof o.toDate === "function") {
      const d = (o.toDate as () => Date)()
      return Number.isNaN(d.getTime()) ? "" : format(d, "yyyy-MM-dd")
    }
    if (typeof o.seconds === "number") {
      const d = new Date(o.seconds * 1000)
      return format(d, "yyyy-MM-dd")
    }
  }
  return ""
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
  return json.error ?? "Не удалось сохранить"
}

/** Zod `z.string().datetime()` ожидает полный ISO; дату без времени дополняем. */
function normalizeOptionalDatetime(raw: string | null | undefined): string | null {
  const t = str(raw).trim()
  if (!t) return null
  if (/^\d{4}-\d{2}-\d{2}$/.test(t)) return `${t}T00:00:00.000Z`
  return t
}

function buildProductPayload(form: typeof defaultForm) {
  const baseKzt = Number(form.basePrice)
  const saleKztRaw = str(form.salePrice).trim()
  const saleKzt =
    saleKztRaw === "" ? null : Number(saleKztRaw.replace(/,/g, "."))
  const basePriceUsd = Number.isFinite(baseKzt) ? kztToUsd(baseKzt) : 0
  const salePriceUsd =
    saleKzt === null || !Number.isFinite(saleKzt) ? null : kztToUsd(saleKzt)
  const discountRaw = form.discountPercent === "" ? null : Number(form.discountPercent)
  const cover = str(form.coverImageUrl).trim()
  const imageUrls = str(form.imageUrls)
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean)

  const sizeOrder = new Map(SIZE_OPTIONS.map((s, i) => [s, i]))
  const sizes = [...form.sizes]
    .map((s) => s.trim())
    .filter(Boolean)
    .sort((a, b) => (sizeOrder.get(a as (typeof SIZE_OPTIONS)[number]) ?? 99) - (sizeOrder.get(b as (typeof SIZE_OPTIONS)[number]) ?? 99))

  const colorRows = form.colors
    .map((c) => {
      const hex = normalizeHexInput(c.hex)
      if (!hex) return null
      const name = str(c.name).trim()
      return name ? { hex, name } : { hex }
    })
    .filter((x): x is { hex: string; name?: string } => x !== null)
  const colors =
    colorRows.length > 0 ? colorRows : [{ hex: "#d9d9d9", name: "Основной" }]

  return {
    title: str(form.title).trim(),
    description: str(form.description).trim(),
    categoryId: str(form.categoryId).trim(),
    brandId: str(form.brandId).trim(),
    basePrice: basePriceUsd,
    salePrice: salePriceUsd,
    discountPercent:
      discountRaw !== null && Number.isFinite(discountRaw) ? discountRaw : null,
    discountStartAt: normalizeOptionalDatetime(form.discountStartAt),
    discountEndAt: normalizeOptionalDatetime(form.discountEndAt),
    sku: str(form.sku).trim(),
    material: str(form.material).trim(),
    season: str(form.season).trim(),
    audience: form.audience,
    status: form.status,
    isEnabled: form.isEnabled,
    coverImageUrl: cover === "" ? null : cover,
    imageUrls,
    stockCount: Number.isFinite(Number(form.stockCount))
      ? Math.max(0, Math.floor(Number(form.stockCount)))
      : 0,
    sizes,
    colors,
    merchandisingTag: form.merchandisingTag,
    plpSortKey: Number.isFinite(Number(form.plpSortKey))
      ? Math.max(0, Math.floor(Number(form.plpSortKey)))
      : 1000,
  }
}

export function ProductEditor({ id }: { id?: string }) {
  const router = useRouter()
  const { user } = useAuth()
  const [form, setForm] = useState(defaultForm)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [brands, setBrands] = useState<EntityRef[]>([])
  const [categories, setCategories] = useState<EntityRef[]>([])

  const [brandDialogOpen, setBrandDialogOpen] = useState(false)
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false)
  const [newBrandName, setNewBrandName] = useState("")
  const [newBrandSlug, setNewBrandSlug] = useState("")
  const [newCategoryName, setNewCategoryName] = useState("")
  const [newCategorySlug, setNewCategorySlug] = useState("")
  const [entitySaving, setEntitySaving] = useState(false)

  async function headers(withJson = false) {
    const token = await user?.getIdToken(true)
    return withJson
      ? { "Content-Type": "application/json", Authorization: `Bearer ${token ?? ""}` }
      : { Authorization: `Bearer ${token ?? ""}` }
  }

  const loadRefs = useCallback(async () => {
    if (!user) return
    try {
      const h = await headers()
      const [brRes, catRes] = await Promise.all([
        fetch(`/api/admin/brands?pageSize=100&page=1`, { headers: h }),
        fetch(`/api/admin/categories?pageSize=100&page=1`, { headers: h }),
      ])
      const brJson = await brRes.json()
      const catJson = await catRes.json()
      if (brRes.ok && Array.isArray(brJson.items)) {
        const sorted = (brJson.items as { id: string; name?: string }[])
          .map((x) => ({ id: x.id, name: str(x.name) || x.id }))
          .sort((a, b) => a.name.localeCompare(b.name, "ru"))
        setBrands(sorted)
      }
      if (catRes.ok && Array.isArray(catJson.items)) {
        const sorted = (catJson.items as { id: string; name?: string }[])
          .map((x) => ({ id: x.id, name: str(x.name) || x.id }))
          .sort((a, b) => a.name.localeCompare(b.name, "ru"))
        setCategories(sorted)
      }
    } catch {
      // список опционален для черновика
    }
  }, [user])

  useEffect(() => {
    void loadRefs()
  }, [loadRefs])

  useEffect(() => {
    if (!id || !user) return
    void (async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/admin/products/${id}`, { headers: await headers() })
        const json = await res.json()
        if (!res.ok) throw new Error(json?.error ?? "Не удалось загрузить товар")
        setForm({
          ...defaultForm,
          ...json,
          title: str(json.title ?? json.name),
          description: str(json.description),
          categoryId: str(json.categoryId),
          brandId: str(json.brandId),
          sku: str(json.sku),
          material: str(json.material),
          season: str(json.season),
          coverImageUrl: str(json.coverImageUrl),
          basePrice: Math.round(
            usdToKzt(
              typeof json.basePrice === "number"
                ? json.basePrice
                : Number(json.basePrice) || 0,
            ),
          ),
          salePrice:
            json.salePrice != null && json.salePrice !== ""
              ? String(
                  Math.round(
                    usdToKzt(
                      typeof json.salePrice === "number"
                        ? json.salePrice
                        : Number(json.salePrice) || 0,
                    ),
                  ),
                )
              : "",
          discountPercent:
            json.discountPercent != null && json.discountPercent !== ""
              ? String(json.discountPercent)
              : "",
          discountStartAt: toFormDate(json.discountStartAt),
          discountEndAt: toFormDate(json.discountEndAt),
          audience: str(json.audience) || defaultForm.audience,
          status: str(json.status) || defaultForm.status,
          isEnabled: typeof json.isEnabled === "boolean" ? json.isEnabled : Boolean(json.isEnabled ?? true),
          imageUrls: Array.isArray(json.imageUrls)
            ? json.imageUrls.map((u: unknown) => str(u)).filter(Boolean).join("\n")
            : str(json.imageUrls),
          stockCount:
            typeof json.stockCount === "number" && Number.isFinite(json.stockCount)
              ? Math.max(0, Math.floor(json.stockCount))
              : 0,
          sizes:
            Array.isArray(json.sizes) && json.sizes.length > 0
              ? (json.sizes as unknown[]).map((x) => str(x).trim()).filter(Boolean)
              : ["S", "M", "L"],
          colors: colorsFromApi(json.colors),
          merchandisingTag:
            json.merchandisingTag === "new" || json.merchandisingTag === "hit"
              ? json.merchandisingTag
              : "none",
          plpSortKey:
            typeof json.plpSortKey === "number" && Number.isFinite(json.plpSortKey)
              ? Math.max(0, Math.floor(json.plpSortKey))
              : 1000,
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : "Не удалось загрузить товар")
      } finally {
        setLoading(false)
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user])

  const brandOptions = useMemo(() => {
    const ids = new Set(brands.map((b) => b.id))
    const list = [...brands]
    if (form.brandId && !ids.has(form.brandId)) {
      list.push({ id: form.brandId, name: `${form.brandId} (не найден в списке)` })
    }
    return list.sort((a, b) => a.name.localeCompare(b.name, "ru"))
  }, [brands, form.brandId])

  const categoryOptions = useMemo(() => {
    const ids = new Set(categories.map((c) => c.id))
    const list = [...categories]
    if (form.categoryId && !ids.has(form.categoryId)) {
      list.push({ id: form.categoryId, name: `${form.categoryId} (не найден в списке)` })
    }
    return list.sort((a, b) => a.name.localeCompare(b.name, "ru"))
  }, [categories, form.categoryId])

  async function createBrand() {
    if (!user) return
    const name = newBrandName.trim()
    const slug = normalizeSlug(newBrandSlug || name)
    if (name.length < 2 || slug.length < 2) {
      setError("Название и slug бренда — не менее 2 символов.")
      return
    }
    setEntitySaving(true)
    setError(null)
    try {
      const res = await fetch("/api/admin/brands", {
        method: "POST",
        headers: await headers(true),
        body: JSON.stringify({ name, slug, isEnabled: true }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(formatApiValidation(json))
      const newId = str(json.id)
      if (!newId) throw new Error("Бренд создан, но не получен id")
      setForm((f) => ({ ...f, brandId: newId }))
      setBrandDialogOpen(false)
      setNewBrandName("")
      setNewBrandSlug("")
      await loadRefs()
      setSuccess("Бренд добавлен и выбран.")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось создать бренд")
    } finally {
      setEntitySaving(false)
    }
  }

  async function createCategory() {
    if (!user) return
    const name = newCategoryName.trim()
    const slug = normalizeSlug(newCategorySlug || name)
    if (name.length < 2 || slug.length < 2) {
      setError("Название и slug категории — не менее 2 символов.")
      return
    }
    setEntitySaving(true)
    setError(null)
    try {
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: await headers(true),
        body: JSON.stringify({ name, slug, isEnabled: true }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(formatApiValidation(json))
      const newId = str(json.id)
      if (!newId) throw new Error("Категория создана, но не получен id")
      setForm((f) => ({ ...f, categoryId: newId }))
      setCategoryDialogOpen(false)
      setNewCategoryName("")
      setNewCategorySlug("")
      await loadRefs()
      setSuccess("Категория добавлена и выбрана.")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось создать категорию")
    } finally {
      setEntitySaving(false)
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return
    setLoading(true)
    setError(null)
    setSuccess(null)
    try {
      const payload = buildProductPayload(form)

      if (
        payload.salePrice !== null &&
        payload.basePrice > 0 &&
        payload.salePrice >= payload.basePrice
      ) {
        throw new Error("Цена со скидкой в тенге должна быть меньше базовой.")
      }

      if (payload.title.length < 2) {
        throw new Error("Название — не менее 2 символов.")
      }
      if (payload.description.length < 3) {
        throw new Error("Описание — не менее 3 символов.")
      }
      if (!payload.categoryId || !payload.brandId) {
        throw new Error("Выберите категорию и бренд (или создайте их кнопками рядом).")
      }
      if (payload.sku.length < 3) {
        throw new Error("SKU — не менее 3 символов (буквы, цифры, . _ -).")
      }
      if (payload.basePrice < 0) {
        throw new Error("Базовая цена должна быть не меньше 0.")
      }
      if (!payload.sizes.length) {
        throw new Error("Отметьте хотя бы один размер.")
      }
      {
        const valid = form.colors.some((c) => normalizeHexInput(c.hex))
        if (!valid) {
          throw new Error("Укажите хотя бы один цвет в формате hex (например #d9d9d9).")
        }
        for (const c of form.colors) {
          const raw = str(c.hex).trim()
          if (!raw) continue
          if (!normalizeHexInput(raw)) {
            throw new Error(`Некорректный hex цвета: ${raw}`)
          }
        }
      }

      const res = await fetch(id ? `/api/admin/products/${id}` : "/api/admin/products", {
        method: id ? "PATCH" : "POST",
        headers: await headers(true),
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(formatApiValidation(json))
      setSuccess("Сохранено")
      if (!id && json.id) router.push(`/admin/products/${json.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось сохранить")
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="border border-neutral-200 bg-white p-6">
      <h1 className="text-xl font-semibold uppercase tracking-[0.08em]">
        {id ? "Редактировать товар" : "Новый товар"}
      </h1>
      <p className="mt-2 text-xs text-neutral-500">
        Базовая цена и цена со скидкой указываются в тенге (₸). Курс к доллару для хранения в базе —
        переменная{" "}
        <code className="rounded bg-neutral-100 px-1 py-0.5 text-[11px]">NEXT_PUBLIC_USD_TO_KZT</code>
        .
      </p>
      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
      {success ? <p className="mt-3 text-sm text-emerald-700">{success}</p> : null}
      <form onSubmit={onSubmit} className="mt-4 grid gap-3 md:grid-cols-2">
        {[
          ["title", "Название (мин. 2)"],
          ["description", "Описание (мин. 3)"],
        ].map(([key, label]) => (
          <input
            key={key}
            className="h-10 border border-neutral-300 px-3 text-sm"
            placeholder={label}
            value={str(form[key as keyof typeof form] as unknown)}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, [key]: e.target.value } as typeof prev))
            }
          />
        ))}

        <div className="flex flex-col gap-2 md:col-span-2 lg:flex-row lg:items-end lg:gap-3">
          <div className="min-w-0 flex-1 space-y-1">
            <span className="text-[11px] uppercase tracking-[0.12em] text-neutral-500">
              Категория
            </span>
            <select
              className="h-10 w-full border border-neutral-300 px-3 text-sm"
              value={form.categoryId}
              onChange={(e) => setForm((v) => ({ ...v, categoryId: e.target.value }))}
            >
              <option value="">— выберите категорию —</option>
              {categoryOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            className="h-10 shrink-0 border border-neutral-300 px-3 text-[11px] uppercase tracking-[0.12em] text-neutral-800 hover:bg-neutral-50"
            onClick={() => {
              setCategoryDialogOpen(true)
              setNewCategoryName("")
              setNewCategorySlug("")
            }}
          >
            Новая категория
          </button>
        </div>

        <div className="flex flex-col gap-2 md:col-span-2 lg:flex-row lg:items-end lg:gap-3">
          <div className="min-w-0 flex-1 space-y-1">
            <span className="text-[11px] uppercase tracking-[0.12em] text-neutral-500">Бренд</span>
            <select
              className="h-10 w-full border border-neutral-300 px-3 text-sm"
              value={form.brandId}
              onChange={(e) => setForm((v) => ({ ...v, brandId: e.target.value }))}
            >
              <option value="">— выберите бренд —</option>
              {brandOptions.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            className="h-10 shrink-0 border border-neutral-900 bg-neutral-900 px-3 text-[11px] uppercase tracking-[0.12em] text-white hover:bg-neutral-800"
            onClick={() => {
              setBrandDialogOpen(true)
              setNewBrandName("")
              setNewBrandSlug("")
            }}
          >
            Новый бренд
          </button>
        </div>

        {[
          ["basePrice", "Базовая цена (₸)"],
          ["salePrice", "Цена со скидкой, ₸ (необязательно)"],
          ["discountPercent", "Скидка % 0–99 (необязательно)"],
        ].map(([key, label]) => (
          <input
            key={key}
            className="h-10 border border-neutral-300 px-3 text-sm"
            placeholder={label}
            value={
              key === "basePrice"
                ? form.basePrice
                : str(form[key as keyof typeof form] as unknown)
            }
            onChange={(e) => {
              const v = e.target.value
              setForm((prev) => {
                if (key !== "basePrice") {
                  return { ...prev, [key]: v } as typeof prev
                }
                if (v.trim() === "") return { ...prev, basePrice: 0 }
                const n = Number(v.replace(/,/g, "."))
                if (Number.isNaN(n)) return prev
                return { ...prev, basePrice: n }
              })
            }}
          />
        ))}

        <div className="md:col-span-1">
          <DiscountDateField
            label="Начало скидки"
            value={form.discountStartAt}
            onChange={(v) => setForm((p) => ({ ...p, discountStartAt: v }))}
          />
        </div>
        <div className="md:col-span-1">
          <DiscountDateField
            label="Конец скидки"
            value={form.discountEndAt}
            onChange={(v) => setForm((p) => ({ ...p, discountEndAt: v }))}
          />
        </div>

        {[
          ["sku", "SKU (мин. 3, A–Z 0-9 . _ -)"],
          ["material", "Материал"],
          ["season", "Сезон"],
          ["coverImageUrl", "URL обложки (https…)"],
        ].map(([key, label]) => (
          <input
            key={key}
            className="h-10 border border-neutral-300 px-3 text-sm"
            placeholder={label}
            value={str(form[key as keyof typeof form] as unknown)}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, [key]: e.target.value } as typeof prev))
            }
          />
        ))}

        <div className="space-y-1 md:col-span-2">
          <span className="text-[11px] uppercase tracking-[0.12em] text-neutral-500">
            Остаток на складе, шт.
          </span>
          <input
            type="number"
            min={0}
            className="h-10 w-full max-w-[200px] border border-neutral-300 px-3 text-sm tabular-nums"
            value={form.stockCount}
            onChange={(e) => {
              const v = e.target.value
              if (v.trim() === "") {
                setForm((p) => ({ ...p, stockCount: 0 }))
                return
              }
              const n = Number(v.replace(/,/g, "."))
              if (!Number.isFinite(n) || n < 0) return
              setForm((p) => ({ ...p, stockCount: Math.floor(n) }))
            }}
          />
        </div>

        <div className="grid gap-4 md:col-span-2 sm:grid-cols-2">
          <div className="space-y-1">
            <span className="text-[11px] uppercase tracking-[0.12em] text-neutral-500">
              Метка на витрине
            </span>
            <select
              className="h-10 w-full border border-neutral-300 px-3 text-sm"
              value={form.merchandisingTag}
              onChange={(e) =>
                setForm((v) => ({
                  ...v,
                  merchandisingTag: e.target.value as "none" | "new" | "hit",
                }))
              }
            >
              <option value="none">Без метки</option>
              <option value="new">Новинка</option>
              <option value="hit">Хит</option>
            </select>
          </div>
          <div className="space-y-1">
            <span className="text-[11px] uppercase tracking-[0.12em] text-neutral-500">
              Sort key (каталог «Рекомендуемые», меньше — выше)
            </span>
            <input
              type="number"
              min={0}
              className="h-10 w-full border border-neutral-300 px-3 text-sm tabular-nums"
              value={form.plpSortKey}
              onChange={(e) => {
                const v = e.target.value
                if (v.trim() === "") {
                  setForm((p) => ({ ...p, plpSortKey: 0 }))
                  return
                }
                const n = Number(v.replace(/,/g, "."))
                if (!Number.isFinite(n) || n < 0) return
                setForm((p) => ({ ...p, plpSortKey: Math.floor(n) }))
              }}
            />
          </div>
        </div>

        <div className="space-y-2 md:col-span-2">
          <span className="text-[11px] uppercase tracking-[0.12em] text-neutral-500">
            Цвета на витрине
          </span>
          <p className="text-[11px] text-neutral-500">
            Hex и необязательное название. Для каждой пары «размер × цвет» создаётся строка на складе.
            При создании товара общий остаток делится между всеми комбинациями; при правке новые
            комбинации добавляются с нулевым остатком.
          </p>
          <div className="grid gap-2">
            {form.colors.map((row, idx) => (
              <div key={idx} className="flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  className="h-10 w-[140px] border border-neutral-300 px-3 font-mono text-sm"
                  placeholder="#RRGGBB"
                  autoComplete="off"
                  value={row.hex}
                  onChange={(e) =>
                    setForm((p) => {
                      const next = [...p.colors]
                      next[idx] = { ...next[idx]!, hex: e.target.value }
                      return { ...p, colors: next }
                    })
                  }
                  aria-label={`Цвет ${idx + 1}, hex`}
                />
                <input
                  type="text"
                  className="h-10 min-w-[160px] flex-1 border border-neutral-300 px-3 text-sm"
                  placeholder="Название (необязательно)"
                  value={row.name}
                  onChange={(e) =>
                    setForm((p) => {
                      const next = [...p.colors]
                      next[idx] = { ...next[idx]!, name: e.target.value }
                      return { ...p, colors: next }
                    })
                  }
                />
                <button
                  type="button"
                  className="h-10 border border-neutral-300 px-3 text-[11px] uppercase tracking-[0.12em] text-neutral-700 disabled:opacity-40"
                  disabled={form.colors.length <= 1}
                  onClick={() =>
                    setForm((p) => ({
                      ...p,
                      colors: p.colors.filter((_, i) => i !== idx),
                    }))
                  }
                >
                  Удалить
                </button>
              </div>
            ))}
            <button
              type="button"
              className="h-10 w-fit border border-neutral-900 bg-white px-3 text-[11px] uppercase tracking-[0.12em] text-neutral-900 hover:bg-neutral-50 disabled:opacity-40"
              disabled={form.colors.length >= 16}
              onClick={() =>
                setForm((p) => ({
                  ...p,
                  colors: [...p.colors, { hex: "#ffffff", name: "" }],
                }))
              }
            >
              Добавить цвет
            </button>
          </div>
        </div>

        <div className="space-y-2 md:col-span-2">
          <span className="text-[11px] uppercase tracking-[0.12em] text-neutral-500">
            Размеры в наличии
          </span>
          <p className="text-[11px] text-neutral-500">
            Отметьте размеры; вместе с цветами выше они задают складские варианты. Общий остаток
            (поле выше) при новом товаре делится между всеми комбинациями размер × цвет. Новые
            комбинации при правке карточки создаются с нулевым остатком — пополните на странице
            «Склад».
          </p>
          <div className="flex flex-wrap gap-3">
            {SIZE_OPTIONS.map((s) => (
              <label
                key={s}
                className="flex cursor-pointer items-center gap-2 border border-neutral-300 bg-white px-3 py-2 text-sm"
              >
                <input
                  type="checkbox"
                  checked={form.sizes.includes(s)}
                  onChange={() => {
                    setForm((prev) => {
                      const has = prev.sizes.includes(s)
                      const next = has ? prev.sizes.filter((x) => x !== s) : [...prev.sizes, s]
                      const order = new Map(SIZE_OPTIONS.map((k, i) => [k, i]))
                      next.sort(
                        (a, b) =>
                          (order.get(a as (typeof SIZE_OPTIONS)[number]) ?? 99) -
                          (order.get(b as (typeof SIZE_OPTIONS)[number]) ?? 99),
                      )
                      return { ...prev, sizes: next }
                    })
                  }}
                />
                {s}
              </label>
            ))}
          </div>
        </div>

        <select
          className="h-10 border border-neutral-300 px-3 text-sm"
          value={form.audience}
          onChange={(e) => setForm((v) => ({ ...v, audience: e.target.value }))}
        >
          <option value="men">мужское</option>
          <option value="women">женское</option>
          <option value="kids">детское</option>
          <option value="unisex">унисекс</option>
        </select>
        <select
          className="h-10 border border-neutral-300 px-3 text-sm"
          value={form.status}
          onChange={(e) => setForm((v) => ({ ...v, status: e.target.value }))}
        >
          <option value="draft">черновик</option>
          <option value="active">активен</option>
          <option value="archived">архив</option>
          <option value="out_of_stock">нет в наличии</option>
        </select>
        <label className="flex h-10 items-center gap-2 border border-neutral-300 px-3 text-sm">
          <input
            type="checkbox"
            checked={form.isEnabled}
            onChange={(e) => setForm((v) => ({ ...v, isEnabled: e.target.checked }))}
          />
          Включён в каталог
        </label>
        <textarea
          className="min-h-[120px] border border-neutral-300 px-3 py-2 text-sm md:col-span-2"
          placeholder="URL изображений (по одному в строке)"
          value={str(form.imageUrls)}
          onChange={(e) => setForm((v) => ({ ...v, imageUrls: e.target.value }))}
        />
        <button
          type="submit"
          disabled={loading}
          className="h-10 border border-neutral-900 bg-neutral-900 px-4 text-[11px] uppercase tracking-[0.16em] text-white disabled:opacity-60"
        >
          {loading ? "Сохранение…" : "Сохранить"}
        </button>
      </form>

      <Dialog open={brandDialogOpen} onOpenChange={setBrandDialogOpen}>
        <DialogContent showCloseButton>
          <DialogHeader>
            <DialogTitle>Новый бренд</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="space-y-1">
              <label className="text-xs text-neutral-600">Название</label>
              <input
                className="h-10 w-full border border-neutral-300 px-3 text-sm"
                value={newBrandName}
                onChange={(e) => setNewBrandName(e.target.value)}
                onBlur={() => {
                  if (!newBrandSlug.trim() && newBrandName.trim()) {
                    setNewBrandSlug(normalizeSlug(newBrandName))
                  }
                }}
                placeholder="Например, Nike"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-neutral-600">Slug (URL)</label>
              <input
                className="h-10 w-full border border-neutral-300 px-3 text-sm"
                value={newBrandSlug}
                onChange={(e) => setNewBrandSlug(e.target.value)}
                placeholder="nike"
              />
            </div>
          </div>
          <DialogFooter>
            <button
              type="button"
              className="border border-neutral-300 px-4 py-2 text-sm"
              onClick={() => setBrandDialogOpen(false)}
            >
              Отмена
            </button>
            <button
              type="button"
              disabled={entitySaving}
              className="border border-neutral-900 bg-neutral-900 px-4 py-2 text-sm text-white disabled:opacity-50"
              onClick={() => void createBrand()}
            >
              {entitySaving ? "Создание…" : "Создать"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
        <DialogContent showCloseButton>
          <DialogHeader>
            <DialogTitle>Новая категория</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="space-y-1">
              <label className="text-xs text-neutral-600">Название</label>
              <input
                className="h-10 w-full border border-neutral-300 px-3 text-sm"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                onBlur={() => {
                  if (!newCategorySlug.trim() && newCategoryName.trim()) {
                    setNewCategorySlug(normalizeSlug(newCategoryName))
                  }
                }}
                placeholder="Например, Футболки"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-neutral-600">Slug (URL)</label>
              <input
                className="h-10 w-full border border-neutral-300 px-3 text-sm"
                value={newCategorySlug}
                onChange={(e) => setNewCategorySlug(e.target.value)}
                placeholder="futbolki"
              />
            </div>
          </div>
          <DialogFooter>
            <button
              type="button"
              className="border border-neutral-300 px-4 py-2 text-sm"
              onClick={() => setCategoryDialogOpen(false)}
            >
              Отмена
            </button>
            <button
              type="button"
              disabled={entitySaving}
              className="border border-neutral-900 bg-neutral-900 px-4 py-2 text-sm text-white disabled:opacity-50"
              onClick={() => void createCategory()}
            >
              {entitySaving ? "Создание…" : "Создать"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}
