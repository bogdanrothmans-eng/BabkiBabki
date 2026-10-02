import type { Metadata } from "next"

import { TableView } from "@/components/views/table-view"
import { requireContext } from "@/lib/auth"
import { getYearPivot } from "@/lib/queries"

export const metadata: Metadata = { title: "Таблица" }

export default async function TablePage({ searchParams }: PageProps<"/table">) {
  const { y } = await searchParams
  const year = typeof y === "string" && /^\d{4}$/.test(y) ? Number(y) : new Date().getFullYear()
  const { budget } = await requireContext()
  return <TableView year={year} pivot={getYearPivot(budget.id, year)} />
}
