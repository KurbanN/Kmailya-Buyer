"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { ArrowRight } from "lucide-react"

import { useAuth } from "@/components/auth-provider"
import { useShop } from "@/components/shop-provider"
import { StoreHeader } from "@/components/store-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { CHECKOUT_TAX_RATE, checkoutShippingFeeKzt } from "@/lib/checkout-constants"
import { formatKzt, usdToKzt } from "@/lib/currency"
import { getFreeShippingThresholdKzt } from "@/lib/site-config"
import { parsePriceUsd } from "@/lib/plp-filters"
import type { ProductDetail } from "@/lib/products-data"
import { PRODUCTS } from "@/lib/products-data"
import { publicAssetUrl, siteFetchUrl, withPublicAssetUrls } from "@/lib/public-asset-url"
import { cn } from "@/lib/utils"

const noiseBg = `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.06'/%3E%3C/svg%3E")`

const inputClass =
  "h-12 rounded-none border border-neutral-200 bg-neutral-100/90 px-3 text-sm placeholder:text-neutral-400 focus-visible:border-neutral-400 focus-visible:ring-1 focus-visible:ring-neutral-400"

const countrySelectTriggerClass = cn(
  inputClass,
  "flex w-full min-w-0 cursor-pointer items-center justify-between gap-2 py-0 font-normal shadow-none focus:ring-1 focus:ring-neutral-400 focus-visible:ring-1 data-[size=default]:h-12 [&_svg]:size-4 [&_svg]:opacity-60",
)

const sectionTitleClass =
  "mb-6 text-[12px] font-bold uppercase tracking-[0.18em] text-neutral-950"

type Step = 1 | 2 | 3

export default function CheckoutPage() {
  const { cartLines, clearCart } = useShop()
  const { user } = useAuth()
  const [placed, setPlaced] = useState(false)
  const [placing, setPlacing] = useState(false)
  const [placeError, setPlaceError] = useState<string | null>(null)
  const [step, setStep] = useState<Step>(1)
  const [delivery, setDelivery] = useState<"standard" | "express">("standard")
  const [formError, setFormError] = useState(false)

  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [country, setCountry] = useState("KZ")
  const [stateRegion, setStateRegion] = useState("")
  const [address, setAddress] = useState("")
  const [city, setCity] = useState("")
  const [zip, setZip] = useState("")
  const [productsById, setProductsById] = useState(PRODUCTS)
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; discountKzt: number } | null>(
    null,
  )
  const [promoInput, setPromoInput] = useState("")
  const [promoError, setPromoError] = useState<string | null>(null)
  const [promoLoading, setPromoLoading] = useState(false)

  const subtotal = useMemo(() => {
    return cartLines.reduce((sum, line) => {
      const p = productsById[line.productId]
      const unit = p
        ? usdToKzt(parsePriceUsd(p.price))
        : (line.unitPriceKzt ?? 0)
      return sum + unit * line.quantity
    }, 0)
  }, [cartLines, productsById])

  useEffect(() => {
    setAppliedPromo(null)
    setPromoError(null)
  }, [subtotal])

  const discountKzt = appliedPromo?.discountKzt ?? 0
  const taxableBase = Math.max(0, Math.round(subtotal) - discountKzt)
  const freeShipThreshold = getFreeShippingThresholdKzt()
  const shipping =
    freeShipThreshold > 0 && taxableBase >= freeShipThreshold
      ? 0
      : checkoutShippingFeeKzt(delivery)
  const estimatedTax = Math.round(taxableBase * CHECKOUT_TAX_RATE * 100) / 100
  const total = taxableBase + shipping + estimatedTax

  async function applyPromoCode() {
    const code = promoInput.trim().toUpperCase()
    if (code.length < 3) {
      setPromoError("Введите промокод (минимум 3 символа)")
      return
    }
    setPromoLoading(true)
    setPromoError(null)
    try {
      const res = await fetch(siteFetchUrl("/api/promo/validate"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, subtotalKzt: Math.round(subtotal) }),
      })
      const j = await res.json()
      if (!res.ok) {
        throw new Error(j?.error ?? "Ошибка проверки")
      }
      if (!j.valid) {
        setAppliedPromo(null)
        setPromoError(typeof j.error === "string" ? j.error : "Промокод недоступен")
        return
      }
      setAppliedPromo({ code: j.code as string, discountKzt: Number(j.discountKzt) || 0 })
    } catch (e) {
      setAppliedPromo(null)
      setPromoError(e instanceof Error ? e.message : "Не удалось применить промокод")
    } finally {
      setPromoLoading(false)
    }
  }

  useEffect(() => {
    const ids = [...new Set(cartLines.map((l) => l.productId))]
    if (ids.length === 0) return
    void (async () => {
      try {
        const res = await fetch(siteFetchUrl(`/api/products?ids=${ids.join(",")}`))
        const json = await res.json()
        if (res.ok && Array.isArray(json.items)) {
          const map = { ...PRODUCTS }
          json.items.forEach((item: ProductDetail) => {
            if (item?.id) map[item.id] = withPublicAssetUrls(item)
          })
          setProductsById(map)
        }
      } catch {
        // static fallback stays
      }
    })()
  }, [cartLines])

  const lineTotals = useMemo(() => {
    return cartLines.map((line) => {
      const p = productsById[line.productId]
      const unit = p
        ? usdToKzt(parsePriceUsd(p.price))
        : (line.unitPriceKzt ?? 0)
      return { line, product: p, sum: unit * line.quantity }
    })
  }, [cartLines, productsById])

  const validateStep1 = () => {
    if (
      !email.trim() ||
      !phone.trim() ||
      !firstName.trim() ||
      !lastName.trim() ||
      !address.trim() ||
      !city.trim() ||
      !zip.trim() ||
      !stateRegion.trim()
    ) {
      setFormError(true)
      return false
    }
    setFormError(false)
    return true
  }

  const goToShipping = () => {
    if (!validateStep1()) return
    setStep(2)
  }

  const goToPayment = () => setStep(3)

  const handlePlaceOrder = async () => {
    if (!validateStep1()) {
      setStep(1)
      return
    }
    setPlacing(true)
    setPlaceError(null)
    try {
      const token = await user?.getIdToken()
      const res = await fetch(siteFetchUrl("/api/orders"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          email,
          phone,
          firstName,
          lastName,
          address,
          city,
          stateRegion,
          country,
          zip,
          shippingMethod: delivery,
          paymentMethod: "card_demo",
          promoCode: appliedPromo?.code,
          items: lineTotals.map(({ line }) => ({
            productId: line.productId,
            quantity: line.quantity,
            size: line.size,
            colorHex: line.colorHex,
          })),
          subtotal,
          shippingFee: shipping,
          total,
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        throw new Error(json?.error ?? "Не удалось оформить заказ. Попробуйте снова.")
      }
      clearCart()
      setPlaced(true)
    } catch (err) {
      setPlaceError(err instanceof Error ? err.message : "Не удалось оформить заказ. Попробуйте снова.")
    } finally {
      setPlacing(false)
    }
  }

  if (placed) {
    return (
      <div
        className="min-h-screen text-neutral-900 antialiased"
        style={{
          backgroundColor: "#f2f2f2",
          backgroundImage: noiseBg,
        }}
      >
        <StoreHeader />
        <main className="mx-auto max-w-[560px] px-4 py-20 text-center sm:px-6">
          <p
            className="text-[clamp(1.5rem,4vw,2rem)] font-bold uppercase tracking-[0.12em] text-neutral-950"
            style={{ fontFamily: "var(--font-display), sans-serif" }}
          >
            Спасибо
          </p>
          <p className="mt-4 text-[13px] leading-relaxed text-neutral-600">
            Заказ оформлен. Подробности отправим на{" "}
            <span className="font-medium text-neutral-900">{email}</span>.
          </p>
          <Button
            asChild
            className="mt-10 h-12 rounded-none border-0 bg-neutral-900 px-10 text-[11px] font-medium uppercase tracking-[0.22em] text-white hover:bg-neutral-800"
          >
            <Link href="/">На главную</Link>
          </Button>
        </main>
      </div>
    )
  }

  if (cartLines.length === 0) {
    return (
      <div
        className="min-h-screen text-neutral-900 antialiased"
        style={{
          backgroundColor: "#f2f2f2",
          backgroundImage: noiseBg,
        }}
      >
        <StoreHeader />
        <main className="mx-auto max-w-[560px] px-4 py-20 text-center sm:px-6">
          <p
            className="text-[clamp(1.5rem,4vw,2rem)] font-bold uppercase tracking-[0.12em] text-neutral-950"
            style={{ fontFamily: "var(--font-display), sans-serif" }}
          >
            Корзина пуста
          </p>
          <p className="mt-4 text-[13px] text-neutral-600">
            Добавьте товары перед оформлением заказа.
          </p>
          <Button
            asChild
            className="mt-10 h-12 rounded-none border-0 bg-neutral-900 px-10 text-[11px] font-medium uppercase tracking-[0.22em] text-white hover:bg-neutral-800"
          >
            <Link href="/products">Перейти в каталог</Link>
          </Button>
        </main>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen text-neutral-900 antialiased"
      style={{
        backgroundColor: "#f2f2f2",
        backgroundImage: noiseBg,
      }}
    >
      <StoreHeader />

      <main className="mx-auto max-w-[1320px] px-4 py-8 sm:px-6 lg:py-10">
        <nav className="mb-8 flex flex-wrap items-center gap-2 text-[11px] font-medium uppercase tracking-[0.2em] text-neutral-500">
          <Link href="/" className="transition-colors hover:text-neutral-900">
            Главная
          </Link>
          <span className="text-neutral-400">/</span>
          <Link href="/products" className="transition-colors hover:text-neutral-900">
            Каталог
          </Link>
          <span className="text-neutral-400">/</span>
          <span className="text-neutral-900">Оформление</span>
        </nav>

        {/* Шаги: Information · Shipping · Payment */}
        <div className="mb-10 flex flex-wrap items-center justify-start gap-4 sm:mb-12 sm:gap-8 md:gap-14">
          {(["Контакты", "Доставка", "Оплата"] as const).map((label, i) => {
            const n = (i + 1) as Step
            const active = step === n
            const passed = step > n
            return (
              <div key={label} className="flex items-center gap-4 sm:gap-8 md:gap-14">
                {i > 0 ? (
                  <span className="hidden h-px w-6 bg-neutral-300 sm:block md:w-10" aria-hidden />
                ) : null}
                <button
                  type="button"
                  onClick={() => {
                    if (passed || active) setStep(n)
                  }}
                  disabled={!passed && !active}
                  className={cn(
                    "text-[11px] font-semibold uppercase tracking-[0.22em] transition-colors sm:text-[12px]",
                    active && "text-neutral-950",
                    !active && passed && "cursor-pointer text-neutral-600 hover:text-neutral-900",
                    !active && !passed && "cursor-default text-neutral-400",
                  )}
                >
                  {label}
                </button>
              </div>
            )
          })}
        </div>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start lg:gap-12 xl:gap-16">
          <div className="min-w-0">
            {/* Шаг 1 — Contact + Shipping address */}
            {step === 1 ? (
              <div className="border border-neutral-200 bg-white p-6 sm:p-10">
                <section className="border-b border-neutral-200 pb-8">
                  <h2 className={sectionTitleClass}>Контакты</h2>
                  <div className="grid max-w-md grid-cols-1 gap-4 sm:max-w-lg sm:grid-cols-2 sm:gap-x-5 sm:gap-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="checkout-email" className="sr-only">
                        Электронная почта
                      </Label>
                      <Input
                        id="checkout-email"
                        type="email"
                        autoComplete="email"
                        placeholder="Электронная почта"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={inputClass}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="checkout-phone" className="sr-only">
                        Телефон
                      </Label>
                      <Input
                        id="checkout-phone"
                        type="tel"
                        autoComplete="tel"
                        placeholder="Телефон"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className={inputClass}
                      />
                    </div>
                  </div>
                </section>

                <section className="pt-10">
                  <h2 className={sectionTitleClass}>Адрес доставки</h2>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="fn" className="sr-only">
                        Имя
                      </Label>
                      <Input
                        id="fn"
                        placeholder="Имя"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className={inputClass}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ln" className="sr-only">
                        Фамилия
                      </Label>
                      <Input
                        id="ln"
                        placeholder="Фамилия"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className={inputClass}
                      />
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-3 sm:gap-5">
                    <div className="min-w-0 space-y-2">
                      <Label htmlFor="country" className="sr-only">
                        Страна
                      </Label>
                      <Select value={country} onValueChange={setCountry}>
                        <SelectTrigger id="country" className={countrySelectTriggerClass}>
                          <SelectValue placeholder="Страна" />
                        </SelectTrigger>
                        <SelectContent align="start" className="rounded-none border-neutral-200">
                          <SelectItem value="KZ" className="rounded-none">
                            Казахстан
                          </SelectItem>
                          <SelectItem value="US" className="rounded-none">
                            США
                          </SelectItem>
                          <SelectItem value="CA" className="rounded-none">
                            Канада
                          </SelectItem>
                          <SelectItem value="GB" className="rounded-none">
                            Великобритания
                          </SelectItem>
                          <SelectItem value="AU" className="rounded-none">
                            Австралия
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="min-w-0 space-y-2">
                      <Label htmlFor="state" className="sr-only">
                        Регион / область
                      </Label>
                      <Input
                        id="state"
                        placeholder="Регион / область"
                        value={stateRegion}
                        onChange={(e) => setStateRegion(e.target.value)}
                        className={cn(inputClass, "min-w-0")}
                      />
                    </div>
                  </div>

                  <div className="mt-5 space-y-2">
                    <Label htmlFor="addr" className="sr-only">
                      Адрес
                    </Label>
                    <Input
                      id="addr"
                      placeholder="Адрес"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className={inputClass}
                    />
                  </div>

                  <div className="mt-5 grid gap-5 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="city" className="sr-only">
                        Город
                      </Label>
                      <Input
                        id="city"
                        placeholder="Город"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className={inputClass}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="zip" className="sr-only">
                        Индекс
                      </Label>
                      <Input
                        id="zip"
                        placeholder="Индекс"
                        value={zip}
                        onChange={(e) => setZip(e.target.value)}
                        className={inputClass}
                      />
                    </div>
                  </div>
                </section>

                {formError ? (
                  <p className="mt-6 text-[12px] text-red-600">
                    Заполните все поля в блоках «Контакты» и «Адрес доставки».
                  </p>
                ) : null}

                <div className="mt-10 flex justify-start">
                  <button
                    type="button"
                    onClick={goToShipping}
                    className="inline-flex items-center gap-3 bg-neutral-200 px-8 py-3 text-[12px] font-medium uppercase tracking-[0.14em] text-neutral-900 transition-colors hover:bg-neutral-300"
                  >
                    Доставка
                    <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
                  </button>
                </div>
              </div>
            ) : null}

            {/* Шаг 2 — Delivery */}
            {step === 2 ? (
              <div className="border border-neutral-200 bg-white p-6 sm:p-10">
                <section>
                  <h2 className={sectionTitleClass}>Способ доставки</h2>
                  <div className="flex flex-col gap-3">
                    <button
                      type="button"
                      onClick={() => setDelivery("standard")}
                      className={cn(
                        "flex w-full items-center justify-between border px-4 py-4 text-left transition-colors",
                        delivery === "standard"
                          ? "border-neutral-900 bg-neutral-50"
                          : "border-neutral-200 bg-neutral-100/50 hover:border-neutral-400",
                      )}
                    >
                      <span className="text-[12px] font-medium uppercase tracking-[0.12em] text-neutral-900">
                        Стандарт
                      </span>
                      <span className="text-[13px] tabular-nums text-neutral-700">
                        {formatKzt(checkoutShippingFeeKzt("standard"))}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDelivery("express")}
                      className={cn(
                        "flex w-full items-center justify-between border px-4 py-4 text-left transition-colors",
                        delivery === "express"
                          ? "border-neutral-900 bg-neutral-50"
                          : "border-neutral-200 bg-neutral-100/50 hover:border-neutral-400",
                      )}
                    >
                      <span className="text-[12px] font-medium uppercase tracking-[0.12em] text-neutral-900">
                        Экспресс
                      </span>
                      <span className="text-[13px] tabular-nums text-neutral-700">
                        {formatKzt(checkoutShippingFeeKzt("express"))}
                      </span>
                    </button>
                  </div>
                </section>

                <div className="mt-10 flex flex-wrap items-center justify-start gap-4">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-[11px] uppercase tracking-[0.18em] text-neutral-500 underline-offset-4 hover:text-neutral-900 hover:underline"
                  >
                    ← Назад
                  </button>
                  <button
                    type="button"
                    onClick={goToPayment}
                    className="inline-flex items-center gap-3 bg-neutral-200 px-8 py-3 text-[12px] font-medium uppercase tracking-[0.14em] text-neutral-900 transition-colors hover:bg-neutral-300"
                  >
                    Оплата
                    <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
                  </button>
                </div>
              </div>
            ) : null}

            {/* Шаг 3 — Payment */}
            {step === 3 ? (
              <div className="border border-neutral-200 bg-white p-6 sm:p-10">
                <section>
                  <h2 className={sectionTitleClass}>Оплата</h2>
                  <p className="mb-6 text-[11px] leading-relaxed text-neutral-400">
                    Демо: данные карты не обрабатываются и не сохраняются.
                  </p>
                  <div className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="card" className="sr-only">
                        Номер карты
                      </Label>
                      <Input
                        id="card"
                        inputMode="numeric"
                        placeholder="Номер карты"
                        className={inputClass}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <Label htmlFor="exp" className="sr-only">
                          Срок действия
                        </Label>
                        <Input id="exp" placeholder="ММ / ГГ" className={inputClass} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cvc" className="sr-only">
                          CVC
                        </Label>
                        <Input id="cvc" placeholder="CVC" className={inputClass} />
                      </div>
                    </div>
                  </div>
                </section>

                <div className="mt-10 flex flex-wrap justify-start gap-4">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="text-[11px] uppercase tracking-[0.18em] text-neutral-500 underline-offset-4 hover:text-neutral-900 hover:underline"
                  >
                    ← Назад
                  </button>
                </div>
              </div>
            ) : null}
          </div>

          {/* Summary */}
          <aside className="lg:sticky lg:top-28">
            <div className="border border-neutral-200 bg-white p-6 sm:p-8">
              <h2
                className="mb-6 text-[13px] font-semibold uppercase tracking-[0.18em] text-neutral-950"
                style={{ fontFamily: "var(--font-display), sans-serif" }}
              >
                Ваш заказ
              </h2>
              <ul className="max-h-[320px] space-y-5 overflow-y-auto border-b border-neutral-200 pb-6">
                {lineTotals.map(({ line, product, sum }, i) => {
                  const title = product?.title ?? line.title ?? "Товар"
                  const thumb =
                    product?.gallery[0] ?? line.imageUrl ?? publicAssetUrl("/logo.png")
                  return (
                    <li key={`${line.productId}-${line.size}-${line.colorHex}-${i}`} className="flex gap-3">
                      <div className="relative h-[72px] w-14 shrink-0 overflow-hidden border border-neutral-200 bg-neutral-100">
                        <Image src={thumb} alt="" fill className="object-cover" sizes="56px" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[12px] font-semibold leading-snug text-neutral-950">{title}</p>
                        <p className="mt-1 text-[10px] uppercase tracking-[0.1em] text-neutral-500">
                          {line.size} ·{" "}
                          <span
                            className="inline-block h-2 w-2 align-middle border border-neutral-300"
                            style={{ backgroundColor: line.colorHex }}
                          />
                          {" · "}
                          {line.quantity} шт.
                        </p>
                        <p className="mt-1 text-[12px] tabular-nums text-neutral-800">{formatKzt(sum)}</p>
                      </div>
                    </li>
                  )
                })}
              </ul>
              <dl className="mt-6 space-y-3 text-[12px]">
                <div className="flex justify-between gap-4 text-neutral-600">
                  <dt className="uppercase tracking-[0.12em]">Товары</dt>
                  <dd className="tabular-nums text-neutral-900">{formatKzt(subtotal)}</dd>
                </div>
                {discountKzt > 0 ? (
                  <div className="flex justify-between gap-4 text-emerald-800">
                    <dt className="uppercase tracking-[0.12em]">
                      Скидка{appliedPromo ? ` (${appliedPromo.code})` : ""}
                    </dt>
                    <dd className="tabular-nums">−{formatKzt(discountKzt)}</dd>
                  </div>
                ) : null}
                <div className="space-y-2 border-b border-neutral-100 pb-4">
                  <p className="text-[10px] uppercase tracking-[0.12em] text-neutral-500">
                    Промокод
                  </p>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Код"
                      value={promoInput}
                      onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                      className={cn(inputClass, "h-10 flex-1")}
                      maxLength={32}
                    />
                    <button
                      type="button"
                      disabled={promoLoading}
                      onClick={() => void applyPromoCode()}
                      className="shrink-0 border border-neutral-900 bg-neutral-900 px-3 text-[10px] font-medium uppercase tracking-wider text-white hover:bg-neutral-800 disabled:opacity-50"
                    >
                      {promoLoading ? "…" : "Ок"}
                    </button>
                  </div>
                  {promoError ? <p className="text-[11px] text-red-600">{promoError}</p> : null}
                </div>
                <div className="flex justify-between gap-4 text-neutral-600">
                  <dt className="uppercase tracking-[0.12em]">Доставка</dt>
                  <dd className="tabular-nums text-neutral-900">{formatKzt(shipping)}</dd>
                </div>
                <div className="flex justify-between gap-4 text-neutral-600">
                  <dt className="uppercase tracking-[0.12em]">Налог (оценка)</dt>
                  <dd className="tabular-nums text-neutral-900">{formatKzt(estimatedTax)}</dd>
                </div>
                <div className="flex justify-between gap-4 border-t border-neutral-200 pt-4 text-[13px] font-semibold text-neutral-950">
                  <dt className="uppercase tracking-[0.14em]">Итого</dt>
                  <dd className="tabular-nums" style={{ fontFamily: "var(--font-display), sans-serif" }}>
                    {formatKzt(total)}
                  </dd>
                </div>
              </dl>
              {step === 3 ? (
                <>
                  {placeError ? <p className="mt-4 text-center text-[12px] text-red-600">{placeError}</p> : null}
                  <Button
                    type="button"
                    disabled={placing}
                    className="mt-8 h-12 w-full rounded-none border-0 bg-neutral-900 text-[11px] font-medium uppercase tracking-[0.22em] text-white hover:bg-neutral-800 disabled:opacity-60"
                    onClick={() => void handlePlaceOrder()}
                  >
                    {placing ? "Оформляем..." : "Оформить заказ"}
                  </Button>
                </>
              ) : (
                <p className="mt-6 text-[10px] uppercase tracking-[0.14em] text-neutral-400">
                  {step === 1
                    ? "Перейдите к доставке, чтобы выбрать способ."
                    : "Перейдите к оплате, чтобы завершить заказ."}
                </p>
              )}
              <Link
                href="/products"
                className="mt-4 block text-center text-[10px] uppercase tracking-[0.18em] text-neutral-500 underline-offset-4 hover:text-neutral-900 hover:underline"
              >
                Продолжить покупки
              </Link>
            </div>
          </aside>
        </div>
      </main>
    </div>
  )
}
