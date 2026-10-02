import { ChevronDownIcon } from "lucide-react"
import Link from "next/link"

import { CategoryIcon } from "@/components/category-icon"
import { formatMoney } from "@/lib/money"
import { plural } from "@/lib/plural"
import type { Breakdown } from "@/lib/queries"

const TOP = 5

function Row({ c, max, total, periodKey }: { c: Breakdown; max: number; total: number; periodKey: string }) {
  const share = total ? Math.round((c.total / total) * 100) : 0
  return (
    <li>
      <Link
        href={`/transactions?category=${c.category_id}&p=${periodKey}`}
        className="-mx-2 flex min-h-14 items-center gap-3 rounded-lg px-2 py-2 transition-colors duration-150 hover:bg-accent/60 active:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
      >
        <CategoryIcon icon={c.icon} color={c.color} size="sm" />
        <span className="min-w-0 flex-1">
          <span className="flex items-baseline justify-between gap-3">
            <span className="truncate text-base md:text-sm">{c.name}</span>
            <span className="tabular shrink-0 text-base font-medium md:text-sm">
              {formatMoney(c.total)}
              <span className="ml-2 inline-block w-9 text-right text-sm font-normal text-muted-foreground md:text-xs">
                {share}%
              </span>
            </span>
          </span>
          <span className="mt-1.5 block h-1 overflow-hidden rounded-full bg-muted" aria-hidden>
            <span
              className="block h-full rounded-r-[4px] bg-chart-1"
              style={{ width: `${max ? Math.max((c.total / max) * 100, 1.5) : 0}%` }}
            />
          </span>
        </span>
      </Link>
    </li>
  )
}

// Ranked bars in one neutral hue. Only the top five are shown; the long tail
// folds away so the screen answers "where did most of it go" at a glance.
export function CategoryBreakdown({ items, total, periodKey }: { items: Breakdown[]; total: number; periodKey: string }) {
  const max = items[0]?.total ?? 0
  const top = items.slice(0, TOP)
  const rest = items.slice(TOP)
  const restTotal = rest.reduce((s, c) => s + c.total, 0)
  return (
    <>
      <ul className="flex flex-col">
        {top.map((c) => (
          <Row key={c.category_id} c={c} max={max} total={total} periodKey={periodKey} />
        ))}
      </ul>
      {rest.length > 0 && (
        <details className="group">
          <summary className="-mx-2 flex min-h-12 list-none items-center gap-2 rounded-lg px-2 text-sm text-muted-foreground hover:bg-accent/60 [&::-webkit-details-marker]:hidden">
            <ChevronDownIcon className="size-4 transition-transform duration-200 group-open:rotate-180" aria-hidden />
            <span className="flex-1">
              Ещё {rest.length} {plural(rest.length, ["категория", "категории", "категорий"])}
            </span>
            <span className="tabular">{formatMoney(restTotal)}</span>
          </summary>
          <ul className="flex flex-col">
            {rest.map((c) => (
              <Row key={c.category_id} c={c} max={max} total={total} periodKey={periodKey} />
            ))}
          </ul>
        </details>
      )}
    </>
  )
}
