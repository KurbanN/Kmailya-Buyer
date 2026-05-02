"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { Star } from "lucide-react"

import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type ReviewItem = {
  id: string
  authorName: string
  rating: number
  text: string
  createdAt: string | null
  verifiedPurchase?: boolean
}

type ViewerInfo = {
  hasReviewed: boolean
  canReview: boolean
}

type Props = {
  productId: string
  onStatsChange?: (averageRating: number | null, reviewCount: number) => void
}

export function ProductReviewsSection({ productId, onStatsChange }: Props) {
  const pathname = usePathname()
  const { user, profile, loading: authLoading } = useAuth()
  const [items, setItems] = useState<ReviewItem[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [authorName, setAuthorName] = useState("")
  const [rating, setRating] = useState(5)
  const [text, setText] = useState("")
  const [viewer, setViewer] = useState<ViewerInfo | null>(null)
  const statsRef = useRef(onStatsChange)
  statsRef.current = onStatsChange

  useEffect(() => {
    const display =
      profile?.name?.trim() ||
      user?.displayName?.trim() ||
      ""
    if (display) setAuthorName(display)
  }, [profile?.name, user?.displayName])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      try {
        const headers: HeadersInit = {}
        if (user) {
          const token = await user.getIdToken()
          headers.Authorization = `Bearer ${token}`
        }
        const res = await fetch(
          `/api/reviews?productId=${encodeURIComponent(productId)}`,
          { headers },
        )
        const j = await res.json()
        if (!res.ok) throw new Error(j?.error ?? "Ошибка загрузки")
        if (cancelled) return
        setItems(Array.isArray(j.items) ? j.items : [])
        const avg = typeof j.averageRating === "number" ? j.averageRating : null
        const cnt = typeof j.reviewCount === "number" ? j.reviewCount : 0
        statsRef.current?.(avg, cnt)
        setViewer(j.viewer ?? null)
      } catch {
        if (!cancelled) setItems([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [productId, user?.uid])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return
    setSubmitting(true)
    setError(null)
    try {
      const token = await user.getIdToken()
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          productId,
          authorName: authorName.trim() || "Покупатель",
          rating,
          text: text.trim(),
        }),
      })
      const j = await res.json()
      if (!res.ok) throw new Error(j?.error ?? "Не удалось отправить")
      setText("")
      setRating(5)
      if (typeof j.reviewCount === "number") {
        statsRef.current?.(
          typeof j.averageRating === "number" ? j.averageRating : null,
          j.reviewCount,
        )
      }
      const headers: HeadersInit = {
        Authorization: `Bearer ${await user.getIdToken()}`,
      }
      const res2 = await fetch(
        `/api/reviews?productId=${encodeURIComponent(productId)}`,
        { headers },
      )
      const j2 = await res2.json()
      if (res2.ok && Array.isArray(j2.items)) setItems(j2.items)
      if (res2.ok) {
        const avg = typeof j2.averageRating === "number" ? j2.averageRating : null
        const cnt = typeof j2.reviewCount === "number" ? j2.reviewCount : 0
        statsRef.current?.(avg, cnt)
        setViewer(j2.viewer ?? null)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка")
    } finally {
      setSubmitting(false)
    }
  }

  const loginHref = `/login?callbackUrl=${encodeURIComponent(pathname ?? `/product/${productId}`)}`
  const formAreaLoading = authLoading || (Boolean(user) && loading)

  return (
    <section id="otzyvy" className="scroll-mt-28 border-t border-neutral-200 pt-10">
      <h2 className="text-lg font-semibold uppercase tracking-[0.12em] text-neutral-950">
        Отзывы
      </h2>

      {loading ? (
        <p className="mt-4 text-sm text-neutral-500">Загрузка…</p>
      ) : items.length === 0 ? (
        <p className="mt-4 text-sm text-neutral-600">Пока нет отзывов — будьте первым.</p>
      ) : (
        <ul className="mt-6 space-y-6">
          {items.map((r) => (
            <li key={r.id} className="border-b border-neutral-100 pb-6 last:border-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium text-neutral-900">{r.authorName}</span>
                <span className="flex gap-0.5" aria-hidden>
                  {[0, 1, 2, 3, 4].map((i) => (
                    <Star
                      key={i}
                      className={cn(
                        "h-3.5 w-3.5",
                        i < r.rating ? "fill-neutral-900 text-neutral-900" : "fill-none text-neutral-300",
                      )}
                      strokeWidth={1.2}
                    />
                  ))}
                </span>
                {r.verifiedPurchase ? (
                  <span className="text-[10px] uppercase tracking-wider text-neutral-500">
                    Покупка подтверждена
                  </span>
                ) : null}
                {r.createdAt ? (
                  <span className="text-[11px] text-neutral-400">
                    {new Date(r.createdAt).toLocaleDateString("ru-RU")}
                  </span>
                ) : null}
              </div>
              <p className="mt-2 text-sm leading-relaxed text-neutral-700">{r.text}</p>
            </li>
          ))}
        </ul>
      )}

      {formAreaLoading ? (
        <p className="mt-8 text-sm text-neutral-500">Загрузка…</p>
      ) : !user ? (
        <div className="mt-8 rounded-lg border border-neutral-200 bg-neutral-50/50 p-4 sm:p-5">
          <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-neutral-600">
            Оставить отзыв
          </p>
          <p className="mt-2 text-sm text-neutral-700">
            Войдите в аккаунт, чтобы оставить отзыв о покупке.
          </p>
          <Button
            asChild
            className="mt-4 h-10 rounded-md bg-neutral-900 text-xs uppercase tracking-wider text-white hover:bg-neutral-800"
          >
            <Link href={loginHref}>Войти</Link>
          </Button>
        </div>
      ) : viewer?.hasReviewed ? (
        <div className="mt-8 rounded-lg border border-neutral-200 bg-neutral-50/50 p-4 sm:p-5">
          <p className="text-sm text-neutral-700">Вы уже оставили отзыв об этом товаре.</p>
        </div>
      ) : viewer && !viewer.canReview && !viewer.hasReviewed ? (
        <div className="mt-8 rounded-lg border border-neutral-200 bg-neutral-50/50 p-4 sm:p-5">
          <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-neutral-600">
            Оставить отзыв
          </p>
          <p className="mt-2 text-sm text-neutral-700">
            Отзыв можно оставить после оформления заказа с этим товаром (заказ не должен быть отменён
            или возвращён).
          </p>
        </div>
      ) : viewer?.canReview ? (
        <form
          onSubmit={onSubmit}
          className="mt-8 space-y-4 rounded-lg border border-neutral-200 bg-neutral-50/50 p-4 sm:p-5"
        >
          <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-neutral-600">
            Оставить отзыв
          </p>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <input
            type="text"
            className="h-10 w-full border border-neutral-300 bg-white px-3 text-sm"
            placeholder="Ваше имя"
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            maxLength={100}
          />
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs text-neutral-600">Оценка:</span>
            <select
              className="h-10 border border-neutral-300 bg-white px-2 text-sm"
              value={rating}
              onChange={(e) => setRating(Number(e.target.value))}
            >
              {[5, 4, 3, 2, 1].map((n) => (
                <option key={n} value={n}>
                  {n} ★
                </option>
              ))}
            </select>
          </div>
          <textarea
            className="min-h-[100px] w-full border border-neutral-300 bg-white px-3 py-2 text-sm"
            placeholder="Текст отзыва"
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={2000}
            required
          />
          <Button
            type="submit"
            disabled={submitting || text.trim().length < 3}
            className="h-10 rounded-md bg-neutral-900 text-xs uppercase tracking-wider text-white hover:bg-neutral-800"
          >
            {submitting ? "Отправка…" : "Отправить"}
          </Button>
        </form>
      ) : null}
    </section>
  )
}
