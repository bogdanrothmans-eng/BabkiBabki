import type { Metadata } from "next"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { acceptInvite } from "@/lib/actions/auth"
import { getUser } from "@/lib/auth"
import { db } from "@/lib/db"

export const metadata: Metadata = { title: "Приглашение" }

export default async function InvitePage({ params }: PageProps<"/invite/[token]">) {
  const { token } = await params
  const invite = db
    .prepare(
      `SELECT b.name AS budget, u.name AS inviter FROM invites i
       JOIN budgets b ON b.id = i.budget_id JOIN users u ON u.id = i.created_by
       WHERE i.token = ? AND i.used_at IS NULL AND i.expires_at > ?`,
    )
    .get(token, new Date().toISOString()) as { budget: string; inviter: string } | undefined

  if (!invite) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>
            <h1>Ссылка больше не работает</h1>
          </CardTitle>
          <CardDescription>Её уже использовали или прошло 7 дней. Попросите прислать новую.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline" className="w-full">
            <Link href="/">На главную</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  const user = await getUser()
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h1>
            {invite.inviter} зовёт вас в «{invite.budget}»
          </h1>
        </CardTitle>
        <CardDescription>
          Вы сможете вместе вносить траты, оставлять комментарии и прикладывать чеки.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {user ? (
          <form action={acceptInvite.bind(null, token)}>
            <Button type="submit" size="lg" className="w-full">
              Присоединиться как {user.name}
            </Button>
          </form>
        ) : (
          <>
            <Button asChild size="lg">
              <Link href={`/register?invite=${token}`}>Создать аккаунт и присоединиться</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href={`/login?invite=${token}`}>У меня уже есть аккаунт</Link>
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  )
}
