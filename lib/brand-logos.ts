import { publicAssetUrl } from "@/lib/public-asset-url"

/**
 * Логотипы из `public/brand` — используются на главной странице.
 * Добавьте файл в папку и запись в массив.
 */
export const BRAND_LOGO_FILES: { file: string; alt: string }[] = [
  { file: "armani-exchange-eps-vector-logo.png", alt: "Armani Exchange" },
  { file: "CK_Calvin_Klein_logo.svg", alt: "Calvin Klein" },
  { file: "guess.png", alt: "Guess" },
  { file: "Michael_Kors_Logo.svg.png", alt: "Michael Kors" },
  { file: "nike-4-logo.png", alt: "Nike" },
  { file: "nb.png", alt: "New Balance" },
  { file: "tommy-hilfiger-0.png", alt: "Tommy Hilfiger" },
]

export function brandLogoSrc(file: string) {
  return publicAssetUrl(`/brand/${encodeURIComponent(file)}`)
}
