import Link from "next/link"

import { StoreHeader } from "@/components/store-header"

export const metadata = {
  title: "Таблица размеров — Kamilya",
  description: "Ориентировочные мерки для подбора размера одежды.",
}

const rows = [
  { size: "XXS", chest: "76–80", waist: "58–62", hips: "84–88" },
  { size: "XS", chest: "80–84", waist: "62–66", hips: "88–92" },
  { size: "S", chest: "84–88", waist: "66–70", hips: "92–96" },
  { size: "M", chest: "88–92", waist: "70–74", hips: "96–100" },
  { size: "L", chest: "92–96", waist: "74–78", hips: "100–104" },
  { size: "XL", chest: "96–100", waist: "78–82", hips: "104–108" },
  { size: "XXL", chest: "100–104", waist: "82–86", hips: "108–112" },
]

export default function SizeGuidePage() {
  return (
    <div className="min-h-screen bg-white text-neutral-900">
      <StoreHeader />
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-neutral-500">
          Подбор размера
        </p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-neutral-950">
          Таблица размеров
        </h1>
        <p className="mt-4 text-[13px] leading-relaxed text-neutral-600">
          Значения в сантиметрах, ориентировочно для верхней одежды и трикотажа. У разных брендов
          посадка может отличаться — сверяйтесь с описанием конкретной модели.
        </p>
        <div className="mt-8 overflow-x-auto border border-neutral-200">
          <table className="w-full min-w-[320px] border-collapse text-left text-[13px]">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50">
                <th className="px-4 py-3 font-semibold text-neutral-950">Размер</th>
                <th className="px-4 py-3 font-semibold text-neutral-950">Грудь</th>
                <th className="px-4 py-3 font-semibold text-neutral-950">Талия</th>
                <th className="px-4 py-3 font-semibold text-neutral-950">Бёдра</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.size} className="border-b border-neutral-100 last:border-0">
                  <td className="px-4 py-3 font-medium tabular-nums text-neutral-950">{r.size}</td>
                  <td className="px-4 py-3 text-neutral-700">{r.chest}</td>
                  <td className="px-4 py-3 text-neutral-700">{r.waist}</td>
                  <td className="px-4 py-3 text-neutral-700">{r.hips}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-10">
          <Link href="/products" className="text-[12px] uppercase tracking-wider text-neutral-600 underline">
            В каталог
          </Link>
        </p>
      </main>
    </div>
  )
}
