import type { Metadata } from "next"

import { TransactionsView } from "@/components/views/transactions-view"
import { requireContext } from "@/lib/auth"
import { parseFilter } from "@/lib/filter"
import { parsePeriod } from "@/lib/period"
import { listCategories, listTransactions } from "@/lib/queries"

export const metadata: Metadata = { title: "Записи" }

export default async function TransactionsPage({ searchParams }: PageProps<"/transactions">) {
  const params = await searchParams
  const get = (key: string) => (typeof params[key] === "string" ? (params[key] as string) : undefined)
  const period = parsePeriod(get("p"))
  const { budget, members } = await requireContext()
  return (
    <TransactionsView
      period={period}
      rows={listTransactions(budget.id, period, parseFilter(get))}
      categories={listCategories(budget.id, { includeArchived: true })}
      members={members.map((m) => ({ id: m.id, name: m.name }))}
    />
  )
}
