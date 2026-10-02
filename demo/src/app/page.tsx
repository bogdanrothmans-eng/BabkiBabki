"use client"

import { useSearchParams } from "next/navigation"

import { OverviewView } from "@/components/views/overview-view"
import { parsePeriod } from "@/lib/period"

import { getSummary, listTransactions, useDemo } from "../store"

export default function OverviewPage() {
  const s = useDemo()
  const period = parsePeriod(useSearchParams().get("p") ?? undefined)
  if (!s) return null
  return (
    <OverviewView
      period={period}
      summary={getSummary(s, period)}
      rows={listTransactions(s, period)}
      memberCount={s.members.length}
    />
  )
}
