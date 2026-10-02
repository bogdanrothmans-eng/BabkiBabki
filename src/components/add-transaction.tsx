"use client"

import { PlusIcon } from "lucide-react"
import { createContext, useContext, useState } from "react"

import { ResponsiveDialog } from "@/components/responsive-dialog"
import { type CategoryOption, type MemberOption, TransactionForm } from "@/components/transaction-form"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const AddTransactionContext = createContext<() => void>(() => {})

// One form instance for the whole app shell: opened from the desktop header
// button and from the "+" in the middle of the mobile tab bar.
export function AddTransactionProvider({
  children,
  ...props
}: {
  children: React.ReactNode
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
    <AddTransactionContext value={show}>
      {children}
      <ResponsiveDialog open={open} onOpenChange={setOpen} title="Новая запись">
        <TransactionForm key={round} {...props} onSaved={() => setOpen(false)} />
      </ResponsiveDialog>
    </AddTransactionContext>
  )
}

export function AddTransactionButton({ className }: { className?: string }) {
  const show = useContext(AddTransactionContext)
  return (
    <Button onClick={show} className={className}>
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
      onClick={show}
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
