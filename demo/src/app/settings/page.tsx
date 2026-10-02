"use client"

import { ChevronRightIcon, CodeIcon, TagsIcon } from "lucide-react"
import Link from "next/link"

import { BudgetNameForm } from "@/components/budget-name-form"
import { ImportForm } from "@/components/import-form"
import { MemberAvatar } from "@/components/member-avatars"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

import { useDemo } from "../../store"

const REPO = "https://github.com/bogdanrothmans-eng/BabkiBabki"

export default function SettingsPage() {
  const s = useDemo()
  if (!s) return null
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <h1 className="text-xl font-semibold">Настройки</h1>

      <Card>
        <CardHeader>
          <CardTitle>
            <h2>Участники</h2>
          </CardTitle>
          <CardDescription>
            В демо оба партнёра уже в бюджете — переключайтесь между ними вверху страницы. В полной версии второго
            человека зовут одноразовой ссылкой.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="flex flex-col gap-1">
            {s.members.map((m) => (
              <li key={m.id} className="flex min-h-16 items-center gap-3">
                <MemberAvatar name={m.name} className="size-9 border-0" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-base font-medium md:text-sm">
                    {m.name} {m.id === s.currentUserId && <span className="text-muted-foreground">(вы)</span>}
                  </p>
                  <p className="truncate text-sm text-muted-foreground md:text-xs">{m.email}</p>
                </div>
                {m.role === "owner" && <Badge variant="secondary">владелец</Badge>}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Link
        href="/categories"
        className="flex min-h-16 items-center gap-3 rounded-xl border bg-card px-4 py-3 transition-colors duration-150 hover:bg-accent/60 md:hidden"
      >
        <TagsIcon className="size-5 text-muted-foreground" aria-hidden />
        <span className="flex-1">
          <span className="block font-medium">Категории</span>
          <span className="text-sm text-muted-foreground">Добавить, переименовать, сменить иконку</span>
        </span>
        <ChevronRightIcon className="size-5 text-muted-foreground" aria-hidden />
      </Link>

      <Card id="import" className="scroll-mt-20">
        <CardHeader>
          <CardTitle>
            <h2>Импорт из Google Таблицы</h2>
          </CardTitle>
          <CardDescription>Файл обрабатывается прямо в браузере и никуда не отправляется.</CardDescription>
        </CardHeader>
        <CardContent>
          <ImportForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            <h2>Бюджет</h2>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <BudgetNameForm key={s.budget.name} name={s.budget.name} />
        </CardContent>
      </Card>

      <a
        href={REPO}
        className="flex min-h-16 items-center gap-3 rounded-xl border bg-card px-4 py-3 transition-colors duration-150 hover:bg-accent/60"
      >
        <CodeIcon className="size-5 text-muted-foreground" aria-hidden />
        <span className="flex-1">
          <span className="block font-medium">Исходный код и полная версия</span>
          <span className="text-sm text-muted-foreground">Вход, общая база на двоих, приглашения — в репозитории</span>
        </span>
        <ChevronRightIcon className="size-5 text-muted-foreground" aria-hidden />
      </a>
    </div>
  )
}
