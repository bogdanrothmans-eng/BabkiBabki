import type { Metadata } from "next"

import { PeriodPicker } from "@/components/period-picker"
import { TransactionFilters } from "@/components/transaction-filters"
import { TransactionList } from "@/components/transaction-list"
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import { requireContext } from "@/lib/auth"
import { formatMoney } from "@/lib/money"
import { parsePeriod } from "@/lib/period"
import { plural } from "@/lib/plural"
import { type Kind, listCategories, listTransactions } from "@/lib/queries"

export const metadata: Metadata = { title: "Записи" }

const str = (v: string | string[] | undefined) => (typeof v === "string" && v ? v : undefined)

export default async function TransactionsPage({ searchParams }: PageProps<"/transactions">) {
  const params = await searchParams
  const period = parsePeriod(str(params.p))
  const { budget, members } = await requireContext()
  const kind = str(params.kind)
  const rows = listTransactions(budget.id, period, {
    categoryId: str(params.category),
    memberId: str(params.member),
    kind: kind === "expense" || kind === "income" ? (kind as Kind) : undefined,
    q: str(params.q),
  })
  const expense = rows.filter((r) => r.kind === "expense").reduce((s, r) => s + r.amount, 0)
  const income = rows.filter((r) => r.kind === "income").reduce((s, r) => s + r.amount, 0)
  const categories = listCategories(budget.id, { includeArchived: true })

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col items-center gap-3 md:flex-row md:justify-between">
        <PeriodPicker period={period} />
        <p className="text-sm text-muted-foreground">
          {rows.length} {plural(rows.length, ["запись", "записи", "записей"])}
          {expense > 0 && (
            <>
              {" · "}
              <span className="font-semibold text-foreground">{formatMoney(expense)}</span>
            </>
          )}
          {income > 0 && (
            <>
              {" · "}
              <span className="font-semibold text-income">+{formatMoney(income)}</span>
            </>
          )}
        </p>
      </div>
      <TransactionFilters
        categories={categories}
        members={members.map((m) => ({ id: m.id, name: m.name }))}
      />
      {rows.length ? (
        <TransactionList rows={rows} showMembers={members.length > 1} />
      ) : (
        <Empty className="border">
          <EmptyHeader>
            <EmptyTitle>Ничего не нашлось</EmptyTitle>
            <EmptyDescription>Попробуйте другой период или сбросьте фильтры.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
    </div>
  )
}
