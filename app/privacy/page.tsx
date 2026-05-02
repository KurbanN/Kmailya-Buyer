import Link from "next/link"

import { StoreHeader } from "@/components/store-header"

export const metadata = {
  title: "Политика конфиденциальности — Kamilya",
  description: "Обработка персональных данных покупателей Kamilya.",
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white text-neutral-900">
      <StoreHeader />
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-neutral-500">
          Персональные данные
        </p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-neutral-950">
          Политика конфиденциальности (шаблон)
        </h1>
        <article className="mt-8 max-w-none text-[14px] leading-relaxed text-neutral-700">
          <p className="rounded border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] text-amber-950">
            Шаблон для разработки. Для соответствия законодательству РК о персональных данных и GDPR
            (если есть клиенты из ЕС) подготовьте финальный текст с юристом.
          </p>
          <h2 className="mt-10 text-lg font-semibold text-neutral-950">Какие данные мы собираем</h2>
          <p className="mt-3">
            Контактные данные (имя, телефон, email), адрес доставки, история заказов — для исполнения
            договора купли-продажи и поддержки клиентов.
          </p>
          <h2 className="mt-10 text-lg font-semibold text-neutral-950">Хранение и безопасность</h2>
          <p className="mt-3">
            Данные обрабатываются с использованием современных средств защиты. Срок хранения —
            необходимый для целей обработки или требования закона.
          </p>
          <h2 className="mt-10 text-lg font-semibold text-neutral-950">Ваши права</h2>
          <p className="mt-3">
            Вы можете запросить доступ, исправление или удаление персональных данных — напишите на
            контактный email магазина (укажите реальный адрес).
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
