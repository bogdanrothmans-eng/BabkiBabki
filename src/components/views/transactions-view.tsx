import { PeriodPicker } from "@/components/period-picker"
import { TransactionFilters } from "@/components/transaction-filters"
import { TransactionList } from "@/components/transaction-list"
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import { formatMoney } from "@/lib/money"
import type { Period } from "@/lib/period"
import { plural } from "@/lib/plural"
import type { Category, TransactionRow } from "@/lib/queries"

export function TransactionsView({
  period,
  rows,
  categories,
  members,
}: {
  period: Period
  rows: TransactionRow[]
  categories: Category[]
  members: { id: string; name: string }[]
}) {
  const expense = rows.filter((r) => r.kind === "expense").reduce((s, r) => s + r.amount, 0)
  const income = rows.filter((r) => r.kind === "income").reduce((s, r) => s + r.amount, 0)

  return (
    <div className="flex flex-col gap-4">
      <h1 className="sr-only">Записи</h1>
      <div className="flex flex-col items-center gap-3 md:flex-row md:justify-between">
        <PeriodPicker period={period} />
        <p className="text-sm text-muted-foreground" aria-live="polite">
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
        members={members}
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
