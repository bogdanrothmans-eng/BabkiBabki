import { ChevronRightIcon, Table2Icon } from "lucide-react"
import Link from "next/link"

import { CategoryBreakdown } from "@/components/category-breakdown"
import { MemberAvatar } from "@/components/member-avatars"
import { PeriodPicker } from "@/components/period-picker"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatMoney } from "@/lib/money"
import { type Period, parseIso } from "@/lib/period"
import type { Summary } from "@/lib/queries"

// Everything analytical in one place: where the money went, who paid,
// and the spreadsheet-style year table one tap away.
export function ReportsView({ period, summary, memberCount }: { period: Period; summary: Summary; memberCount: number }) {
  const payers = summary.byMember.filter((m) => m.member_id)
  const year = parseIso(period.from).getFullYear()

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <h1 className="sr-only">Отчёты</h1>
      <div className="flex justify-center">
        <PeriodPicker period={period} />
      </div>

      <Card className="gap-4">
        <CardHeader>
          <CardTitle>
            <h2>На что ушли деньги</h2>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {summary.expenses.length ? (
            <CategoryBreakdown items={summary.expenses} total={summary.expense} periodKey={period.key} />
          ) : (
            <p className="text-muted-foreground">За этот период трат нет.</p>
          )}
          {summary.incomes.length > 0 && (
            <>
              <h3 className="mt-6 mb-2 font-medium">Доходы</h3>
              <CategoryBreakdown items={summary.incomes} total={summary.income} periodKey={period.key} />
            </>
          )}
        </CardContent>
      </Card>

      {memberCount > 1 && payers.length > 0 && (
        <Card className="gap-2">
          <CardHeader>
            <CardTitle>
              <h2>Кто сколько потратил</h2>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col">
              {payers.map((m) => (
                <li key={m.member_id}>
                  <Link
                    href={`/transactions?member=${m.member_id}&p=${period.key}`}
                    className="-mx-2 flex min-h-14 items-center gap-3 rounded-lg px-2 transition-colors duration-150 hover:bg-accent/60"
                  >
                    <MemberAvatar name={m.name} className="size-8 border-0" />
                    <span className="flex-1 text-base md:text-sm">{m.name}</span>
                    <span className="tabular font-medium">{formatMoney(m.total)}</span>
                    <span className="tabular w-10 text-right text-sm text-muted-foreground">
                      {summary.expense ? Math.round((m.total / summary.expense) * 100) : 0}%
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <Link
        href={`/table?y=${year}`}
        className="flex min-h-16 items-center gap-3 rounded-xl border bg-card px-4 py-3 transition-colors duration-150 hover:bg-accent/60"
      >
        <Table2Icon className="size-5 text-muted-foreground" aria-hidden />
        <span className="flex-1">
          <span className="block font-medium">Таблица за {year} год</span>
          <span className="text-sm text-muted-foreground">Категории по месяцам — как в Google Таблице</span>
        </span>
        <ChevronRightIcon className="size-5 text-muted-foreground" aria-hidden />
      </Link>
    </div>
  )
}
