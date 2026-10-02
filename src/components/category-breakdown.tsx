import Link from "next/link"

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
              className="-mx-2 grid grid-cols-[2rem_minmax(0,1fr)_6.5rem] items-center gap-x-3 gap-y-1.5 rounded-lg px-2 py-2 transition-colors hover:bg-accent/60"
            >
              <span className="row-span-2 text-xl leading-none">{c.emoji}</span>
              <span className="truncate text-sm">{c.name}</span>
              <span className="tabular text-right text-sm font-medium">{formatMoney(c.total)}</span>
              <span className="h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden>
                <span
                  className="block h-full rounded-r-[4px] bg-chart-1"
                  style={{ width: `${max ? Math.max((c.total / max) * 100, 1.5) : 0}%` }}
                />
              </span>
              <span className="tabular text-right text-xs text-muted-foreground">{share}%</span>
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
