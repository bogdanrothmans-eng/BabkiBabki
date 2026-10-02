import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"

import { MonthColumns } from "@/components/month-columns"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { requireContext } from "@/lib/auth"
import { formatMoney } from "@/lib/money"
import { MONTHS_SHORT } from "@/lib/period"
import { getYearPivot, type PivotRow } from "@/lib/queries"
import { cn } from "@/lib/utils"

export const metadata: Metadata = { title: "Таблица" }

const amount = (v: number) => (v ? formatMoney(v).replace(" ₽", "") : "")

function Rows({ rows, year }: { rows: PivotRow[]; year: number }) {
  return rows.map((r) => (
    <tr key={r.id} className={cn("border-b last:border-0 hover:bg-accent/40", !r.total && "text-muted-foreground")}>
      <th scope="row" className="sticky left-0 z-10 max-w-40 truncate bg-card px-3 py-2 text-left font-normal md:max-w-64">
        <span className="mr-1.5">{r.emoji}</span>
        {r.name}
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

export default async function TablePage({ searchParams }: PageProps<"/table">) {
  const { y } = await searchParams
  const year = typeof y === "string" && /^\d{4}$/.test(y) ? Number(y) : new Date().getFullYear()
  const { budget } = await requireContext()
  const pivot = getYearPivot(budget.id, year)
  const yearExpense = pivot.expenseTotals.reduce((a, b) => a + b, 0)
  const activeMonths = pivot.expenseTotals.filter(Boolean).length
  const hideEmpty = (rows: PivotRow[]) => rows.filter((r) => r.total > 0)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <Button asChild variant="ghost" size="icon" aria-label="Предыдущий год">
            <Link href={`/table?y=${year - 1}`}>
              <ChevronLeftIcon />
            </Link>
          </Button>
          <h1 className="text-lg font-semibold">{year}</h1>
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

      <Card className="gap-0 overflow-hidden py-0">
        <CardHeader className="border-b py-4">
          <CardTitle>Траты по категориям</CardTitle>
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
          {yearExpense === 0 && (
            <p className="p-6 text-center text-sm text-muted-foreground">
              За {year} год записей нет. <Link href="/settings#import" className="underline">Импортируйте таблицу</Link>{" "}
              или добавьте первую трату.
            </p>
          )}
        </div>
      </Card>
    </div>
  )
}
