"use client"

import { PlusIcon } from "lucide-react"
import { createContext, useContext, useState } from "react"

import { QuickAdd } from "@/components/quick-add"
import { ResponsiveDialog } from "@/components/responsive-dialog"
import { type CategoryOption, type MemberOption, TransactionForm } from "@/components/transaction-form"
import { Button } from "@/components/ui/button"
import type { HistoryItem } from "@/lib/quick-entry"
import { cn } from "@/lib/utils"

type Mode = "line" | "list"
const AddTransactionContext = createContext<(mode?: Mode) => void>(() => {})

export function useAddTransaction() {
  return useContext(AddTransactionContext)
}

// One add dialog for the whole app shell: opened from the desktop header
// button and from the "+" in the middle of the mobile tab bar. It starts in
// quick entry ("350 кофе"); the full form is for receipts and comments.
export function AddTransactionProvider({
  children,
  history,
  ...props
}: {
  children: React.ReactNode
  categories: CategoryOption[]
  members: MemberOption[]
  currentUserId: string
  history: HistoryItem[]
}) {
  const [open, setOpen] = useState(false)
  const [detailed, setDetailed] = useState(false)
  const [mode, setMode] = useState<Mode>("line")
  // Remount on every open so it starts empty.
  const [round, setRound] = useState(0)

  function show(next: Mode = "line") {
    setRound((r) => r + 1)
    setDetailed(false)
    setMode(next)
    setOpen(true)
  }

  return (
    <AddTransactionContext value={show}>
      {children}
      <ResponsiveDialog open={open} onOpenChange={setOpen} title="Новая запись">
        {detailed ? (
          <TransactionForm key={round} {...props} onSaved={() => setOpen(false)} />
        ) : (
          <QuickAdd
            key={round}
            {...props}
            history={history}
            initialMode={mode}
            onDetailed={() => setDetailed(true)}
            onDone={() => setOpen(false)}
          />
        )}
      </ResponsiveDialog>
    </AddTransactionContext>
  )
}

export function AddTransactionButton({ className }: { className?: string }) {
  const show = useContext(AddTransactionContext)
  return (
    <Button onClick={() => show()} className={className}>
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
