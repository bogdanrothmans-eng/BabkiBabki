import { WalletIcon } from "lucide-react"
import Link from "next/link"

import { AddTransactionButton, AddTransactionProvider } from "@/components/add-transaction"
import { DesktopNav, MobileNav } from "@/components/app-nav"
import { NavigationTracker } from "@/components/back-button"
import { MemberAvatars } from "@/components/member-avatars"
import { requireContext } from "@/lib/auth"
import { listCategories } from "@/lib/queries"

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, budget, members } = await requireContext()
  const categories = listCategories(budget.id)

  return (
    <AddTransactionProvider
      categories={categories}
      members={members.map((m) => ({ id: m.id, name: m.name }))}
      currentUserId={user.id}
    >
      <div className="flex min-h-dvh flex-col">
        <header className="sticky top-0 z-30 border-b bg-background pt-[env(safe-area-inset-top)]">
          <div className="mx-auto flex h-14 w-full max-w-5xl items-center gap-4 px-4">
            <Link href="/" className="flex min-h-11 min-w-0 items-center gap-2 font-semibold">
              <span
                aria-hidden
                className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground"
              >
                <WalletIcon className="size-4" />
              </span>
              <span className="truncate">{budget.name}</span>
            </Link>
            <DesktopNav />
            <div className="ml-auto flex items-center gap-3">
              <Link href="/settings" aria-label="Участники бюджета" className="flex min-h-11 items-center">
                <MemberAvatars members={members} />
              </Link>
              <AddTransactionButton className="hidden md:inline-flex" />
            </div>
          </div>
        </header>
        <main
          id="main"
          tabIndex={-1}
          className="mx-auto w-full max-w-5xl flex-1 px-4 pt-4 pb-[calc(6rem+env(safe-area-inset-bottom))] outline-none md:pt-6 md:pb-12"
        >
          {children}
        </main>
        <MobileNav />
        <NavigationTracker />
      </div>
    </AddTransactionProvider>
  )
}
