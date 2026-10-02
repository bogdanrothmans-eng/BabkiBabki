"use client"

import { LogOutIcon, SettingsIcon, TagsIcon } from "lucide-react"
import Link from "next/link"

import { MemberAvatars } from "@/components/member-avatars"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { plural } from "@/lib/plural"

const ITEM = "min-h-11 gap-3 text-base md:min-h-8 md:text-sm"

// Secondary destinations, out of the way of the two main tabs.
export function AccountMenu({
  members,
  budgetName,
  logout,
}: {
  members: { id: string; name: string }[]
  budgetName: string
  logout?: () => Promise<void>
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Меню: участники, категории, настройки"
        className="flex min-h-11 items-center rounded-full focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
      >
        <MemberAvatars members={members} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="font-normal">
          <span className="block truncate font-medium">{budgetName}</span>
          <span className="text-muted-foreground">
            {members.length === 1 ? "Только вы" : `${members.length} ${plural(members.length, ["участник", "участника", "участников"])}`}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild className={ITEM}>
          <Link href="/categories">
            <TagsIcon aria-hidden />
            Категории
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className={ITEM}>
          <Link href="/settings">
            <SettingsIcon aria-hidden />
            Участники и настройки
          </Link>
        </DropdownMenuItem>
        {logout && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem className={ITEM} onSelect={() => logout()}>
              <LogOutIcon aria-hidden />
              Выйти
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
