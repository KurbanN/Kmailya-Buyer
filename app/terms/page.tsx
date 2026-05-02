import Link from "next/link"

import { StoreHeader } from "@/components/store-header"

export const metadata = {
  title: "Публичная оферта — Kamilya",
  description: "Условия продажи товаров в интернет-магазине Kamilya.",
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white text-neutral-900">
      <StoreHeader />
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-neutral-500">
          Юридическая информация
        </p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-neutral-950">
          Публичная оферта (шаблон)
        </h1>
        <article className="prose prose-neutral mt-8 max-w-none text-[14px] leading-relaxed text-neutral-700">
          <p className="rounded border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] text-amber-950">
            Это пример текста для разработки и тестирования. Перед реальными продажами замените на
            утверждённую вашим юристом оферту с реквизитами продавца, порядком оплаты и доставки по
            Казахстану.
          </p>
          <h2 className="mt-10 text-lg font-semibold text-neutral-950">1. Общие положения</h2>
          <p className="mt-3">
            Настоящая оферта определяет условия розничной купли-продажи товаров через сайт Kamilya.
            Оформление заказа означает полное и безоговорочное принятие условий.
          </p>
          <h2 className="mt-10 text-lg font-semibold text-neutral-950">2. Товар и цена</h2>
          <p className="mt-3">
            Цены указаны в тенге (₸). Изображения и описания носят информационный характер.
            Продавец вправе изменять цены до момента подтверждения заказа.
          </p>
          <h2 className="mt-10 text-lg font-semibold text-neutral-950">3. Оплата и доставка</h2>
          <p className="mt-3">
            Способы оплаты и доставки указываются при оформлении заказа. Сроки доставки являются
            ориентировочными.
          </p>
          <h2 className="mt-10 text-lg font-semibold text-neutral-950">4. Контакты</h2>
          <p className="mt-3">
            По вопросам заказов используйте контакты, указанные на сайте в разделе поддержки (добавьте
            реальные данные).
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
