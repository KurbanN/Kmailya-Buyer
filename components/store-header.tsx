"use client"

import Link from "next/link"
import { Menu, ShoppingBag, User } from "lucide-react"

import { useAuth } from "@/components/auth-provider"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { ShoppingCartSheet } from "@/components/shopping-cart-sheet"
import { WishlistNavTriggerIcon, WishlistSheet } from "@/components/wishlist-sheet"
import { useShop } from "@/components/shop-provider"
import { SiteLogo } from "@/components/site-logo"

/** Шапка storefront как в [Cloth Store UI Kit](https://www.figma.com/design/OsugbuPt2iMQZ55YLW1SJu/Cloth-Store-%7C-Fashion-Store-%7C-E-commerce-UI-Kit--Community-) — переиспользуется на главной и `/products`. */
export function StoreHeader() {
  const { user } = useAuth()
  const { cartCount, wishlist } = useShop()
  const wishlistCount = wishlist.length
  const accountHref = user ? "/account" : "/login?callbackUrl=/account"

  return (
    <header className="sticky top-0 z-50 border-b border-neutral-200/80 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1320px] items-center justify-between gap-2 py-2.5 pl-1.5 pr-3 sm:gap-3 sm:py-3 sm:pl-2 sm:pr-6">
        <Link
          href="/"
          className="flex h-11 shrink-0 items-center overflow-hidden sm:h-[52px]"
          style={{ maxWidth: "min(260px, 46vw)" }}
          aria-label="Kamilya — на главную"
        >
          <SiteLogo
            sizeClassName="h-full max-h-full w-auto"
            imgClassName="object-left"
            className="max-w-full object-contain"
          />
        </Link>

        <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-4 lg:gap-7">
          <Sheet>
            <SheetTrigger asChild>
              <button
                type="button"
                className="shrink-0 text-neutral-900 lg:hidden"
                aria-label="Открыть меню"
              >
                <Menu className="h-6 w-6" strokeWidth={1.5} />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px]">
              <SheetHeader>
                <SheetTitle className="text-left uppercase tracking-[0.2em]">
                  Меню
                </SheetTitle>
              </SheetHeader>
              <nav className="mt-8 flex flex-col gap-4 text-sm font-medium uppercase tracking-[0.15em]">
                <Link href="/" className="text-neutral-800">
                  Главная
                </Link>
                <Link href="/products" className="text-neutral-800">
                  Каталог
                </Link>
                <Link href="/#collections" className="text-neutral-800">
                  Коллекции
                </Link>
                <Link href="/#deals" className="text-neutral-800">
                  Новинки
                </Link>
                <Link href={accountHref} className="text-neutral-800">
                  {user ? "Кабинет" : "Войти"}
                </Link>
              </nav>
            </SheetContent>
          </Sheet>

          <nav className="hidden items-center gap-5 text-[11px] font-medium uppercase tracking-[0.2em] text-neutral-800 lg:flex xl:gap-6">
            <Link href="/" className="transition-colors hover:text-neutral-500">
              Главная
            </Link>
            <Link href="/products" className="transition-colors hover:text-neutral-500">
              Каталог
            </Link>
            <Link href="/#collections" className="transition-colors hover:text-neutral-500">
              Коллекции
            </Link>
            <Link href="/#deals" className="transition-colors hover:text-neutral-500">
              Новинки
            </Link>
          </nav>
        </div>

        <div className="flex shrink-0 items-center justify-end gap-2 sm:gap-4 md:pl-2">
          <WishlistSheet>
            <button
              type="button"
              className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-neutral-800 transition-colors hover:bg-neutral-100 hover:text-neutral-900 sm:h-11 sm:w-11"
              aria-label="Избранное"
            >
              <WishlistNavTriggerIcon active={wishlistCount > 0} className="h-5 w-5 sm:h-[22px] sm:w-[22px]" />
              {wishlistCount > 0 ? (
                <span className="absolute -right-0.5 -top-0.5 flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-neutral-900 px-1 text-[9px] font-semibold leading-none text-white ring-2 ring-white">
                  {wishlistCount > 99 ? "99+" : wishlistCount}
                </span>
              ) : null}
            </button>
          </WishlistSheet>

          <ShoppingCartSheet>
            <button
              type="button"
              className="relative inline-flex h-[42px] items-center gap-2.5 rounded-full bg-neutral-900 pl-4 pr-3 text-[11px] font-medium uppercase tracking-[0.18em] text-white sm:gap-3 sm:pl-5 sm:text-xs sm:tracking-[0.2em]"
              aria-label="Открыть корзину"
            >
              <span>Корзина</span>
              <span className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/15">
                <ShoppingBag className="h-4 w-4 text-white sm:h-[18px] sm:w-[18px]" strokeWidth={1.35} />
                {cartCount > 0 ? (
                  <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-white px-1 text-[10px] font-semibold leading-none text-neutral-900 ring-1 ring-neutral-200/80">
                    {cartCount > 99 ? "99+" : cartCount}
                  </span>
                ) : null}
              </span>
            </button>
          </ShoppingCartSheet>
          <Link
            href={accountHref}
            className="text-neutral-800 transition-colors hover:text-neutral-500"
            aria-label={user ? "Кабинет" : "Войти"}
          >
            <User className="h-5 w-5 sm:h-[22px] sm:w-[22px]" strokeWidth={1.5} />
            {user?.email ? (
              <span className="sr-only">{user.email}</span>
            ) : null}
          </Link>
        </div>
      </div>
    </header>
  )
}
