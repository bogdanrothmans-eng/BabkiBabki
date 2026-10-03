import type { Metadata } from "next"

import { BatchView } from "@/components/views/batch-view"
import { requireContext } from "@/lib/auth"
import { parsePeriod } from "@/lib/period"
import { getSummary, listCategories } from "@/lib/queries"

export const metadata: Metadata = { title: "Суммы по категориям" }

export default async function BatchPage({ searchParams }: PageProps<"/batch">) {
  const { p } = await searchParams
  const period = parsePeriod(typeof p === "string" ? p : undefined)
  const { user, budget, members } = await requireContext()
  return (
    <BatchView
      key={period.key}
      period={period}
      categories={listCategories(budget.id)}
      existing={getSummary(budget.id, period).expenses}
      members={members.map((m) => ({ id: m.id, name: m.name }))}
      currentUserId={user.id}
    />
  )
}
