import Link from "next/link"

import { StoreHeader } from "@/components/store-header"

export const metadata = {
  title: "Возврат и обмен — Kamilya",
  description: "Условия возврата товара надлежащего качества в Kamilya.",
}

export default function ReturnsPage() {
  return (
    <div className="min-h-screen bg-white text-neutral-900">
      <StoreHeader />
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-neutral-500">
          Покупателям
        </p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-neutral-950">
          Возврат и обмен (шаблон)
        </h1>
        <article className="mt-8 max-w-none text-[14px] leading-relaxed text-neutral-700">
          <p className="rounded border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] text-amber-950">
            Учитывайте Закон РК «О защите прав потребителей». Зафиксируйте сроки (обычно 14 дней),
            сохранность товарного вида и бирок — по согласованию с вашей операционной моделью.
          </p>
          <h2 className="mt-10 text-lg font-semibold text-neutral-950">Возврат надлежащего качества</h2>
          <p className="mt-3">
            Если товар не подошёл по размеру или фасону, вы можете оформить возврат в срок и при
            условии сохранения товарного вида, потребительских свойств и документов (шаблон — уточните
            процесс: личный кабинет, служба поддержки, пункт выдачи).
          </p>
          <h2 className="mt-10 text-lg font-semibold text-neutral-950">Возврат брака</h2>
          <p className="mt-3">
            При обнаружении недостатков свяжитесь с поддержкой в течение разумного срока; возможны
            замена или возврат денежных средств по правилам закона и магазина.
          </p>
        </article>
        <p className="mt-10">
          <Link href="/" className="text-[12px] uppercase tracking-wider text-neutral-600 underline">
            На главную
          </Link>
        </p>
      </main>
    </div>
  )
}
