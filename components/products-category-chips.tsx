"use client"

import { cn } from "@/lib/utils"
import type { ShopChipId } from "@/lib/plp-filters"

const CHIPS: { id: ShopChipId; label: string }[] = [
  { id: "all", label: "Все" },
  { id: "new", label: "Новинки" },
  { id: "shirts", label: "Рубашки" },
  { id: "polo", label: "Поло" },
  { id: "shorts", label: "Шорты" },
  { id: "bestsellers", label: "Хиты" },
  { id: "tshirts", label: "Футболки" },
  { id: "jeans", label: "Джинсы" },
  { id: "jackets", label: "Куртки" },
]

type Props = {
  active: ShopChipId
  onChange: (id: ShopChipId) => void
}

/** Две строки: 5 + 4 кнопки; активная — усиленная верхняя граница. */
export function ProductsCategoryChips({ active, onChange }: Props) {
  return (
    <div className="relative z-10 grid grid-cols-5 gap-1.5 sm:gap-2">
      {CHIPS.map(({ id, label }) => (
        <button
          key={id}
          type="button"
          onClick={() => onChange(id)}
          className={cn(
            "relative z-10 min-w-0 cursor-pointer border border-neutral-900 bg-white px-1 py-2 text-center text-[8px] font-normal uppercase leading-tight tracking-[0.04em] text-neutral-900 transition-colors hover:bg-neutral-50 sm:px-2 sm:py-2.5 sm:text-[10px] sm:tracking-[0.06em] md:px-3 md:text-[11px]",
            active === id &&
              "border-t-[3px] border-t-neutral-950 pt-[calc(0.5rem-1px)] font-semibold sm:pt-[calc(0.625rem-1px)]",
          )}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
