"use client"

import Link from "next/link"
import { Star } from "lucide-react"

import { cn } from "@/lib/utils"

type Props = {
  productId: string
  reviewCount?: number
  averageRating?: number
  className?: string
}

export function ProductReviewPlpLink({
  productId,
  reviewCount = 0,
  averageRating,
  className,
}: Props) {
  const filled =
    reviewCount > 0 && averageRating != null
      ? Math.min(5, Math.round(averageRating))
      : 0

  return (
    <Link
      href={`/product/${productId}#otzyvy`}
      className={cn(
        "inline-flex items-center gap-1.5 text-[11px] text-neutral-500 transition-colors hover:text-neutral-900",
        className,
      )}
      onClick={(e) => e.stopPropagation()}
    >
      <span className="flex gap-0.5" aria-hidden>
        {[0, 1, 2, 3, 4].map((i) => (
          <Star
            key={i}
            className={cn(
              "h-3 w-3",
              i < filled ? "fill-neutral-900 text-neutral-900" : "fill-none text-neutral-300",
            )}
            strokeWidth={1.2}
          />
        ))}
      </span>
      <span className="tabular-nums text-neutral-500">({reviewCount})</span>
    </Link>
  )
}
