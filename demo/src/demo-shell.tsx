"use client"

import { WalletIcon } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

import { AccountMenu } from "@/components/account-menu"
import { AddTransactionButton, AddTransactionProvider } from "@/components/add-transaction"
import { DesktopNav, MobileNav } from "@/components/app-nav"
import { NavigationTracker } from "@/components/back-button"
import { Skeleton } from "@/components/ui/skeleton"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

import { listCategories, update, useDemo } from "./store"

// One quiet line: the demo has no login, so this switch shows the partner's view.
function DemoBar() {
  const s = useDemo()
  if (!s) return null
  return (
    <div className="border-b bg-accent">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-4 py-1.5 text-sm">
        <span className="text-muted-foreground">
          <span className="font-medium text-foreground">Демо</span> · вы:
        </span>
        <ToggleGroup
          type="single"
          size="sm"
          value={s.currentUserId}
          onValueChange={(v) => {
            if (!v) return
            update((d) => {
              d.currentUserId = v
            })
            toast(`Теперь вы — ${s.members.find((m) => m.id === v)?.name}`)
          }}
          aria-label="Чьими глазами смотреть"
          className="mr-auto"
        >
          {s.members.map((m) => (
            <ToggleGroupItem
              key={m.id}
              value={m.id}
              className="h-11 rounded-full px-3 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground md:h-8"
            >
              {m.name}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>
    </div>
  )
}

export function DemoShell({ children }: { children: React.ReactNode }) {
  const s = useDemo()

  const shell = (
    <div className="flex min-h-dvh flex-col">
      <DemoBar />
      <header className="sticky top-0 z-30 border-b bg-background pt-[env(safe-area-inset-top)]">
        <div className="mx-auto flex h-14 w-full max-w-5xl items-center gap-4 px-4">
          <Link href="/" className="flex min-h-11 min-w-0 items-center gap-2 font-semibold">
            <span aria-hidden className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <WalletIcon className="size-4" />
            </span>
            <span className="truncate">{s?.budget.name ?? "Бабки"}</span>
          </Link>
          <DesktopNav />
          <div className="ml-auto flex items-center gap-3">
            {s && <AccountMenu members={s.members} budgetName={s.budget.name} />}
            {s && <AddTransactionButton className="hidden md:inline-flex" />}
          </div>
        </div>
      </header>
      <main
        id="main"
        tabIndex={-1}
        className="mx-auto w-full max-w-5xl flex-1 px-4 pt-4 pb-[calc(6rem+env(safe-area-inset-bottom))] outline-none md:pt-6 md:pb-12"
      >
        {s ? children : <PageSkeleton />}
      </main>
      <MobileNav />
      <NavigationTracker />
    </div>
  )

  if (!s) return shell
  return (
    <AddTransactionProvider
      categories={listCategories(s)}
      members={s.members.map((m) => ({ id: m.id, name: m.name }))}
      currentUserId={s.currentUserId}
    >
      {shell}
    </AddTransactionProvider>
  )
}

export function PageSkeleton() {
  return (
    <div className="flex flex-col gap-4" role="status" aria-label="Загрузка">
      <Skeleton className="mx-auto h-11 w-56 md:mx-0 md:h-9" />
      <Skeleton className="h-48 rounded-2xl" />
      <Skeleton className="h-64 rounded-2xl" />
    </div>
  )
}
