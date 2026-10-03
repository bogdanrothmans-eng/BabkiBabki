"use client"

import { ChevronDownIcon } from "lucide-react"
import { useState } from "react"

import { CategoryIcon } from "@/components/category-icon"
import type { CategoryOption } from "@/components/transaction-form"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

// A compact "category: X ▾" button with a scrollable list, used where a full
// grid would take over the screen (each row of a pasted list).
export function CategoryPicker({
  categories,
  kind,
  value,
  onChange,
  className,
}: {
  categories: CategoryOption[]
  kind: "expense" | "income"
  value?: string
  onChange: (id: string) => void
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const options = categories.filter((c) => c.kind === kind).sort((a, b) => b.used - a.used)
  const current = options.find((c) => c.id === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className={cn(
          "flex min-h-11 min-w-0 items-center gap-2 rounded-lg px-1.5 text-left transition-colors duration-150 hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none md:min-h-9",
          !current && "text-warning",
          className,
        )}
        aria-label={current ? `Категория: ${current.name}. Сменить` : "Выбрать категорию"}
      >
        {current ? (
          <CategoryIcon icon={current.icon} color={current.color} size="sm" />
        ) : (
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-dashed border-warning">
            ?
          </span>
        )}
        <span className="truncate text-sm">{current?.name ?? "Выберите категорию"}</span>
        <ChevronDownIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
      </PopoverTrigger>
      <PopoverContent className="w-72 p-1" align="start">
        <ul className="max-h-72 overflow-y-auto" role="listbox" aria-label="Категории">
          {options.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                role="option"
                aria-selected={c.id === value}
                onClick={() => {
                  onChange(c.id)
                  setOpen(false)
                }}
                className={cn(
                  "flex min-h-11 w-full items-center gap-3 rounded-md px-2 text-left text-sm hover:bg-accent focus-visible:bg-accent focus-visible:outline-none",
                  c.id === value && "bg-accent font-medium",
                )}
              >
                <CategoryIcon icon={c.icon} color={c.color} size="sm" />
                <span className="truncate">{c.name}</span>
              </button>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  )
}
