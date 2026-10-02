"use client"

import { ChartPieIcon, ReceiptTextIcon } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { AddTransactionTab } from "@/components/add-transaction"
import { cn } from "@/lib/utils"

// Two places plus the add button — everything else (categories, settings)
// lives in the account menu (ui-ux-pro-max `nav-hierarchy`, `overflow-menu`).
const LINKS = [
  {
    href: "/",
    label: "Траты",
    icon: ReceiptTextIcon,
    match: (p: string) => p === "/" || p.startsWith("/entry"),
  },
  {
    href: "/reports",
    label: "Отчёты",
    icon: ChartPieIcon,
    // Category / person drill-downs are opened from Reports.
    match: (p: string) => p.startsWith("/reports") || p.startsWith("/table") || p === "/transactions",
  },
]

export function DesktopNav() {
  const pathname = usePathname()
  return (
    <nav aria-label="Разделы" className="hidden items-center gap-1 md:flex">
      {LINKS.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          aria-current={l.match(pathname) ? "page" : undefined}
          className={cn(
            "rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors duration-200 hover:bg-accent hover:text-foreground",
            l.match(pathname) && "bg-accent font-medium text-foreground",
          )}
        >
          {l.label}
        </Link>
      ))}
    </nav>
  )
}

export function MobileNav() {
  const pathname = usePathname()
  const [spent, reports] = LINKS
  const tab = (l: (typeof LINKS)[number]) => (
    <Link
      href={l.href}
      aria-current={l.match(pathname) ? "page" : undefined}
      className={cn(
        "flex min-h-14 flex-col items-center justify-center gap-0.5 text-xs text-muted-foreground transition-colors duration-200",
        l.match(pathname) && "font-medium text-primary",
      )}
    >
      <l.icon className="size-6" aria-hidden />
      {l.label}
    </Link>
  )
  return (
    <nav
      aria-label="Разделы"
      className="fixed inset-x-0 bottom-0 z-30 border-t bg-background pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <div className="grid grid-cols-3">
        {tab(spent)}
        <AddTransactionTab />
        {tab(reports)}
      </div>
    </nav>
  )
}
