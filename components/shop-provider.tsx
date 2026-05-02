"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"

import { PRODUCTS } from "@/lib/products-data"
import { kztFromPriceString, kztToUsd } from "@/lib/currency"
import { parsePriceUsd } from "@/lib/plp-filters"

export type CartLine = {
  productId: string
  quantity: number
  size: string
  colorHex: string
  /** Снимок для товаров не из статического каталога (Firestore) */
  title?: string
  imageUrl?: string
  /** Цена одной единицы в ₸ на момент добавления */
  unitPriceKzt?: number
}

type ShopContextValue = {
  /** ID товаров в избранном (массив — безопасно для RSC; Set в context ломал SSR). */
  wishlist: string[]
  toggleWishlist: (productId: string) => void
  isInWishlist: (productId: string) => boolean
  cartLines: CartLine[]
  cartCount: number
  addToCart: (item: {
    productId: string
    size: string
    colorHex: string
    quantity?: number
    title?: string
    imageUrl?: string
    unitPriceKzt?: number
  }) => void
  removeFromCart: (index: number) => void
  setLineQuantity: (index: number, quantity: number) => void
  clearCart: () => void
}

const WISHLIST_KEY = "kamilya-wishlist"
const CART_KEY = "kamilya-cart"

const ShopContext = createContext<ShopContextValue | null>(null)

function loadJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function ShopProvider({ children }: { children: ReactNode }) {
  const [wishlist, setWishlist] = useState<string[]>([])
  const [cart, setCart] = useState<CartLine[]>([])
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setWishlist(loadJson<string[]>(WISHLIST_KEY, []))
    setCart(loadJson<CartLine[]>(CART_KEY, []))
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    localStorage.setItem(WISHLIST_KEY, JSON.stringify(wishlist))
  }, [wishlist, hydrated])

  useEffect(() => {
    if (!hydrated) return
    localStorage.setItem(CART_KEY, JSON.stringify(cart))
  }, [cart, hydrated])

  const toggleWishlist = useCallback((id: string) => {
    setWishlist((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }, [])

  const isInWishlist = useCallback((id: string) => wishlist.includes(id), [wishlist])

  const addToCart = useCallback(
    (item: {
      productId: string
      size: string
      colorHex: string
      quantity?: number
      title?: string
      imageUrl?: string
      unitPriceKzt?: number
    }) => {
      const q = item.quantity ?? 1
      const snap = {
        title: item.title,
        imageUrl: item.imageUrl,
        unitPriceKzt: item.unitPriceKzt,
      }
      setCart((prev) => {
        const idx = prev.findIndex(
          (l) =>
            l.productId === item.productId &&
            l.size === item.size &&
            l.colorHex === item.colorHex,
        )
        if (idx >= 0) {
          const next = [...prev]
          const line = next[idx]!
          next[idx] = {
            ...line,
            quantity: line.quantity + q,
            title: line.title ?? snap.title,
            imageUrl: line.imageUrl ?? snap.imageUrl,
            unitPriceKzt: line.unitPriceKzt ?? snap.unitPriceKzt,
          }
          return next
        }
        return [
          ...prev,
          {
            productId: item.productId,
            size: item.size,
            colorHex: item.colorHex,
            quantity: q,
            ...snap,
          },
        ]
      })
    },
    [],
  )

  const removeFromCart = useCallback((index: number) => {
    setCart((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const setLineQuantity = useCallback((index: number, quantity: number) => {
    setCart((prev) => {
      if (quantity <= 0) return prev.filter((_, i) => i !== index)
      const next = [...prev]
      const line = next[index]
      if (!line) return prev
      next[index] = { ...line, quantity }
      return next
    })
  }, [])

  const clearCart = useCallback(() => setCart([]), [])

  const cartCount = useMemo(
    () => cart.reduce((sum, l) => sum + l.quantity, 0),
    [cart],
  )

  const value = useMemo(
    (): ShopContextValue => ({
      wishlist,
      toggleWishlist,
      isInWishlist,
      cartLines: cart,
      cartCount,
      addToCart,
      removeFromCart,
      setLineQuantity,
      clearCart,
    }),
    [
      wishlist,
      toggleWishlist,
      isInWishlist,
      cart,
      cartCount,
      addToCart,
      removeFromCart,
      setLineQuantity,
      clearCart,
    ],
  )

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>
}

export function useShop(): ShopContextValue {
  const ctx = useContext(ShopContext)
  if (!ctx) {
    throw new Error("useShop must be used within ShopProvider")
  }
  return ctx
}

function lineUnitKzt(line: CartLine): number {
  const p = PRODUCTS[line.productId]
  if (p) return kztFromPriceString(p.price)
  if (line.unitPriceKzt != null && Number.isFinite(line.unitPriceKzt)) {
    return line.unitPriceKzt
  }
  return 0
}

/** Сумма корзины в USD (для отчётов; позиции без цены в ₸ не учитываются). */
export function cartSubtotalUsd(lines: CartLine[]): number {
  let sum = 0
  for (const line of lines) {
    const p = PRODUCTS[line.productId]
    if (p) {
      sum += parsePriceUsd(p.price) * line.quantity
      continue
    }
    const kzt = lineUnitKzt(line)
    if (kzt > 0) {
      sum += kztToUsd(kzt) * line.quantity
    }
  }
  return sum
}

/** Сумма корзины в ₸ (для отображения и оформления). */
export function cartSubtotalKzt(lines: CartLine[]): number {
  let sum = 0
  for (const line of lines) {
    sum += lineUnitKzt(line) * line.quantity
  }
  return sum
}
