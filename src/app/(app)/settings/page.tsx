import { ChevronRightIcon, TagsIcon } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"

import { BudgetNameForm } from "@/components/budget-name-form"
import { ImportForm } from "@/components/import-form"
import { InvitePanel } from "@/components/invite-panel"
import { MemberAvatar } from "@/components/member-avatars"
import { RemoveMemberButton } from "@/components/remove-member-button"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { logout, switchBudget } from "@/lib/actions/auth"
import { budgetsOf, requireContext } from "@/lib/auth"
import { listInvites } from "@/lib/queries"

export const metadata: Metadata = { title: "Настройки" }

export default async function SettingsPage() {
  const { user, budget, role, members } = await requireContext()
  const invites = listInvites(budget.id)
  const budgets = budgetsOf(user.id)

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <h1 className="text-xl font-semibold">Настройки</h1>

      <Card>
        <CardHeader>
          <CardTitle>Участники</CardTitle>
          <CardDescription>Все участники видят и вносят записи, комментарии и чеки.</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="flex flex-col gap-1">
            {members.map((m) => (
              <li key={m.id} className="flex min-h-16 items-center gap-3">
                <MemberAvatar name={m.name} className="size-9 border-0" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-base font-medium md:text-sm">
                    {m.name} {m.id === user.id && <span className="text-muted-foreground">(вы)</span>}
                  </p>
                  <p className="truncate text-sm text-muted-foreground md:text-xs">{m.email}</p>
                </div>
                {m.role === "owner" ? (
                  <Badge variant="secondary">владелец</Badge>
                ) : (
                  role === "owner" && (
                    <RemoveMemberButton id={m.id} name={m.name} />
                  )
                )}
              </li>
            ))}
            <InvitePanel invites={invites} />
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
          <CardTitle>Импорт из Google Таблицы</CardTitle>
          <CardDescription>Перенесите историю из таблицы «категории × месяцы».</CardDescription>
        </CardHeader>
        <CardContent>
          <ImportForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Бюджет</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <BudgetNameForm name={budget.name} />
          {budgets.length > 1 && (
            <div className="flex flex-wrap gap-2">
              {budgets.map((b) => (
                <form key={b.id} action={switchBudget.bind(null, b.id)}>
                  <Button type="submit" size="sm" variant={b.id === budget.id ? "default" : "outline"}>
                    {b.name}
                  </Button>
                </form>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Аккаунт</CardTitle>
          <CardDescription>
            {user.name} · {user.email}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={logout}>
            <Button type="submit" variant="outline">
              Выйти
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
