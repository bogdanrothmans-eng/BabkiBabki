"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"

import { EntryView } from "@/components/views/entry-view"
import { Button } from "@/components/ui/button"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"

import { getEntry, listCategories, useDemo } from "../../store"

// /transactions/[id] in the real app; a static export needs a query param.
export default function EntryPage() {
  const s = useDemo()
  const entryId = useSearchParams().get("id") ?? ""
  if (!s) return null
  const entry = getEntry(s, entryId)
  if (!entry) {
    return (
      <Empty className="border">
        <EmptyHeader>
          <EmptyTitle>Запись не найдена</EmptyTitle>
          <EmptyDescription>Возможно, её удалили.</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button asChild variant="outline">
            <Link href="/transactions">Ко всем записям</Link>
          </Button>
        </EmptyContent>
      </Empty>
    )
  }
  return (
    <EntryView
      entry={entry}
      categories={listCategories(s)}
      members={s.members.map((m) => ({ id: m.id, name: m.name }))}
      currentUserId={s.currentUserId}
    />
  )
}
