"use client"

import { EllipsisIcon, HomeIcon, ListIcon, Table2Icon } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { AddTransactionTab } from "@/components/add-transaction"
import { cn } from "@/lib/utils"

const DESKTOP_LINKS = [
  { href: "/", label: "Обзор" },
  { href: "/transactions", label: "Записи" },
  { href: "/table", label: "Таблица" },
  { href: "/categories", label: "Категории" },
  { href: "/settings", label: "Настройки" },
]

// Max five slots (ui-ux-pro-max `bottom-nav-limit`); the add button sits in
// the middle like YNAB's, so nothing floats over the content.
const MOBILE_LINKS = [
  { href: "/", label: "Обзор", icon: HomeIcon },
  { href: "/transactions", label: "Записи", icon: ListIcon },
  null,
  { href: "/table", label: "Таблица", icon: Table2Icon },
  { href: "/settings", label: "Ещё", icon: EllipsisIcon, also: ["/categories"] },
]

function isActive(pathname: string, href: string, also: string[] = []) {
  if (href === "/") return pathname === "/"
  return [href, ...also].some((h) => pathname.startsWith(h))
}

export function DesktopNav() {
  const pathname = usePathname()
  return (
    <nav aria-label="Разделы" className="hidden items-center gap-1 md:flex">
      {DESKTOP_LINKS.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          aria-current={isActive(pathname, l.href) ? "page" : undefined}
          className={cn(
            "rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors duration-200 hover:bg-accent hover:text-foreground",
            isActive(pathname, l.href) && "bg-accent font-medium text-foreground",
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
  return (
    <nav
      aria-label="Разделы"
      className="fixed inset-x-0 bottom-0 z-30 border-t bg-background pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <div className="grid grid-cols-5">
        {MOBILE_LINKS.map((l) => {
          if (!l) return <AddTransactionTab key="add" />
          const active = isActive(pathname, l.href, l.also)
          return (
            <Link
              key={l.href}
              href={l.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-h-14 flex-col items-center justify-center gap-0.5 text-xs text-muted-foreground transition-colors duration-200",
                active && "font-medium text-primary",
              )}
            >
              <l.icon className="size-6" aria-hidden />
              {l.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
