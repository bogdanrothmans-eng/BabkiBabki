import type { Metadata } from "next"

import { BudgetNameForm } from "@/components/budget-name-form"
import { ImportForm } from "@/components/import-form"
import { InvitePanel } from "@/components/invite-panel"
import { MemberAvatar } from "@/components/member-avatars"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { logout, switchBudget } from "@/lib/actions/auth"
import { removeMember } from "@/lib/actions/budget"
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
        <CardContent className="flex flex-col gap-4">
          <ul className="flex flex-col gap-3">
            {members.map((m) => (
              <li key={m.id} className="flex items-center gap-3">
                <MemberAvatar name={m.name} className="size-9 border-0" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {m.name} {m.id === user.id && <span className="text-muted-foreground">(вы)</span>}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">{m.email}</p>
                </div>
                {m.role === "owner" ? (
                  <Badge variant="secondary">владелец</Badge>
                ) : (
                  role === "owner" && (
                    <form action={removeMember.bind(null, m.id)}>
                      <Button type="submit" variant="ghost" size="sm">
                        Исключить
                      </Button>
                    </form>
                  )
                )}
              </li>
            ))}
          </ul>
          <InvitePanel invites={invites} />
        </CardContent>
      </Card>

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
