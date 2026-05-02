"use client"

import { usePathname } from "next/navigation"

import { StoreFooter } from "@/components/store-footer"

export function ConditionalFooter() {
  const pathname = usePathname()
  if (pathname?.startsWith("/admin")) return null
  /** Главная использует свой развёрнутый футер в `app/page.tsx`. */
  if (pathname === "/") return null
  return <StoreFooter />
}
