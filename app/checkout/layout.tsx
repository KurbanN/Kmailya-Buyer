import type { Metadata } from "next"
import type { ReactNode } from "react"

export const metadata: Metadata = {
  title: "Checkout — Kamilya",
  description: "Shipping, delivery, and payment — Cloth Store style checkout.",
}

export default function CheckoutLayout({ children }: { children: ReactNode }) {
  return children
}
