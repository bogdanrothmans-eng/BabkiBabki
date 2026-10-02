import type { Metadata } from "next"

import { ReportsView } from "@/components/views/reports-view"
import { requireContext } from "@/lib/auth"
import { parsePeriod } from "@/lib/period"
import { getSummary } from "@/lib/queries"

export const metadata: Metadata = { title: "Отчёты" }

export default async function ReportsPage({ searchParams }: PageProps<"/reports">) {
  const { p } = await searchParams
  const period = parsePeriod(typeof p === "string" ? p : undefined)
  const { budget, members } = await requireContext()
  return <ReportsView period={period} summary={getSummary(budget.id, period)} memberCount={members.length} />
}
