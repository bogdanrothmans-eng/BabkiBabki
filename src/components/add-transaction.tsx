"use client"

import { PlusIcon } from "lucide-react"
import { useState } from "react"

import { ResponsiveDialog } from "@/components/responsive-dialog"
import { type CategoryOption, type MemberOption, TransactionForm } from "@/components/transaction-form"
import { Button } from "@/components/ui/button"

export function AddTransaction(props: {
  categories: CategoryOption[]
  members: MemberOption[]
  currentUserId: string
}) {
  const [open, setOpen] = useState(false)
  // Remount the form on every open so it starts empty.
  const [round, setRound] = useState(0)

  function show() {
    setRound((r) => r + 1)
    setOpen(true)
  }

  return (
    <>
      <Button onClick={show} className="hidden md:inline-flex">
        <PlusIcon />
        Добавить
      </Button>
      <Button
        onClick={show}
        size="icon-lg"
        aria-label="Добавить запись"
        className="fixed right-4 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-40 size-14 rounded-full shadow-lg md:hidden [&_svg:not([class*='size-'])]:size-6"
      >
        <PlusIcon />
      </Button>
      <ResponsiveDialog open={open} onOpenChange={setOpen} title="Новая запись">
        <TransactionForm key={round} {...props} onSaved={() => setOpen(false)} />
      </ResponsiveDialog>
    </>
  )
}
