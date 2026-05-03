"use client"

import Image from "next/image"
import Link from "next/link"
import { useCallback, useState } from "react"
import { ArrowLeft, ArrowRight, ChevronDown, Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { SiteLogo } from "@/components/site-logo"
import { StoreHeader } from "@/components/store-header"
import { ProductPriceKzt } from "@/components/product-price-kzt"
import { BRAND_LOGO_FILES, brandLogoSrc } from "@/lib/brand-logos"
import { P, PRODUCTS } from "@/lib/products-data"
import { cn } from "@/lib/utils"

/** Герой в духе [Figma UI Kit](https://www.figma.com/design/rq1sVrrYonkrWHRFXXTrJg/Online-Shopping-Website-Design---eCommerce-Store-Website---UI-Kit--Community-?node-id=105-18) */
const heroImages = {
  leftTall: P[0]!,
  rightTall: P[1]!,
  midTop: P[2]!,
  midBottom: P[3]!,
} as const

const newThisWeekIds = ["n1", "n2", "n3", "n4"] as const
const newThisWeek = newThisWeekIds.map((id) => ({
  id,
  name: PRODUCTS[id].title,
  price: PRODUCTS[id].price,
  listPrice: PRODUCTS[id].listPrice,
  image: PRODUCTS[id].gallery[0],
}))

const collectionIds = ["c1", "c2", "c3"] as const
const collectionProducts = collectionIds.map((id) => ({
  id,
  category: PRODUCTS[id].listCategory ?? "",
  name: PRODUCTS[id].title,
  price: PRODUCTS[id].price,
  listPrice: PRODUCTS[id].listPrice,
  image: PRODUCTS[id].gallery[0],
}))

const lookbook = [P[1], P[2], P[3], P[5]]

type CategoryTab = "all" | "men" | "women" | "kid"

export default function HomePage() {
  const [newWeekApi, setNewWeekApi] = useState<CarouselApi>()
  const [category, setCategory] = useState<CategoryTab>("all")

  const scrollNewWeek = useCallback(
    (dir: "prev" | "next") => {
      if (!newWeekApi) return
      dir === "prev" ? newWeekApi.scrollPrev() : newWeekApi.scrollNext()
    },
    [newWeekApi],
  )

  return (
    <div className="min-h-screen bg-white text-neutral-900 antialiased">
      <StoreHeader />

      <main>
        {/* Герой: 3 колонки как в Figma — боковые портреты, центр: два баннера + типографика + CTA */}
        <section className="border-b border-neutral-200 bg-white py-6 sm:py-8 lg:py-9">
          <div className="mx-auto max-w-[1320px] px-4 sm:px-6">
            {/* Мобильная версия */}
            <div className="mx-auto flex max-w-[1040px] flex-col gap-5 lg:hidden">
              <div className="flex flex-col items-center px-2 text-center">
                <p
                  className="text-[clamp(1.85rem,8.5vw,2.75rem)] font-semibold uppercase leading-none tracking-[-0.03em] text-neutral-700"
                  style={{ fontFamily: "var(--font-display), sans-serif" }}
                >
                  ULTIMATE
                </p>
                <p
                  className="mt-0.5 text-[clamp(2.5rem,14vw,4.5rem)] font-medium uppercase leading-[0.95] tracking-[-0.05em] text-transparent [-webkit-text-stroke:1.5px_#171717]"
                  style={{
                    fontFamily: "var(--font-display), sans-serif",
                    WebkitTextStroke: "1.5px #171717",
                  }}
                >
                  SALE
                </p>
                <p className="mt-3 text-[10px] font-medium uppercase tracking-[0.32em] text-neutral-600 sm:text-[11px]">
                  NEW COLLECTION
                </p>
                <Button
                  className="mt-6 h-12 rounded-[10px] bg-neutral-900 px-10 text-[13px] font-medium uppercase tracking-[0.08em] text-white shadow-[0_20px_35px_rgba(0,0,0,0.15)] hover:bg-neutral-800"
                  asChild
                >
                  <Link href="/products">В каталог</Link>
                </Button>
              </div>
              <div className="grid gap-2.5 sm:gap-3">
                <div className="relative aspect-[3/1] overflow-hidden rounded-xl bg-[#e5e5e5] sm:aspect-[2.85/1]">
                  <Image
                    src={heroImages.midTop}
                    alt="Коллекция — групповой кадр"
                    fill
                    className="object-cover object-center"
                    sizes="100vw"
                    priority
                  />
                </div>
                <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                  <div className="relative aspect-[3/5] max-h-[280px] overflow-hidden rounded-xl bg-[#e5e5e5] sm:max-h-none">
                    <Image
                      src={heroImages.leftTall}
                      alt="Коллекция — образ 1"
                      fill
                      className="object-cover object-bottom"
                      sizes="50vw"
                      priority
                    />
                  </div>
                  <div className="relative aspect-[3/5] max-h-[280px] overflow-hidden rounded-xl bg-[#e5e5e5] sm:max-h-none">
                    <Image
                      src={heroImages.rightTall}
                      alt="Коллекция — образ 2"
                      fill
                      className="object-cover object-bottom"
                      sizes="50vw"
                      priority
                    />
                  </div>
                </div>
                <div className="relative aspect-[3/1] overflow-hidden rounded-xl bg-[#f5b0a1] sm:aspect-[2.85/1]">
                  <Image
                    src={heroImages.midBottom}
                    alt="Коллекция — новинки"
                    fill
                    className="object-cover object-center"
                    sizes="100vw"
                    priority
                  />
                </div>
              </div>
            </div>

            {/* Десктоп: компактная сетка — освобождает место для полосы брендов */}
            <div className="mx-auto hidden max-w-[1040px] gap-3 lg:grid lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1.15fr)_minmax(0,1.05fr)] lg:items-stretch lg:gap-4">
              <div className="relative min-h-[300px] max-h-[min(52vh,480px)] overflow-hidden rounded-xl bg-[#e5e5e5] lg:min-h-[360px]">
                <Image
                  src={heroImages.leftTall}
                  alt="Коллекция — полный рост"
                  fill
                  className="object-cover object-bottom"
                  sizes="(max-width: 1040px) 28vw, 290px"
                  priority
                />
              </div>

              <div className="flex min-h-[300px] max-h-[min(52vh,480px)] flex-col gap-3 lg:min-h-[360px]">
                <div className="relative h-[92px] shrink-0 overflow-hidden rounded-xl bg-[#e5e5e5] sm:h-[100px] lg:h-[108px]">
                  <Image
                    src={heroImages.midTop}
                    alt="Коллекция — групповой кадр"
                    fill
                    className="object-cover object-[center_20%]"
                    sizes="(max-width: 1040px) 38vw, 400px"
                    priority
                  />
                </div>

                <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-1 px-2 py-3">
                  <p
                    className="text-center text-[clamp(1.75rem,3.2vw,3.5rem)] font-semibold uppercase leading-none tracking-[-0.04em] text-neutral-700"
                    style={{ fontFamily: "var(--font-display), sans-serif" }}
                  >
                    ULTIMATE
                  </p>
                  <p
                    className="text-center text-[clamp(2.25rem,7vw,6.5rem)] font-medium uppercase leading-[0.95] tracking-[-0.05em] text-transparent [-webkit-text-stroke:1.75px_#171717]"
                    style={{
                      fontFamily: "var(--font-display), sans-serif",
                      WebkitTextStroke: "1.75px #171717",
                    }}
                  >
                    SALE
                  </p>
                  <p className="mt-1.5 text-center text-[11px] font-normal uppercase tracking-[0.22em] text-neutral-600 sm:text-xs">
                    NEW COLLECTION
                  </p>
                  <Button
                    className="mt-4 h-11 min-w-[180px] rounded-[10px] bg-neutral-900 px-6 text-[13px] font-medium uppercase tracking-wide text-white shadow-[0_16px_28px_rgba(0,0,0,0.12)] hover:bg-neutral-800 sm:h-12 sm:text-sm"
                    asChild
                  >
                    <Link href="/products">В каталог</Link>
                  </Button>
                </div>

                <div className="relative h-[92px] shrink-0 overflow-hidden rounded-xl bg-[#f5b0a1] sm:h-[100px] lg:h-[108px]">
                  <Image
                    src={heroImages.midBottom}
                    alt="Коллекция — кампания"
                    fill
                    className="object-cover object-center"
                    sizes="(max-width: 1040px) 38vw, 400px"
                    priority
                  />
                </div>
              </div>

              <div className="relative min-h-[300px] max-h-[min(52vh,480px)] overflow-hidden rounded-xl bg-[#e5e5e5] lg:min-h-[360px]">
                <Image
                  src={heroImages.rightTall}
                  alt="Коллекция — полный рост"
                  fill
                  className="object-cover object-bottom"
                  sizes="(max-width: 1040px) 28vw, 290px"
                  priority
                />
              </div>
            </div>
          </div>
        </section>

        {/* Полоса брендов — как в UI Kit под героем */}
        <section
          className="border-b border-neutral-200 bg-white py-6 shadow-[0_12px_40px_rgba(68,68,68,0.04)] sm:py-8"
          aria-label="Бренды-партнёры"
        >
          {/* Без горизонтального скролла: перенос строк; Tommy — ~2× базового слота */}
          <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-x-4 gap-y-6 px-4 sm:gap-x-5 sm:px-6 md:max-w-6xl md:gap-x-6">
            {BRAND_LOGO_FILES.map(({ file, alt }) => {
              const isTommy = file === "tommy-hilfiger-0.png"
              const isNb = file === "nb.png"
              return (
                <div
                  key={file}
                  className={cn(
                    "relative shrink-0",
                    isTommy
                      ? "h-[88px] w-[176px] sm:h-[104px] sm:w-[208px] md:h-[128px] md:w-[256px] lg:h-[144px] lg:w-[288px]"
                      : "h-11 w-[88px] sm:h-12 sm:w-[96px] md:h-[52px] md:w-[104px] lg:h-14 lg:w-[112px]",
                  )}
                >
                  <Image
                    src={brandLogoSrc(file)}
                    alt={alt}
                    fill
                    className={cn(
                      "object-contain object-center",
                      /** NB в файле крупнее по полотну — визуально как остальные слоты */
                      isNb &&
                        "origin-center scale-[0.72] sm:scale-[0.76] md:scale-[0.8] lg:scale-[0.82]",
                    )}
                    sizes={
                      isTommy
                        ? "(max-width: 640px) 208px, (max-width: 1024px) 256px, 288px"
                        : "(max-width: 640px) 96px, 112px"
                    }
                  />
                </div>
              )
            })}
          </div>
        </section>

        {/* New this week — якорь Deals для PDP */}
        <section id="deals" className="border-t border-neutral-200 bg-white py-14 scroll-mt-24">
          <div className="mx-auto max-w-[1320px] px-4 sm:px-6">
            <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
              <h2
                className="text-2xl font-semibold uppercase tracking-[0.12em] text-neutral-950 sm:text-3xl"
                style={{ fontFamily: "var(--font-display), sans-serif" }}
              >
                Новинки недели{" "}
                <span className="text-base font-medium text-blue-600 sm:text-xl">
                  (50)
                </span>
              </h2>
              <Link
                href="/products"
                className="text-[11px] font-medium uppercase tracking-[0.2em] text-neutral-600 underline-offset-4 hover:underline"
              >
                Смотреть все
              </Link>
            </div>

            <Carousel
              setApi={setNewWeekApi}
              opts={{ align: "start", loop: true }}
              className="w-full"
            >
              <CarouselContent className="-ml-3 sm:-ml-4">
                {newThisWeek.map((p, index) => (
                  <CarouselItem
                    key={p.id}
                    className="basis-1/2 pl-3 sm:basis-1/3 sm:pl-4 lg:basis-1/4"
                  >
                    <article className="group">
                      <div className="relative mb-4 aspect-[3/4] overflow-hidden bg-neutral-100">
                        <Link
                          href={`/product/${p.id}`}
                          className="relative block h-full w-full"
                        >
                          <Image
                            src={p.image}
                            alt={p.name}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                            priority={index < 2}
                          />
                        </Link>
                        <Link
                          href={`/product/${p.id}`}
                          className="absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center rounded-full border border-white/80 bg-white/90 text-neutral-900 shadow-sm backdrop-blur transition hover:bg-white"
                          aria-label={`Открыть ${p.name}`}
                        >
                          <Plus className="h-4 w-4" strokeWidth={2} />
                        </Link>
                      </div>
                      <Link href={`/product/${p.id}`} className="block">
                        <h3 className="text-sm font-semibold text-neutral-900">
                          {p.name}
                        </h3>
                        <p className="mt-1 text-xs tracking-wide text-neutral-500">
                          <ProductPriceKzt
                            price={p.price}
                            listPrice={p.listPrice}
                            currentPriceClassName="text-xs tracking-wide text-neutral-500"
                          />
                        </p>
                      </Link>
                    </article>
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>

            <div className="mt-8 flex justify-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-9 w-9 rounded-full border-neutral-300"
                onClick={() => scrollNewWeek("prev")}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-9 w-9 rounded-full border-neutral-300"
                onClick={() => scrollNewWeek("next")}
              >
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </section>

        {/* Collections grid */}
        <section id="collections" className="border-t border-neutral-200 py-14 scroll-mt-24">
          <div className="mx-auto max-w-[1320px] px-4 sm:px-6">
            <div className="mb-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between lg:gap-4">
              <div className="flex min-w-0 flex-1 flex-col gap-4 sm:flex-row sm:items-end sm:gap-6 lg:min-w-0 lg:items-center lg:gap-8">
                <h2
                  className="shrink-0 text-2xl uppercase tracking-[0.06em] text-neutral-950 sm:text-3xl sm:whitespace-nowrap"
                  style={{ fontFamily: "var(--font-display), sans-serif" }}
                >
                  Коллекции Kamilya{" "}
                  <span className="font-normal text-neutral-500">23–24</span>
                </h2>
                <div className="-mx-1 flex min-w-0 flex-nowrap items-center gap-x-5 overflow-x-auto px-1 pb-0.5 sm:mx-0 sm:flex-1 sm:justify-start sm:overflow-visible sm:px-0">
                  {(
                    [
                      ["all", "Все"],
                      ["men", "Мужское"],
                    ] as const
                  ).map(([key, label]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setCategory(key)}
                      className={cn(
                        "shrink-0 border-b-2 pb-1 text-[11px] font-medium uppercase tracking-[0.2em] transition-colors",
                        category === key
                          ? "border-neutral-900 text-neutral-900"
                          : "border-transparent text-neutral-400 hover:text-neutral-600",
                      )}
                    >
                      {label}
                    </button>
                  ))}
                  <div className="flex shrink-0 items-center gap-x-5">
                    {(
                      [
                        ["women", "Женское"],
                        ["kid", "Детское"],
                      ] as const
                    ).map(([key, label]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setCategory(key)}
                        className={cn(
                          "shrink-0 border-b-2 pb-1 text-[11px] font-medium uppercase tracking-[0.2em] transition-colors",
                          category === key
                            ? "border-neutral-900 text-neutral-900"
                            : "border-transparent text-neutral-400 hover:text-neutral-600",
                        )}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="relative z-10 flex w-full min-w-0 shrink-0 flex-col items-end gap-2 sm:w-auto lg:ml-auto">
                <Select defaultValue="all">
                  <SelectTrigger className="h-10 w-full min-w-[200px] max-w-[min(100%,280px)] shrink-0 justify-between rounded-none border-neutral-300 bg-transparent text-[11px] uppercase tracking-[0.15em] sm:w-[240px]">
                    <span className="flex min-w-0 items-baseline gap-1">
                      Фильтры <span className="font-normal text-neutral-400">(+)</span>
                    </span>
                    <SelectValue className="sr-only" aria-hidden />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Все категории</SelectItem>
                    <SelectItem value="tops">Верх</SelectItem>
                    <SelectItem value="bottoms">Низ</SelectItem>
                  </SelectContent>
                </Select>
                <Select defaultValue="price-asc">
                  <SelectTrigger className="h-10 w-full min-w-[200px] max-w-[min(100%,280px)] shrink-0 justify-between rounded-none border-neutral-300 bg-transparent text-[11px] uppercase tracking-[0.15em] sm:w-[240px]">
                    <SelectValue placeholder="Сортировать" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="price-asc">По возрастанию цены</SelectItem>
                    <SelectItem value="price-desc">По убыванию цены</SelectItem>
                    <SelectItem value="featured">Рекомендуемые</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <p className="mb-8 text-[11px] uppercase tracking-[0.25em] text-neutral-400">
              Показано:{" "}
              {category === "all"
                ? "Все"
                : category === "kid"
                  ? "Детское"
                  : category === "men"
                    ? "Мужское"
                    : "Женское"}
            </p>

            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {collectionProducts.map((p) => (
                <article key={p.id} className="group">
                  <Link href={`/product/${p.id}`} className="block">
                    <div className="relative aspect-[3/4] overflow-hidden bg-neutral-100">
                      <Image
                        src={p.image}
                        alt={p.name}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    </div>
                    <div className="mt-4 space-y-1">
                      <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-neutral-500">
                        {p.category}
                      </p>
                      <div className="flex items-start justify-between gap-4">
                        <h3 className="text-sm font-semibold capitalize leading-snug text-neutral-900">
                          {p.name}
                        </h3>
                        <ProductPriceKzt
                          className="shrink-0 justify-end"
                          price={p.price}
                          listPrice={p.listPrice}
                          comparePriceClassName="text-xs text-neutral-500"
                          currentPriceClassName="text-sm text-neutral-600"
                        />
                      </div>
                    </div>
                  </Link>
                </article>
              ))}
            </div>

            <div className="mt-12 flex justify-center">
              <Button
                variant="outline"
                className="h-11 rounded-none border-neutral-400 px-10 text-[11px] font-medium uppercase tracking-[0.2em] text-neutral-900"
              >
                Ещё
                <ChevronDown className="h-4 w-4 opacity-70" />
              </Button>
            </div>
          </div>
        </section>

        {/* Brand story */}
        <section className="border-t border-neutral-200 bg-neutral-50/80 py-16">
          <div className="mx-auto max-w-[720px] px-4 text-center sm:px-6">
            <h2
              className="text-xl font-semibold uppercase leading-snug tracking-[0.06em] text-neutral-950 sm:text-2xl"
              style={{ fontFamily: "var(--font-display), sans-serif" }}
            >
              Наш подход к моде
            </h2>
            <p className="mt-6 text-sm leading-relaxed text-neutral-600">
              Мы балансируем силуэт, ткань и удобство на каждый день — подбираем
              вещи, которые органично смотрятся в гардеробе. Лимитированные дропы,
              внимательный подбор материалов и спокойный визуальный язык от студии
              до города.
            </p>
          </div>

          <div className="mx-auto mt-14 grid max-w-[1320px] grid-cols-2 gap-3 px-4 sm:gap-4 sm:px-6 lg:grid-cols-4">
            {lookbook.map((src, index) => (
              <div
                key={src}
                className="relative aspect-[3/4] overflow-hidden bg-neutral-200"
              >
                <Image
                  src={src}
                  alt={`Лукбук ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 50vw, 25vw"
                />
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-neutral-200 bg-[#f2f2f2]">
        <div className="mx-auto max-w-[1320px] px-4 py-14 sm:px-6 lg:py-16">
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-10 lg:items-start">
            <div className="lg:col-span-4">
              <p
                className="text-[10px] font-semibold uppercase tracking-[0.28em] text-neutral-400"
                style={{ fontFamily: "var(--font-display), sans-serif" }}
              >
                Информация
              </p>
              <nav className="mt-6 flex flex-col gap-3 text-[12px] font-medium uppercase tracking-[0.12em] text-neutral-700">
                <Link href="/products" className="transition-colors hover:text-neutral-950">
                  Каталог
                </Link>
                <a href="#collections" className="transition-colors hover:text-neutral-950">
                  Коллекции
                </a>
                <a href="#deals" className="transition-colors hover:text-neutral-950">
                  Новинки
                </a>
              </nav>
            </div>

            <div className="lg:col-span-4">
              <p
                className="text-[10px] font-semibold uppercase tracking-[0.28em] text-neutral-400"
                style={{ fontFamily: "var(--font-display), sans-serif" }}
              >
                Документы
              </p>
              <nav className="mt-6 flex flex-col gap-3 text-[12px] font-medium uppercase tracking-[0.12em] text-neutral-700">
                <Link href="/terms" className="transition-colors hover:text-neutral-950">
                  Оферта
                </Link>
                <Link href="/privacy" className="transition-colors hover:text-neutral-950">
                  Конфиденциальность
                </Link>
                <Link href="/returns" className="transition-colors hover:text-neutral-950">
                  Возврат
                </Link>
                <Link href="/size-guide" className="transition-colors hover:text-neutral-950">
                  Таблица размеров
                </Link>
              </nav>
            </div>

            <div className="flex flex-col gap-6 border-t border-neutral-200/90 pt-10 lg:col-span-4 lg:border-t-0 lg:pt-0">
              <SiteLogo sizeClassName="h-14 w-auto sm:h-16 md:h-[4.5rem]" />
              <p className="max-w-sm text-[12px] leading-relaxed text-neutral-500">
                Одежда и аксессуары с акцентом на материал и посадку. Доставка по Казахстану.
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-neutral-200 bg-white/80 px-4 py-5 sm:px-6">
          <div className="mx-auto flex max-w-[1320px] flex-col gap-4 text-[11px] text-neutral-500 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-x-6">
            <p className="tabular-nums text-neutral-500">
              © {new Date().getFullYear()} — все права защищены
            </p>
            <p className="text-[11px] text-neutral-500 sm:text-right">
              <span className="text-neutral-400">Powered by </span>
              <a
                href="https://infinitydev.kz"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-neutral-800 underline decoration-neutral-300 underline-offset-4 transition-colors hover:text-neutral-950 hover:decoration-neutral-900"
              >
                infinitydev.kz
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
