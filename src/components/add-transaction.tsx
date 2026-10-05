"use client"

import { PlusIcon } from "lucide-react"
import { createContext, useContext, useState } from "react"

import { AddSheet, type AddView } from "@/components/add-sheet"
import { ResponsiveDialog } from "@/components/responsive-dialog"
import type { CategoryOption, MemberOption } from "@/components/transaction-form"
import { Button } from "@/components/ui/button"
import type { HistoryItem } from "@/lib/quick-entry"
import { cn } from "@/lib/utils"

const AddTransactionContext = createContext<(view?: AddView) => void>(() => {})

export function useAddTransaction() {
  return useContext(AddTransactionContext)
}

// One add sheet for the whole app shell: opened from the desktop header
// button and from the "+" in the middle of the mobile tab bar.
export function AddTransactionProvider({
  children,
  ...props
}: {
  children: React.ReactNode
  categories: CategoryOption[]
  members: MemberOption[]
  currentUserId: string
  history: HistoryItem[]
}) {
  const [open, setOpen] = useState(false)
  const [view, setView] = useState<AddView>("amount")
  // Remount on every open so it starts empty.
  const [round, setRound] = useState(0)

  function show(next: AddView = "amount") {
    setRound((r) => r + 1)
    setView(next)
    setOpen(true)
  }

  return (
    <AddTransactionContext value={show}>
      {children}
      <ResponsiveDialog open={open} onOpenChange={setOpen} title="Новая запись" bare className="bg-card">
        <AddSheet key={round} {...props} initialView={view} onClose={() => setOpen(false)} />
      </ResponsiveDialog>
    </AddTransactionContext>
  )
}

export function AddTransactionButton({ className }: { className?: string }) {
  const show = useContext(AddTransactionContext)
  return (
    <Button onClick={() => show()} className={cn("rounded-full", className)}>
      <PlusIcon aria-hidden />
      Добавить
    </Button>
  )
}

export function AddTransactionTab({ className }: { className?: string }) {
  const show = useContext(AddTransactionContext)
  return (
    <button
      type="button"
      onClick={() => show()}
      aria-label="Добавить запись"
      className={cn(
        "flex flex-col items-center justify-center py-1.5 focus-visible:outline-none",
        "[&>span]:focus-visible:ring-[3px] [&>span]:focus-visible:ring-ring/50",
        className,
      )}
    >
      <span className="flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md transition-transform active:scale-95">
        <PlusIcon className="size-6" aria-hidden />
      </span>
    </button>
  )
}
