import { publicAssetUrl } from "@/lib/public-asset-url"

/** Локальные файлы в `public/products/` */
export const PRODUCT_FILES = [
  "Rectangle 3-1.png",
  "Rectangle 3-2.png",
  "Rectangle 3-3.png",
  "Rectangle 3-4.png",
  "Rectangle 3-5.png",
  "Rectangle 3.png",
] as const

export const productSrc = (file: (typeof PRODUCT_FILES)[number]) =>
  `/products/${encodeURIComponent(file)}`

export const P = PRODUCT_FILES.map(productSrc)

export type ProductDetail = {
  id: string
  /** Заголовок на PDP (как в Figma — caps) */
  title: string
  /** Эффективная цена в каталоге (`$12`) — для совместимости с фильтрами и корзиной */
  price: string
  /** Зачёркнутая «базовая» цена при скидке (`$49`), только если цена со скидкой ниже базовой */
  listPrice?: string
  mrpNote: string
  description: string
  /** Главное фото + превью (до 6 кадров) */
  gallery: string[]
  colors: { hex: string }[]
  sizes: string[]
  /** Для списков на главной */
  listCategory?: string
  /** Наличие на PLP (фильтр Availability) */
  inStock?: boolean
  /** Название бренда (из Firestore), для подписи на карточке */
  brandName?: string
  /** Остаток на складе (Firestore / админка) */
  stockCount?: number
  reviewCount?: number
  averageRating?: number
  /** Соответствие чипам «Новинки» / «Хиты»; из Firestore `merchandisingTag`. */
  merchandisingTag?: "new" | "hit"
  /** Сортировка «Рекомендуемые» на PLP; меньше — выше в списке. */
  plpSortKey?: number
}

function rotateGallery(start: number): string[] {
  const n = P.length
  return Array.from({ length: n }, (_, i) =>
    publicAssetUrl(P[(start + i) % n]!),
  )
}

export const PRODUCTS: Record<string, ProductDetail> = {
  n1: {
    id: "n1",
    title: "Embroidered oversized shirt",
    price: "$39",
    mrpNote: "MRP incl. of all taxes",
    description:
      "Relaxed-fit shirt. Camp collar and short sleeves. Button-up front.",
    gallery: rotateGallery(0),
    colors: [
      { hex: "#d9d9d9" },
      { hex: "#a9a9a9" },
      { hex: "#1e1e1e" },
      { hex: "#a6d6ca" },
      { hex: "#ffffff" },
      { hex: "#b9c1e8" },
    ],
    sizes: ["XS", "S", "M", "L", "XL", "2X"],
  },
  n2: {
    id: "n2",
    title: "Essential cotton tee",
    price: "$29",
    mrpNote: "MRP incl. of all taxes",
    description: "Soft jersey tee. Crew neck. Everyday essential fit.",
    gallery: rotateGallery(1),
    colors: [
      { hex: "#d9d9d9" },
      { hex: "#a9a9a9" },
      { hex: "#1e1e1e" },
      { hex: "#a6d6ca" },
      { hex: "#ffffff" },
      { hex: "#b9c1e8" },
    ],
    sizes: ["XS", "S", "M", "L", "XL", "2X"],
  },
  n3: {
    id: "n3",
    title: "Graphic boxy tee",
    price: "$34",
    mrpNote: "MRP incl. of all taxes",
    description: "Boxy silhouette. Dropped shoulder. Statement graphic.",
    gallery: rotateGallery(2),
    colors: [
      { hex: "#d9d9d9" },
      { hex: "#a9a9a9" },
      { hex: "#1e1e1e" },
      { hex: "#a6d6ca" },
      { hex: "#ffffff" },
      { hex: "#b9c1e8" },
    ],
    sizes: ["XS", "S", "M", "L", "XL", "2X"],
  },
  n4: {
    id: "n4",
    title: "Long sleeve rib",
    price: "$42",
    inStock: false,
    mrpNote: "MRP incl. of all taxes",
    description: "Ribbed cuffs and hem. Layer-friendly weight.",
    gallery: rotateGallery(3),
    colors: [
      { hex: "#d9d9d9" },
      { hex: "#a9a9a9" },
      { hex: "#1e1e1e" },
      { hex: "#a6d6ca" },
      { hex: "#ffffff" },
      { hex: "#b9c1e8" },
    ],
    sizes: ["XS", "S", "M", "L", "XL", "2X"],
  },
  c1: {
    id: "c1",
    title: "Basic heavy weight t-shirt",
    price: "$150",
    listCategory: "Cotton t-shirt",
    mrpNote: "MRP incl. of all taxes",
    description:
      "Relaxed-fit shirt. Camp collar and short sleeves. Button-up front.",
    gallery: rotateGallery(4),
    colors: [
      { hex: "#d9d9d9" },
      { hex: "#a9a9a9" },
      { hex: "#1e1e1e" },
      { hex: "#a6d6ca" },
      { hex: "#ffffff" },
      { hex: "#b9c1e8" },
    ],
    sizes: ["XS", "S", "M", "L", "XL", "2X"],
  },
  c2: {
    id: "c2",
    title: "Studio relaxed pullover",
    price: "$210",
    listCategory: "Knit",
    mrpNote: "MRP incl. of all taxes",
    description: "Soft knit. Easy drape. Designed for studio-to-street days.",
    gallery: rotateGallery(5),
    colors: [
      { hex: "#d9d9d9" },
      { hex: "#a9a9a9" },
      { hex: "#1e1e1e" },
      { hex: "#a6d6ca" },
      { hex: "#ffffff" },
      { hex: "#b9c1e8" },
    ],
    sizes: ["XS", "S", "M", "L", "XL", "2X"],
  },
  c3: {
    id: "c3",
    title: "Neutral rib knit set",
    price: "$185",
    listCategory: "Loungewear",
    mrpNote: "MRP incl. of all taxes",
    description: "Coordinated rib set. Calm palette. Rest-day uniform.",
    gallery: rotateGallery(2),
    colors: [
      { hex: "#d9d9d9" },
      { hex: "#a9a9a9" },
      { hex: "#1e1e1e" },
      { hex: "#a6d6ca" },
      { hex: "#ffffff" },
      { hex: "#b9c1e8" },
    ],
    sizes: ["XS", "S", "M", "L", "XL", "2X"],
  },
}

export function getProduct(id: string): ProductDetail | undefined {
  return PRODUCTS[id]
}
