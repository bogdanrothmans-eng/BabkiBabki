import { XIcon } from "lucide-react"
import Link from "next/link"

import { BackButton } from "@/components/back-button"
import { CategoryIcon } from "@/components/category-icon"
import { MemberAvatar } from "@/components/member-avatars"
import { PeriodPicker } from "@/components/period-picker"
import { TransactionList } from "@/components/transaction-list"
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import type { TransactionFilter } from "@/lib/filter"
import { formatMoney } from "@/lib/money"
import { type Period, periodPreposition } from "@/lib/period"
import { plural } from "@/lib/plural"
import type { Category, TransactionRow } from "@/lib/queries"

// A drill-down from Reports: one category or one person for a period.
// No filter controls — the filter is the reason you came here.
export function TransactionsView({
  period,
  rows,
  filter,
  categories,
  members,
}: {
  period: Period
  rows: TransactionRow[]
  filter: TransactionFilter
  categories: Category[]
  members: { id: string; name: string }[]
}) {
  const category = categories.find((c) => c.id === filter.categoryId)
  const member = members.find((m) => m.id === filter.memberId)
  const total = rows.reduce((s, r) => s + (r.kind === "expense" ? r.amount : 0), 0)
  const title = category?.name ?? (member ? `Платил(а) ${member.name}` : "Все записи")

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <BackButton href="/reports" label="Назад" />
      <div className="flex flex-col items-center gap-2 text-center">
        {category ? (
          <CategoryIcon icon={category.icon} color={category.color} size="lg" />
        ) : (
          member && <MemberAvatar name={member.name} className="size-12 border-0 text-lg" />
        )}
        <h1 className="text-lg font-semibold">{title}</h1>
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {total > 0 && <span className="font-semibold text-foreground">{formatMoney(total)}</span>}
          {total > 0 && " · "}
          {rows.length} {plural(rows.length, ["запись", "записи", "записей"])} {periodPreposition(period)}
        </p>
        <div className="flex items-center gap-2">
          <PeriodPicker period={period} />
          {(category || member) && (
            <Link
              href={`/transactions?p=${period.key}`}
              aria-label="Показать все записи"
              className="flex size-11 items-center justify-center rounded-md text-muted-foreground hover:bg-accent md:size-9"
            >
              <XIcon className="size-4" aria-hidden />
            </Link>
          )}
        </div>
      </div>
      {rows.length ? (
        <TransactionList rows={rows} showMembers={members.length > 1 && !member} />
      ) : (
        <Empty className="border">
          <EmptyHeader>
            <EmptyTitle>Ничего не нашлось</EmptyTitle>
            <EmptyDescription>Попробуйте другой период.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
    </div>
  )
}
