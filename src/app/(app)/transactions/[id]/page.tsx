import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { EntryView } from "@/components/views/entry-view"
import { requireContext } from "@/lib/auth"
import { getTransaction, listCategories } from "@/lib/queries"

export const metadata: Metadata = { title: "Запись" }

export default async function TransactionPage({ params }: PageProps<"/transactions/[id]">) {
  const { id } = await params
  const { user, budget, members } = await requireContext()
  const entry = getTransaction(budget.id, id)
  if (!entry) notFound()
  return (
    <EntryView
      entry={entry}
      categories={listCategories(budget.id)}
      members={members.map((m) => ({ id: m.id, name: m.name }))}
      currentUserId={user.id}
    />
  )
}
