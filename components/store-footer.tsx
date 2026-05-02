import Link from "next/link"

/** Компактный футер для всех страниц, кроме главной (там свой блок в `page.tsx`). */
export function StoreFooter() {
  return (
    <footer className="border-t border-neutral-200 bg-neutral-50">
      <div className="mx-auto flex max-w-[1320px] flex-col gap-6 px-4 py-10 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-x-8 sm:px-6">
        <nav className="flex flex-wrap gap-x-6 gap-y-2 text-[11px] font-medium uppercase tracking-[0.14em] text-neutral-700">
          <Link href="/terms" className="hover:text-neutral-950">
            Оферта
          </Link>
          <Link href="/privacy" className="hover:text-neutral-950">
            Конфиденциальность
          </Link>
          <Link href="/returns" className="hover:text-neutral-950">
            Возврат
          </Link>
          <Link href="/size-guide" className="hover:text-neutral-950">
            Таблица размеров
          </Link>
        </nav>
        <p className="text-[11px] tabular-nums text-neutral-500 sm:text-right">
          © {new Date().getFullYear()} Kamilya
        </p>
      </div>
    </footer>
  )
}
