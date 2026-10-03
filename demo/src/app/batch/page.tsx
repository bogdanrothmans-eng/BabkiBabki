"use client"

import { useSearchParams } from "next/navigation"

import { BatchView } from "@/components/views/batch-view"
import { parsePeriod } from "@/lib/period"

import { getSummary, listCategories, useDemo } from "../../store"

export default function BatchPage() {
  const s = useDemo()
  const period = parsePeriod(useSearchParams().get("p") ?? undefined)
  if (!s) return null
  return (
    <BatchView
      key={period.key}
      period={period}
      categories={listCategories(s)}
      existing={getSummary(s, period).expenses}
      members={s.members.map((m) => ({ id: m.id, name: m.name }))}
      currentUserId={s.currentUserId}
    />
  )
}
