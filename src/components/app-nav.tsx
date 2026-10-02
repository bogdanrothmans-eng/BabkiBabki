"use client"

import { HomeIcon, ListIcon, SettingsIcon, Table2Icon, TagsIcon } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"

const LINKS = [
  { href: "/", label: "Обзор", icon: HomeIcon },
  { href: "/transactions", label: "Записи", icon: ListIcon },
  { href: "/table", label: "Таблица", icon: Table2Icon },
  { href: "/categories", label: "Категории", icon: TagsIcon },
  { href: "/settings", label: "Настройки", icon: SettingsIcon },
]

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href)
}

export function DesktopNav() {
  const pathname = usePathname()
  return (
    <nav className="hidden items-center gap-1 md:flex">
      {LINKS.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          aria-current={isActive(pathname, l.href) ? "page" : undefined}
          className={cn(
            "rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground",
            isActive(pathname, l.href) && "bg-accent text-foreground",
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
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
      <div className="grid grid-cols-5">
        {LINKS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            aria-current={isActive(pathname, l.href) ? "page" : undefined}
            className={cn(
              "flex flex-col items-center gap-0.5 py-2 text-[11px] text-muted-foreground",
              isActive(pathname, l.href) && "text-foreground",
            )}
          >
            <l.icon className="size-5" />
            {l.label}
          </Link>
        ))}
      </div>
    </nav>
  )
}
