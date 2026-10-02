"use client"

import { useSearchParams } from "next/navigation"

import { TransactionsView } from "@/components/views/transactions-view"
import { parseFilter } from "@/lib/filter"
import { parsePeriod } from "@/lib/period"

import { listCategories, listTransactions, useDemo } from "../../store"

export default function TransactionsPage() {
  const s = useDemo()
  const params = useSearchParams()
  const period = parsePeriod(params.get("p") ?? undefined)
  if (!s) return null
  const filter = parseFilter((key) => params.get(key))
  return (
    <TransactionsView
      period={period}
      filter={filter}
      rows={listTransactions(s, period, filter)}
      categories={listCategories(s, { includeArchived: true })}
      members={s.members.map((m) => ({ id: m.id, name: m.name }))}
    />
  )
}
