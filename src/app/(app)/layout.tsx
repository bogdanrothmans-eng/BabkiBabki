import Link from "next/link"

import { AddTransaction } from "@/components/add-transaction"
import { DesktopNav, MobileNav } from "@/components/app-nav"
import { MemberAvatars } from "@/components/member-avatars"
import { requireContext } from "@/lib/auth"
import { listCategories } from "@/lib/queries"

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, budget, members } = await requireContext()
  const categories = listCategories(budget.id)

  return (
    <div className="flex min-h-dvh flex-col">
      {/* No backdrop-filter here: it would turn the header into the containing block of the fixed "+" button inside it. */}
      <header className="sticky top-0 z-30 border-b bg-background">
        <div className="mx-auto flex h-14 w-full max-w-5xl items-center gap-4 px-4">
          <Link href="/" className="flex min-w-0 items-center gap-2 font-semibold">
            <span aria-hidden>💸</span>
            <span className="truncate">{budget.name}</span>
          </Link>
          <DesktopNav />
          <div className="ml-auto flex items-center gap-3">
            <Link href="/settings" aria-label="Участники бюджета">
              <MemberAvatars members={members} />
            </Link>
            <AddTransaction
              categories={categories}
              members={members.map((m) => ({ id: m.id, name: m.name }))}
              currentUserId={user.id}
            />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pt-4 pb-28 md:pt-6 md:pb-12">{children}</main>
      <MobileNav />
    </div>
  )
}
