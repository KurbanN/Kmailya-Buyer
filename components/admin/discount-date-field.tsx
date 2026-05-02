"use client"

import { format } from "date-fns"
import { ru } from "date-fns/locale"

import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

type Props = {
  label: string
  value: string
  onChange: (isoDateOrEmpty: string) => void
  id?: string
}

export function DiscountDateField({ label, value, onChange, id }: Props) {
  const t = value.trim()
  const parsed = /^(\d{4})-(\d{2})-(\d{2})/.exec(t)
  const selected = parsed
    ? new Date(Number(parsed[1]), Number(parsed[2]) - 1, Number(parsed[3]))
    : undefined

  return (
    <div className="space-y-1">
      <label htmlFor={id} className="text-[11px] uppercase tracking-[0.12em] text-neutral-500">
        {label}
      </label>
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            id={id}
            className={cn(
              "flex h-10 w-full items-center justify-between border border-neutral-300 bg-white px-3 text-left text-sm",
              !t && "text-neutral-400",
            )}
          >
            <span className="tabular-nums">{t ? t.slice(0, 10) : "Выберите дату"}</span>
            <span className="text-neutral-400" aria-hidden>
              ▼
            </span>
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            locale={ru}
            selected={selected}
            onSelect={(d) => {
              if (!d) {
                onChange("")
                return
              }
              onChange(format(d, "yyyy-MM-dd"))
            }}
          />
          <div className="border-t border-neutral-100 p-2">
            <button
              type="button"
              className="w-full py-1.5 text-center text-xs text-neutral-600 hover:text-neutral-900"
              onClick={() => onChange("")}
            >
              Очистить дату
            </button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
