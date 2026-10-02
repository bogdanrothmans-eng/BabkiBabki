import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"
import Link from "next/link"

import { BackButton } from "@/components/back-button"
import { CategoryIcon } from "@/components/category-icon"
import { MonthColumns } from "@/components/month-columns"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { formatMoney } from "@/lib/money"
import { MONTHS, MONTHS_SHORT } from "@/lib/period"
import type { PivotRow, YearPivot } from "@/lib/queries"
import { cn } from "@/lib/utils"

const amount = (v: number) => (v ? formatMoney(v).replace(" ₽", "") : "")

function Rows({ rows, year }: { rows: PivotRow[]; year: number }) {
  return rows.map((r) => (
    <tr key={r.id} className={cn("border-b last:border-0 hover:bg-accent/40", !r.total && "text-muted-foreground")}>
      <th scope="row" className="sticky left-0 z-10 max-w-64 bg-card px-3 py-1.5 text-left font-normal">
        <span className="flex items-center gap-2">
          <CategoryIcon icon={r.icon} color={r.color} size="sm" />
          <span className="truncate">{r.name}</span>
        </span>
      </th>
      {r.months.map((v, m) => (
        <td key={m} className="p-0 text-right">
          {v ? (
            <Link
              href={`/transactions?category=${r.id}&p=${year}-${String(m + 1).padStart(2, "0")}`}
              className="block px-3 py-2 hover:underline"
            >
              {amount(v)}
            </Link>
          ) : null}
        </td>
      ))}
      <td className="px-3 py-2 text-right font-medium">{amount(r.total)}</td>
    </tr>
  ))
}

// Phones: no horizontal scrolling (ui-ux-pro-max `horizontal-scroll`). Each
// category is a tappable row with its year total and a 12-month strip.
function MobileRows({ rows, year }: { rows: PivotRow[]; year: number }) {
  return (
    <ul className="divide-y overflow-hidden rounded-xl border bg-card">
      {rows.map((r) => {
        const max = Math.max(...r.months)
        return (
          <li key={r.id}>
            <Link
              href={`/transactions?category=${r.id}&p=${year}`}
              className="flex min-h-16 items-center gap-3 px-3 py-2.5 transition-colors duration-150 hover:bg-accent/60 active:bg-accent"
            >
              <CategoryIcon icon={r.icon} color={r.color} size="sm" />
              <span className="min-w-0 flex-1">
                <span className="flex items-baseline justify-between gap-2">
                  <span className="truncate text-base">{r.name}</span>
                  <span className="tabular shrink-0 font-medium">{formatMoney(r.total)}</span>
                </span>
                <span aria-hidden className="mt-1.5 grid h-4 grid-cols-12 items-end gap-0.5">
                  {r.months.map((v, m) => (
                    <span
                      key={m}
                      className={v ? "rounded-t-[2px] bg-chart-1" : "h-px bg-border"}
                      style={v ? { height: `${Math.max((v / max) * 100, 12)}%` } : undefined}
                    />
                  ))}
                </span>
              </span>
            </Link>
          </li>
        )
      })}
    </ul>
  )
}

export function TableView({ year, pivot }: { year: number; pivot: YearPivot }) {
  const yearExpense = pivot.expenseTotals.reduce((a, b) => a + b, 0)
  const activeMonths = pivot.expenseTotals.filter(Boolean).length
  const hideEmpty = (rows: PivotRow[]) => rows.filter((r) => r.total > 0)

  return (
    <div className="flex flex-col gap-4">
      <BackButton href="/reports" label="Отчёты" />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <Button asChild variant="ghost" size="icon" aria-label="Предыдущий год">
            <Link href={`/table?y=${year - 1}`}>
              <ChevronLeftIcon />
            </Link>
          </Button>
          <h1 className="text-lg font-semibold">
            <span className="sr-only">Таблица за </span>
            {year}
          </h1>
          <Button asChild variant="ghost" size="icon" aria-label="Следующий год">
            <Link href={`/table?y=${year + 1}`}>
              <ChevronRightIcon />
            </Link>
          </Button>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Потрачено за год</p>
          <p className="text-2xl font-semibold">{formatMoney(yearExpense)}</p>
          {activeMonths > 0 && (
            <p className="text-xs text-muted-foreground">в среднем {formatMoney(Math.round(yearExpense / activeMonths / 100) * 100)} в месяц</p>
          )}
        </div>
      </div>

      <Card className="gap-4">
        <CardContent>
          <MonthColumns year={year} totals={pivot.expenseTotals} />
        </CardContent>
      </Card>

      <section aria-labelledby="months-title" className="flex flex-col gap-2 md:hidden">
        <h2 id="months-title" className="font-semibold">
          По месяцам
        </h2>
        <ul className="divide-y overflow-hidden rounded-xl border bg-card">
          {pivot.expenseTotals.map((v, m) =>
            v || pivot.incomeTotals[m] ? (
              <li key={m}>
                <Link
                  href={`/?p=${year}-${String(m + 1).padStart(2, "0")}`}
                  className="flex min-h-12 items-center justify-between px-4 py-2 transition-colors duration-150 hover:bg-accent/60 active:bg-accent"
                >
                  <span className="capitalize">{MONTHS[m]}</span>
                  <span className="tabular flex items-baseline gap-3">
                    {pivot.incomeTotals[m] > 0 && (
                      <span className="text-sm text-income">+{formatMoney(pivot.incomeTotals[m])}</span>
                    )}
                    <span className="font-medium">{formatMoney(v)}</span>
                  </span>
                </Link>
              </li>
            ) : null,
          )}
        </ul>
      </section>

      {yearExpense > 0 && (
        <section aria-labelledby="categories-title" className="flex flex-col gap-2 md:hidden">
          <h2 id="categories-title" className="font-semibold">
            По категориям
          </h2>
          <MobileRows rows={hideEmpty(pivot.expense).sort((a, b) => b.total - a.total)} year={year} />
        </section>
      )}

      <Card className="hidden gap-0 overflow-hidden py-0 md:flex">
        <CardHeader className="border-b py-4">
          <CardTitle>
            <h2>Траты по категориям</h2>
          </CardTitle>
          <CardDescription>Как в вашей Google Таблице. Нажмите на сумму, чтобы увидеть записи.</CardDescription>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="tabular w-full min-w-[60rem] text-sm">
            <thead>
              <tr className="border-b bg-muted/50 text-xs text-muted-foreground">
                <th scope="col" className="sticky left-0 z-10 bg-muted px-3 py-2 text-left font-medium">
                  Категория
                </th>
                {MONTHS_SHORT.map((m) => (
                  <th key={m} scope="col" className="px-3 py-2 text-right font-medium capitalize">
                    {m}
                  </th>
                ))}
                <th scope="col" className="px-3 py-2 text-right font-medium">
                  Итого
                </th>
              </tr>
            </thead>
            <tbody>
              <Rows rows={hideEmpty(pivot.expense)} year={year} />
            </tbody>
            <tfoot>
              <tr className="border-t-2 bg-muted/50 font-semibold">
                <th scope="row" className="sticky left-0 z-10 bg-muted px-3 py-2 text-left">
                  Итог месяца
                </th>
                {pivot.expenseTotals.map((v, m) => (
                  <td key={m} className="px-3 py-2 text-right">
                    {amount(v)}
                  </td>
                ))}
                <td className="px-3 py-2 text-right">{amount(yearExpense)}</td>
              </tr>
              {pivot.incomeTotals.some(Boolean) && (
                <tr className="text-income">
                  <th scope="row" className="sticky left-0 z-10 bg-card px-3 py-2 text-left font-medium">
                    Доходы
                  </th>
                  {pivot.incomeTotals.map((v, m) => (
                    <td key={m} className="px-3 py-2 text-right">
                      {amount(v)}
                    </td>
                  ))}
                  <td className="px-3 py-2 text-right font-medium">{amount(pivot.incomeTotals.reduce((a, b) => a + b, 0))}</td>
                </tr>
              )}
            </tfoot>
          </table>
        </div>
      </Card>

      {yearExpense === 0 && (
        <p className="rounded-xl border bg-card p-6 text-center text-muted-foreground">
          За {year} год записей нет.{" "}
          <Link href="/settings#import" className="text-foreground underline underline-offset-4">
            Импортируйте таблицу
          </Link>{" "}
          или добавьте первую трату.
        </p>
      )}
    </div>
  )
}
