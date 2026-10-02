import { ArrowRightIcon, FileSpreadsheetIcon } from "lucide-react"
import Link from "next/link"

import { CategoryBreakdown } from "@/components/category-breakdown"
import { InviteBanner } from "@/components/invite-banner"
import { MemberAvatar } from "@/components/member-avatars"
import { PeriodPicker } from "@/components/period-picker"
import { TransactionList } from "@/components/transaction-list"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { formatMoney } from "@/lib/money"
import { type Period, periodPreposition, shiftPeriod } from "@/lib/period"
import { plural } from "@/lib/plural"
import type { Summary, TransactionRow } from "@/lib/queries"

function comparison(current: number, previous: number, period: Period) {
  if (!previous || !current) return null
  const diff = current - previous
  const prev = period.kind === "range" ? "за предыдущий период" : periodPreposition(shiftPeriod(period, -1))
  if (Math.abs(diff) < previous * 0.01) return `Почти столько же, сколько ${prev}`
  return `На ${formatMoney(Math.abs(diff))} ${diff > 0 ? "больше" : "меньше"}, чем ${prev}`
}

export function OverviewView({
  period,
  summary,
  recent,
  memberCount,
}: {
  period: Period
  summary: Summary
  recent: TransactionRow[]
  memberCount: number
}) {
  const balance = summary.income - summary.expense
  const showMembers = memberCount > 1

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <h1 className="sr-only">Обзор</h1>
      <div className="flex justify-center md:justify-start">
        <PeriodPicker period={period} />
      </div>

      {memberCount === 1 && <InviteBanner />}

      <section aria-labelledby="total-label" className="rounded-2xl border bg-card px-5 py-6 md:px-8 md:py-8">
        <p id="total-label" className="text-sm text-muted-foreground">
          Потрачено {periodPreposition(period)}
        </p>
        <p className="mt-1 text-5xl leading-tight font-semibold tracking-tight md:text-6xl">{formatMoney(summary.expense)}</p>
        <p className="mt-2 text-sm text-muted-foreground">
          {comparison(summary.expense, summary.previousExpense, period) ??
            `${summary.count} ${plural(summary.count, ["запись", "записи", "записей"])}`}
        </p>

        <dl className="mt-6 grid grid-cols-2 gap-4 border-t pt-4 md:flex md:gap-10">
          <div>
            <dt className="text-xs text-muted-foreground">Доход</dt>
            <dd className={summary.income ? "text-lg font-semibold text-income" : "text-lg text-muted-foreground"}>
              {summary.income ? `+${formatMoney(summary.income)}` : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Остаток</dt>
            <dd className={summary.income ? "text-lg font-semibold" : "text-lg text-muted-foreground"}>
              {summary.income ? formatMoney(balance, { sign: true }) : "—"}
            </dd>
          </div>
          {showMembers &&
            summary.byMember
              .filter((m) => m.member_id)
              .map((m) => (
                <div key={m.member_id} className="flex items-center gap-2">
                  <MemberAvatar name={m.name} className="border-0" />
                  <div>
                    <dt className="text-xs text-muted-foreground">Платил(а) {m.name}</dt>
                    <dd className="text-lg font-semibold">{formatMoney(m.total)}</dd>
                  </div>
                </div>
              ))}
        </dl>
      </section>

      {summary.count === 0 ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <FileSpreadsheetIcon aria-hidden />
            </EmptyMedia>
            <EmptyTitle>За этот период записей нет</EmptyTitle>
            <EmptyDescription>
              Нажмите «Добавить», чтобы внести трату, или перенесите историю из Google Таблицы.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button asChild variant="outline">
              <Link href="/settings#import">Импортировать таблицу</Link>
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-[1.1fr_1fr] md:gap-6">
          <Card className="gap-4">
            <CardHeader>
              <CardTitle>
                <h2>По категориям</h2>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {summary.expenses.length ? (
                <CategoryBreakdown items={summary.expenses} total={summary.expense} periodKey={period.key} />
              ) : (
                <p className="text-sm text-muted-foreground">Расходов пока нет.</p>
              )}
              {summary.incomes.length > 0 && (
                <>
                  <h3 className="mt-6 mb-2 font-medium">Доходы</h3>
                  <CategoryBreakdown items={summary.incomes} total={summary.income} periodKey={period.key} />
                </>
              )}
            </CardContent>
          </Card>

          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Последние записи</h2>
              <Button asChild variant="ghost" size="sm">
                <Link href={`/transactions?p=${period.key}`}>
                  Все записи
                  <ArrowRightIcon aria-hidden />
                </Link>
              </Button>
            </div>
            <TransactionList rows={recent} showMembers={showMembers} />
          </div>
        </div>
      )}
    </div>
  )
}
