"use client"

import { useSearchParams } from "next/navigation"

import { TableView } from "@/components/views/table-view"

import { getYearPivot, useDemo } from "../../store"

export default function TablePage() {
  const s = useDemo()
  const y = useSearchParams().get("y")
  const year = y && /^\d{4}$/.test(y) ? Number(y) : new Date().getFullYear()
  if (!s) return null
  return <TableView year={year} pivot={getYearPivot(s, year)} />
}
