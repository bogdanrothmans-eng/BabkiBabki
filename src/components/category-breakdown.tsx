import Link from "next/link"

import { CategoryIcon } from "@/components/category-icon"

import { formatMoney } from "@/lib/money"
import type { Breakdown } from "@/lib/queries"

// Ranked bars in one neutral hue: the label and amount carry the meaning,
// the bar only shows proportion. No red "over budget" states.
export function CategoryBreakdown({ items, total, periodKey }: { items: Breakdown[]; total: number; periodKey: string }) {
  const max = items[0]?.total ?? 0
  return (
    <ul className="flex flex-col">
      {items.map((c) => {
        const share = total ? Math.round((c.total / total) * 100) : 0
        return (
          <li key={c.category_id}>
            <Link
              href={`/transactions?category=${c.category_id}&p=${periodKey}`}
              className="-mx-2 grid min-h-14 grid-cols-[2rem_minmax(0,1fr)_6.5rem] items-center gap-x-3 gap-y-1.5 rounded-lg px-2 py-2 transition-colors duration-150 hover:bg-accent/60 active:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
            >
              <CategoryIcon icon={c.icon} color={c.color} size="sm" className="row-span-2" />
              <span className="truncate text-base md:text-sm">{c.name}</span>
              <span className="tabular text-right text-base font-medium md:text-sm">{formatMoney(c.total)}</span>
              <span className="h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden>
                <span
                  className="block h-full rounded-r-[4px] bg-chart-1"
                  style={{ width: `${max ? Math.max((c.total / max) * 100, 1.5) : 0}%` }}
                />
              </span>
              <span className="tabular text-right text-sm text-muted-foreground md:text-xs">{share}%</span>
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
