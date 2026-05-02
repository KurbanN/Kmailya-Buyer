import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Каталог — Kamilya",
  description:
    "Каталог одежды и аксессуаров: фильтры по размеру, цене и коллекции. Доставка по Казахстану.",
}

export default function ProductsLayout({ children }: { children: React.ReactNode }) {
  return children
}
