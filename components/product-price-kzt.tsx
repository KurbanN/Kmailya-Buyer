"use client"

import { displayPriceKztFromCatalog } from "@/lib/currency"
import { cn } from "@/lib/utils"

type Props = {
  price: string
  listPrice?: string
  className?: string
  /** Карточки каталога vs блок цены на PDP */
  variant?: "card" | "detail"
  /** Переопределение стилей (например главная — приглушённый текст) */
  comparePriceClassName?: string
  currentPriceClassName?: string
}

/**
 * Витрина: при скидке — зачёркнутая базовая (чуть меньше), рядом цена со скидкой.
 */
export function ProductPriceKzt({
  price,
  listPrice,
  className,
  variant = "card",
  comparePriceClassName,
  currentPriceClassName,
}: Props) {
  const strikeSize =
    variant === "detail"
      ? "text-[12px] font-normal"
      : "text-[11px] font-normal"
  const currentSize =
    variant === "detail"
      ? "text-[14px] font-medium"
      : "text-[13px] font-medium"

  if (!listPrice) {
    return (
      <span
        className={cn(
          "tabular-nums text-neutral-900",
          variant === "detail" && "text-[14px] font-medium tracking-wide",
          currentPriceClassName,
          className,
        )}
      >
        {displayPriceKztFromCatalog(price)}
      </span>
    )
  }

  return (
    <span
      className={cn(
        "inline-flex flex-wrap items-baseline gap-x-2 gap-y-0.5 tabular-nums",
        className,
      )}
    >
      <span
        className={cn(
          "text-neutral-500 line-through decoration-neutral-400",
          strikeSize,
          comparePriceClassName,
        )}
      >
        {displayPriceKztFromCatalog(listPrice)}
      </span>
      <span
        className={cn(
          "text-neutral-900",
          currentSize,
          currentPriceClassName,
        )}
      >
        {displayPriceKztFromCatalog(price)}
      </span>
    </span>
  )
}
