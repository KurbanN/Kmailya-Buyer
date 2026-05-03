import { publicAssetUrl } from "@/lib/public-asset-url"
import { cn } from "@/lib/utils"

type Props = {
  className?: string
  /** Класс высоты, по умолчанию h-8 (32px) */
  sizeClassName?: string
  /** Смещение картинки (например object-left в шапке) */
  imgClassName?: string
}

/**
 * Обычный `<img>`, без `next/image` — иначе битый/не-PNG `logo.png` может ронять SSR с 500.
 * Положите файл в `public/logo.png` или `public/logo.jpeg`.
 */
export function SiteLogo({ className, sizeClassName = "h-8", imgClassName }: Props) {
  return (
    <img
      src={publicAssetUrl("/logo.png")}
      alt="Kamilya"
      width={200}
      height={48}
      className={cn(
        sizeClassName,
        "w-auto max-w-[200px] object-contain",
        imgClassName,
        className,
      )}
      decoding="async"
      fetchPriority="high"
      onError={(e) => {
        const el = e.currentTarget
        if (!el.src.includes("logo.jpeg")) {
          el.src = publicAssetUrl("/logo.jpeg")
        }
      }}
    />
  )
}
