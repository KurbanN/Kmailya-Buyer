"use client"

import { ChevronDown } from "lucide-react"

import { Checkbox } from "@/components/ui/checkbox"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  COLLECTION_OPTIONS,
  SIDEBAR_CATEGORY_OPTIONS,
  type CollectionFilterKey,
  type SidebarCategoryKey,
} from "@/lib/plp-filters"
import { cn } from "@/lib/utils"

const SIZES = ["XS", "S", "M", "L", "XL", "2X"] as const

const STOCK_IN = 450
const STOCK_OUT = 18

const triggerClass =
  "flex w-full cursor-pointer items-center justify-between gap-2 text-left [&[data-state=open]>svg]:rotate-180"

type Props = {
  selectedSizes: Set<string>
  onToggleSize: (s: string) => void
  availIn: boolean
  availOut: boolean
  onAvailIn: (v: boolean) => void
  onAvailOut: (v: boolean) => void
  categoryKeys: Set<SidebarCategoryKey>
  onToggleCategory: (k: SidebarCategoryKey) => void
  collectionKeys: Set<CollectionFilterKey>
  onToggleCollection: (k: CollectionFilterKey) => void
  colorPalette: string[]
  selectedColors: Set<string>
  onToggleColor: (hex: string) => void
  priceMin: string
  priceMax: string
  onPriceMin: (v: string) => void
  onPriceMax: (v: string) => void
}

export function ProductsFilterSidebar({
  selectedSizes,
  onToggleSize,
  availIn,
  availOut,
  onAvailIn,
  onAvailOut,
  categoryKeys,
  onToggleCategory,
  collectionKeys,
  onToggleCollection,
  colorPalette,
  selectedColors,
  onToggleColor,
  priceMin,
  priceMax,
  onPriceMin,
  onPriceMax,
}: Props) {
  return (
    <div className="w-full">
      <h2 className="mb-6 text-[15px] font-semibold text-neutral-950">Фильтры</h2>

      {/* Size */}
      <Collapsible className="py-5">
        <CollapsibleTrigger className={triggerClass}>
          <span className="text-[13px] font-semibold text-neutral-900">Размер</span>
          <ChevronDown className="h-4 w-4 shrink-0 text-neutral-500 transition-transform" />
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-3">
          <div className="flex flex-wrap gap-2">
            {SIZES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => onToggleSize(s)}
                className={cn(
                  "flex h-9 min-w-[2.25rem] items-center justify-center border px-1 text-[11px] font-medium uppercase tracking-wide transition-colors",
                  selectedSizes.has(s)
                    ? "border-neutral-900 bg-neutral-900 text-white"
                    : "border-neutral-400 bg-white text-neutral-800 hover:border-neutral-600",
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>

      <div className="border-t border-dotted border-neutral-300" />

      {/* Availability */}
      <Collapsible className="py-5">
        <CollapsibleTrigger className={triggerClass}>
          <span className="text-[13px] font-semibold text-neutral-900">Наличие</span>
          <ChevronDown className="h-4 w-4 shrink-0 text-neutral-500 transition-transform" />
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-3">
          <div className="flex flex-col gap-3">
            <label className="flex cursor-pointer items-start gap-2.5 text-[13px] text-neutral-800">
              <Checkbox
                checked={availIn}
                onCheckedChange={(v) => onAvailIn(v === true)}
                className="mt-0.5 border-neutral-400"
              />
              <span>
                В наличии{" "}
                <span className="text-blue-600">({STOCK_IN})</span>
              </span>
            </label>
            <label className="flex cursor-pointer items-start gap-2.5 text-[13px] text-neutral-800">
              <Checkbox
                checked={availOut}
                onCheckedChange={(v) => onAvailOut(v === true)}
                className="mt-0.5 border-neutral-400"
              />
              <span>
                Нет в наличии{" "}
                <span className="text-blue-600">({STOCK_OUT})</span>
              </span>
            </label>
          </div>
        </CollapsibleContent>
      </Collapsible>

      <div className="border-t border-dotted border-neutral-300" />

      {/* Category */}
      <Collapsible className="py-5">
        <CollapsibleTrigger className={triggerClass}>
          <span className="text-[13px] font-semibold text-neutral-900">Категория</span>
          <ChevronDown className="h-4 w-4 shrink-0 text-neutral-500 transition-transform" />
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-3 flex flex-col gap-2.5 pl-0.5">
          {SIDEBAR_CATEGORY_OPTIONS.map(({ key, label }) => (
            <label
              key={key}
              className="flex cursor-pointer items-center gap-2.5 text-[12px] text-neutral-800"
            >
              <Checkbox
                checked={categoryKeys.has(key)}
                onCheckedChange={() => onToggleCategory(key)}
                className="border-neutral-400"
              />
              {label}
            </label>
          ))}
        </CollapsibleContent>
      </Collapsible>

      <div className="border-t border-dotted border-neutral-300" />

      {/* Colors */}
      <Collapsible className="py-5">
        <CollapsibleTrigger className={triggerClass}>
          <span className="text-[13px] font-semibold text-neutral-900">Цвета</span>
          <ChevronDown className="h-4 w-4 shrink-0 text-neutral-500 transition-transform" />
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-3">
          <div className="flex flex-wrap gap-2">
            {colorPalette.map((hex) => (
              <button
                key={hex}
                type="button"
                title={hex}
                onClick={() => onToggleColor(hex)}
                className={cn(
                  "h-8 w-8 border border-neutral-300 transition-shadow",
                  selectedColors.has(hex) ? "ring-2 ring-neutral-900 ring-offset-2" : "",
                )}
                style={{ backgroundColor: hex }}
              />
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>

      <div className="border-t border-dotted border-neutral-300" />

      {/* Price */}
      <Collapsible className="py-5">
        <CollapsibleTrigger className={triggerClass}>
          <span className="text-[13px] font-semibold text-neutral-900">Цена</span>
          <ChevronDown className="h-4 w-4 shrink-0 text-neutral-500 transition-transform" />
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-3">
          <div className="flex items-center gap-2">
            <div className="grid w-full gap-1">
              <Label htmlFor="price-min" className="text-[10px] uppercase tracking-wider text-neutral-500">
                От (₸)
              </Label>
              <Input
                id="price-min"
                inputMode="numeric"
                placeholder="0"
                value={priceMin}
                onChange={(e) => onPriceMin(e.target.value)}
                className="h-9 rounded-none border-neutral-300 bg-white text-sm"
              />
            </div>
            <span className="pt-5 text-neutral-400">—</span>
            <div className="grid w-full gap-1">
              <Label htmlFor="price-max" className="text-[10px] uppercase tracking-wider text-neutral-500">
                До (₸)
              </Label>
              <Input
                id="price-max"
                inputMode="numeric"
                placeholder="800 000"
                value={priceMax}
                onChange={(e) => onPriceMax(e.target.value)}
                className="h-9 rounded-none border-neutral-300 bg-white text-sm"
              />
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      <div className="border-t border-dotted border-neutral-300" />

      {/* Collections */}
      <Collapsible className="py-5">
        <CollapsibleTrigger className={triggerClass}>
          <span className="text-[13px] font-semibold text-neutral-900">Коллекции</span>
          <ChevronDown className="h-4 w-4 shrink-0 text-neutral-500 transition-transform" />
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-3">
          <div className="flex flex-col gap-2.5">
            {COLLECTION_OPTIONS.map(({ key, label }) => (
              <label
                key={key}
                className="flex cursor-pointer items-center gap-2.5 text-[12px] text-neutral-800"
              >
                <Checkbox
                  checked={collectionKeys.has(key)}
                  onCheckedChange={() => onToggleCollection(key)}
                  className="border-neutral-400"
                />
                {label}
              </label>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>

      <div className="border-t border-dotted border-neutral-300" />

      {/* Tags */}
      <Collapsible className="py-5">
        <CollapsibleTrigger className={triggerClass}>
          <span className="text-[13px] font-semibold text-neutral-900">Теги</span>
          <ChevronDown className="h-4 w-4 shrink-0 text-neutral-500 transition-transform" />
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-2 text-[12px] text-neutral-500">
          Limited, organic, sale — уточните в каталоге.
        </CollapsibleContent>
      </Collapsible>

      <div className="border-t border-dotted border-neutral-300" />

      {/* Ratings */}
      <Collapsible className="py-5">
        <CollapsibleTrigger className={triggerClass}>
          <span className="text-[13px] font-semibold text-neutral-900">Рейтинг</span>
          <ChevronDown className="h-4 w-4 shrink-0 text-neutral-500 transition-transform" />
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-2 text-[12px] text-neutral-500">
          Скоро: фильтр по отзывам покупателей.
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}
