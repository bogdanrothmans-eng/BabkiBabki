import type { Metadata } from "next"

import { OverviewView } from "@/components/views/overview-view"
import { requireContext } from "@/lib/auth"
import { parsePeriod } from "@/lib/period"
import { coveredUntil, getSummary, listTransactions } from "@/lib/queries"

export const metadata: Metadata = { title: "Траты" }

export default async function OverviewPage({ searchParams }: PageProps<"/">) {
  const { p } = await searchParams
  const period = parsePeriod(typeof p === "string" ? p : undefined)
  const { budget, members } = await requireContext()
  return (
    <OverviewView
      period={period}
      summary={getSummary(budget.id, period)}
      rows={listTransactions(budget.id, period)}
      coveredUntil={coveredUntil(budget.id)}
      memberCount={members.length}
    />
  )
}
