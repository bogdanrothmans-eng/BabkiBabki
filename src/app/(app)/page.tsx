import type { Metadata } from "next"

import { OverviewView } from "@/components/views/overview-view"
import { requireContext } from "@/lib/auth"
import { parsePeriod } from "@/lib/period"
import { getSummary, listTransactions } from "@/lib/queries"

export const metadata: Metadata = { title: "Обзор" }

export default async function OverviewPage({ searchParams }: PageProps<"/">) {
  const { p } = await searchParams
  const period = parsePeriod(typeof p === "string" ? p : undefined)
  const { budget, members } = await requireContext()
  return (
    <OverviewView
      period={period}
      summary={getSummary(budget.id, period)}
      recent={listTransactions(budget.id, period, { limit: 8 })}
      memberCount={members.length}
    />
  )
}
