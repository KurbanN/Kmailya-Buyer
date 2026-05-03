"use client"

import { format, parseISO } from "date-fns"
import { ru } from "date-fns/locale"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useCallback, useEffect, useState } from "react"

import { useAuth } from "@/components/auth-provider"
import { StoreHeader } from "@/components/store-header"
import { siteFetchUrl } from "@/lib/public-asset-url"
import { formatKzt } from "@/lib/currency"

type OrderItem = {
  id: string
  productId: string
  quantity: number
  size: string
  colorHex: string
  unitPrice: number
  title: string
}

type StatusStep = {
  id: string
  status: string
  note: string
  actorUid: string
  createdAt: string | null
}

type OrderDetail = {
  id: string
  email: string
  firstName: string
  lastName: string
  phone: string
  shippingAddress: {
    address: string
    city: string
    stateRegion: string
    country: string
    zip: string
  } | null
  shippingMethod: string
  paymentMethod: string
  status: string
  subtotal: number
  discountKzt: number
  promoCode: string | null
  taxKzt: number
  shippingFee: number
  total: number
  trackingNumber: string | null
  trackingCarrier: string | null
  createdAt: string | null
  updatedAt: string | null
  items: OrderItem[]
  statusHistory: StatusStep[]
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

function formatWhen(iso: string | null): string {
  if (!iso) return "—"
  try {
    const d = parseISO(iso)
    if (Number.isNaN(d.getTime())) return iso
    return format(d, "d MMMM yyyy, HH:mm", { locale: ru })
  } catch {
    return iso
  }
}

export default function OrderDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = typeof params.id === "string" ? params.id : ""
  const { user, loading } = useAuth()
  const [order, setOrder] = useState<OrderDetail | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [loadingOrder, setLoadingOrder] = useState(true)

  const load = useCallback(async () => {
    if (!user || !id) return
    setLoadingOrder(true)
    setErr(null)
    try {
      const token = await user.getIdToken(true)
      const res = await fetch(
        siteFetchUrl(`/api/orders/me/${encodeURIComponent(id)}`),
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      )
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error ?? "Не удалось загрузить заказ")
      setOrder(json as OrderDetail)
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Ошибка")
      setOrder(null)
    } finally {
      setLoadingOrder(false)
    }
  }, [user, id])

  useEffect(() => {
    if (!loading && !user) {
      router.replace(`/login?callbackUrl=/account/orders/${encodeURIComponent(id)}`)
    }
  }, [loading, user, router, id])

  useEffect(() => {
    if (user && id) void load()
  }, [user, id, load])

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-[#f2f2f2] text-neutral-900 antialiased">
        <StoreHeader />
        <main className="mx-auto max-w-3xl px-4 py-16 text-center text-sm text-neutral-500 sm:px-6">
          Загрузка…
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f2f2f2] text-neutral-900 antialiased">
      <StoreHeader />
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <nav className="mb-8 flex flex-wrap items-center gap-2 text-[11px] font-medium uppercase tracking-[0.2em] text-neutral-500">
          <Link href="/account" className="transition-colors hover:text-neutral-900">
            Личный кабинет
          </Link>
          <span className="text-neutral-400">/</span>
          <span className="text-neutral-900">Заказ</span>
        </nav>

        {loadingOrder ? (
          <p className="text-sm text-neutral-500">Загрузка заказа…</p>
        ) : err ? (
          <div className="border border-red-200 bg-white p-6 text-sm text-red-700">
            {err}
            <div className="mt-4">
              <Link href="/account" className="underline-offset-4 hover:underline">
                Назад к списку
              </Link>
            </div>
          </div>
        ) : order ? (
          <div className="space-y-8">
            <header className="border border-neutral-200 bg-white p-6 sm:p-8">
              <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-neutral-500">
                Заказ от {formatWhen(order.createdAt)}
              </p>
              <h1
                className="mt-2 text-2xl font-bold uppercase tracking-[0.08em] text-neutral-950 sm:text-3xl"
                style={{ fontFamily: "var(--font-display), sans-serif" }}
              >
                № {order.id.slice(0, 8)}…
              </h1>
              <p className="mt-3 text-sm text-neutral-700">
                Статус:{" "}
                <span className="font-semibold text-neutral-950">
                  {ORDER_STATUS_RU[order.status] ?? order.status}
                </span>
              </p>
              <p className="mt-1 text-lg font-semibold tabular-nums text-neutral-950">
                {formatKzt(Math.round(order.total))}
              </p>
            </header>

            {(order.trackingNumber || order.status === "shipped" || order.status === "delivered") && (
              <section className="border border-neutral-200 bg-white p-6 sm:p-8">
                <h2 className="text-[12px] font-bold uppercase tracking-[0.18em] text-neutral-950">
                  Доставка и трекинг
                </h2>
                {order.trackingNumber ? (
                  <dl className="mt-4 space-y-2 text-[13px]">
                    <div>
                      <dt className="text-[10px] font-medium uppercase tracking-[0.2em] text-neutral-500">
                        Трек-номер
                      </dt>
                      <dd className="mt-1 font-mono text-neutral-900">{order.trackingNumber}</dd>
                    </div>
                    {order.trackingCarrier ? (
                      <div>
                        <dt className="text-[10px] font-medium uppercase tracking-[0.2em] text-neutral-500">
                          Служба
                        </dt>
                        <dd className="mt-1 text-neutral-900">{order.trackingCarrier}</dd>
                      </div>
                    ) : null}
                  </dl>
                ) : (
                  <p className="mt-4 text-sm text-neutral-600">
                    Трек-номер появится здесь после передачи заказа в службу доставки.
                  </p>
                )}
              </section>
            )}

            <section className="border border-neutral-200 bg-white p-6 sm:p-8">
              <h2 className="text-[12px] font-bold uppercase tracking-[0.18em] text-neutral-950">
                История статусов
              </h2>
              <ol className="mt-6 space-y-4 border-l border-neutral-200 pl-6">
                {order.statusHistory.map((step) => (
                  <li key={step.id} className="relative">
                    <span className="absolute -left-[25px] top-1.5 h-2 w-2 rounded-full bg-neutral-900" />
                    <p className="text-[13px] font-medium text-neutral-950">
                      {ORDER_STATUS_RU[step.status] ?? step.status}
                    </p>
                    <p className="text-[12px] text-neutral-500">{formatWhen(step.createdAt)}</p>
                    {step.note?.trim() ? (
                      <p className="mt-1 text-[12px] text-neutral-600">{step.note}</p>
                    ) : null}
                  </li>
                ))}
              </ol>
            </section>

            <section className="border border-neutral-200 bg-white p-6 sm:p-8">
              <h2 className="text-[12px] font-bold uppercase tracking-[0.18em] text-neutral-950">
                Состав заказа
              </h2>
              <ul className="mt-6 divide-y divide-neutral-100">
                {order.items.map((it) => (
                  <li key={it.id} className="flex flex-wrap gap-4 py-4 first:pt-0">
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/product/${it.productId}`}
                        className="text-[13px] font-semibold text-neutral-950 underline-offset-4 hover:underline"
                      >
                        {it.title}
                      </Link>
                      <p className="mt-1 text-[12px] text-neutral-600">
                        Размер {it.size}
                        {it.colorHex ? (
                          <>
                            {" "}
                            ·{" "}
                            <span
                              className="inline-block h-3 w-3 align-middle border border-neutral-300"
                              style={{ backgroundColor: it.colorHex }}
                              title={it.colorHex}
                            />
                          </>
                        ) : null}
                      </p>
                    </div>
                    <div className="text-right text-[13px] tabular-nums">
                      <span className="text-neutral-600">×{it.quantity}</span>
                      <div className="font-medium text-neutral-950">
                        {formatKzt(Math.round(it.unitPrice * it.quantity))}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>

              <dl className="mt-6 space-y-2 border-t border-neutral-100 pt-6 text-[13px]">
                <div className="flex justify-between gap-4">
                  <dt className="text-neutral-600">Товары</dt>
                  <dd className="tabular-nums">{formatKzt(Math.round(order.subtotal))}</dd>
                </div>
                {order.discountKzt > 0 ? (
                  <div className="flex justify-between gap-4 text-emerald-800">
                    <dt>Скидка{order.promoCode ? ` (${order.promoCode})` : ""}</dt>
                    <dd className="tabular-nums">−{formatKzt(Math.round(order.discountKzt))}</dd>
                  </div>
                ) : null}
                <div className="flex justify-between gap-4">
                  <dt className="text-neutral-600">Доставка</dt>
                  <dd className="tabular-nums">{formatKzt(Math.round(order.shippingFee))}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-neutral-600">Налог</dt>
                  <dd className="tabular-nums">{formatKzt(Math.round(order.taxKzt))}</dd>
                </div>
                <div className="flex justify-between gap-4 border-t border-neutral-100 pt-3 text-[15px] font-semibold">
                  <dt>Итого</dt>
                  <dd className="tabular-nums">{formatKzt(Math.round(order.total))}</dd>
                </div>
              </dl>
            </section>

            <section className="border border-neutral-200 bg-white p-6 sm:p-8">
              <h2 className="text-[12px] font-bold uppercase tracking-[0.18em] text-neutral-950">
                Получатель и адрес
              </h2>
              <dl className="mt-6 space-y-3 text-[13px]">
                <div>
                  <dt className="text-[10px] font-medium uppercase tracking-[0.2em] text-neutral-500">
                    Контакт
                  </dt>
                  <dd className="mt-1">
                    {[order.firstName, order.lastName].filter(Boolean).join(" ") || "—"}
                  </dd>
                  <dd className="text-neutral-700">{order.phone}</dd>
                  <dd className="text-neutral-700">{order.email}</dd>
                </div>
                {order.shippingAddress ? (
                  <div>
                    <dt className="text-[10px] font-medium uppercase tracking-[0.2em] text-neutral-500">
                      Адрес доставки
                    </dt>
                    <dd className="mt-1 whitespace-pre-line text-neutral-900">
                      {[
                        order.shippingAddress.address,
                        [order.shippingAddress.city, order.shippingAddress.stateRegion]
                          .filter(Boolean)
                          .join(", "),
                        [order.shippingAddress.zip, order.shippingAddress.country]
                          .filter(Boolean)
                          .join(" · "),
                      ]
                        .filter(Boolean)
                        .join("\n")}
                    </dd>
                  </div>
                ) : null}
                <div>
                  <dt className="text-[10px] font-medium uppercase tracking-[0.2em] text-neutral-500">
                    Способ доставки / оплаты
                  </dt>
                  <dd className="mt-1 text-neutral-900">{order.shippingMethod || "—"}</dd>
                  <dd className="text-neutral-700">{order.paymentMethod || "—"}</dd>
                </div>
              </dl>
            </section>

            <p className="text-center">
              <Link
                href="/account"
                className="text-[12px] uppercase tracking-[0.14em] text-neutral-600 underline-offset-4 hover:text-neutral-950 hover:underline"
              >
                ← Все заказы
              </Link>
            </p>
          </div>
        ) : null}
      </main>
    </div>
  )
}
