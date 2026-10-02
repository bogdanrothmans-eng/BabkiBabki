import { FileSpreadsheetIcon } from "lucide-react"
import Link from "next/link"

import { InviteBanner } from "@/components/invite-banner"
import { PeriodPicker } from "@/components/period-picker"
import { TransactionList } from "@/components/transaction-list"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { formatMoney } from "@/lib/money"
import { type Period, periodPreposition, shiftPeriod } from "@/lib/period"
import type { Summary, TransactionRow } from "@/lib/queries"

function comparison(current: number, previous: number, period: Period) {
  if (!previous || !current) return null
  const diff = current - previous
  const prev = period.kind === "range" ? "за предыдущий период" : periodPreposition(shiftPeriod(period, -1))
  if (Math.abs(diff) < previous * 0.01) return `Почти столько же, сколько ${prev}`
  return `На ${formatMoney(Math.abs(diff))} ${diff > 0 ? "больше" : "меньше"}, чем ${prev}`
}

// The main screen answers one question — how much did we spend — and lists
// what it was spent on. Breakdowns live in Reports (ui-ux-pro-max
// `content-priority`, `primary-action`).
export function OverviewView({
  period,
  summary,
  rows,
  memberCount,
}: {
  period: Period
  summary: Summary
  rows: TransactionRow[]
  memberCount: number
}) {
  const balance = summary.income - summary.expense

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5">
      <h1 className="sr-only">Траты</h1>
      <div className="flex justify-center">
        <PeriodPicker period={period} />
      </div>

      <section aria-labelledby="total-label" className="text-center">
        <p id="total-label" className="text-muted-foreground">
          Потрачено {periodPreposition(period)}
        </p>
        <p className="mt-1 text-5xl leading-tight font-semibold tracking-tight md:text-6xl">{formatMoney(summary.expense)}</p>
        {comparison(summary.expense, summary.previousExpense, period) && (
          <p className="mt-1 text-sm text-muted-foreground">
            {comparison(summary.expense, summary.previousExpense, period)}
          </p>
        )}
        {summary.income > 0 && (
          <p className="mt-3 text-sm text-muted-foreground">
            Доход <span className="font-medium text-income">+{formatMoney(summary.income)}</span> · остаток{" "}
            <span className="font-medium text-foreground">{formatMoney(balance, { sign: true })}</span>
          </p>
        )}
      </section>

      {memberCount === 1 && <InviteBanner />}

      {rows.length ? (
        <TransactionList rows={rows} showMembers={memberCount > 1} />
      ) : (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <FileSpreadsheetIcon aria-hidden />
            </EmptyMedia>
            <EmptyTitle>Пока пусто</EmptyTitle>
            <EmptyDescription>
              Нажмите «+», чтобы добавить первую трату, или{" "}
              <Link href="/settings#import" className="text-foreground underline underline-offset-4">
                перенесите историю из Google Таблицы
              </Link>
              .
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent />
        </Empty>
      )}
    </div>
  )
}
