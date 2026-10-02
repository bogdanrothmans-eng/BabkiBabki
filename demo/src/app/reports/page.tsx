"use client"

import { useSearchParams } from "next/navigation"

import { ReportsView } from "@/components/views/reports-view"
import { parsePeriod } from "@/lib/period"

import { getSummary, useDemo } from "../../store"

export default function ReportsPage() {
  const s = useDemo()
  const period = parsePeriod(useSearchParams().get("p") ?? undefined)
  if (!s) return null
  return <ReportsView period={period} summary={getSummary(s, period)} memberCount={s.members.length} />
}
