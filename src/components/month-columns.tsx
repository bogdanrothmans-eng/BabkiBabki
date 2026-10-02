import Link from "next/link"

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { formatMoney } from "@/lib/money"
import { MONTHS, MONTHS_SHORT } from "@/lib/period"

// Spending per month for one year — single series, so no legend; the hover
// tooltip and the table below carry the exact numbers.
export function MonthColumns({ year, totals }: { year: number; totals: number[] }) {
  const max = Math.max(...totals)
  return (
    <div className="grid h-36 grid-cols-12 items-end gap-1 sm:gap-2" role="img" aria-label={`Траты по месяцам за ${year}`}>
      {totals.map((value, i) => (
        <Tooltip key={i}>
          <TooltipTrigger asChild>
            <Link
              href={`/?p=${year}-${String(i + 1).padStart(2, "0")}`}
              className="group flex h-full flex-col items-center justify-end gap-1 rounded-md pt-1 hover:bg-accent/60"
            >
              <span
                className="w-full max-w-6 rounded-t-[4px] bg-chart-1 transition-opacity group-hover:opacity-80"
                style={{ height: max ? `${Math.max((value / max) * 100, value ? 2 : 0)}%` : 0 }}
              />
              <span className="text-[10px] text-muted-foreground sm:text-xs">{MONTHS_SHORT[i]}</span>
            </Link>
          </TooltipTrigger>
          <TooltipContent>
            <span className="capitalize">{MONTHS[i]}</span>: {value ? formatMoney(value) : "нет записей"}
          </TooltipContent>
        </Tooltip>
      ))}
    </div>
  )
}
