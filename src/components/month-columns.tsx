import Link from "next/link"

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { formatMoney } from "@/lib/money"
import { MONTHS, MONTHS_SHORT } from "@/lib/period"
import { cn } from "@/lib/utils"

// Spending per month for one year — a single series, so no legend. On
// desktop each column links to that month with a hover tooltip; on phones the
// columns are too narrow to tap (21px), so they are decorative and the month
// list below the chart carries the numbers and the links.
export function MonthColumns({ year, totals }: { year: number; totals: number[] }) {
  const max = Math.max(...totals)
  const height = (value: number) => (max ? `${Math.max((value / max) * 100, value ? 2 : 0)}%` : "0")

  return (
    <>
      <div aria-hidden className="grid h-28 grid-cols-12 items-end gap-1.5 md:hidden">
        {totals.map((value, i) => (
          <div key={i} className="flex h-full flex-col items-center justify-end gap-1">
            <span className="w-full max-w-5 rounded-t-[4px] bg-chart-1" style={{ height: height(value) }} />
            <span className="text-xs text-muted-foreground">{MONTHS_SHORT[i].slice(0, 1).toUpperCase()}</span>
          </div>
        ))}
      </div>

      <div className="hidden h-40 grid-cols-12 items-end gap-2 md:grid" role="list" aria-label={`Траты по месяцам за ${year}`}>
        {totals.map((value, i) => (
          <Tooltip key={i}>
            <TooltipTrigger asChild>
              <Link
                role="listitem"
                href={`/?p=${year}-${String(i + 1).padStart(2, "0")}`}
                aria-label={`${MONTHS[i]}: ${value ? formatMoney(value) : "нет записей"}`}
                className="group flex h-full flex-col items-center justify-end gap-1 rounded-md pt-1 transition-colors duration-150 hover:bg-accent/60 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
              >
                <span
                  className={cn("w-full max-w-6 rounded-t-[4px] bg-chart-1 transition-opacity duration-150 group-hover:opacity-80")}
                  style={{ height: height(value) }}
                />
                <span className="text-xs text-muted-foreground">{MONTHS_SHORT[i]}</span>
              </Link>
            </TooltipTrigger>
            <TooltipContent>
              <span className="capitalize">{MONTHS[i]}</span>: {value ? formatMoney(value) : "нет записей"}
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </>
  )
}
