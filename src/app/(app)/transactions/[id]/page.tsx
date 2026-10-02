import { ArrowLeftIcon } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"

import { CommentThread } from "@/components/comment-thread"
import { MemberAvatar } from "@/components/member-avatars"
import { PhotoGallery } from "@/components/photo-gallery"
import { TransactionActions } from "@/components/transaction-actions"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { requireContext } from "@/lib/auth"
import { formatMoney } from "@/lib/money"
import { formatDay } from "@/lib/period"
import { getTransaction, listCategories } from "@/lib/queries"
import { cn } from "@/lib/utils"

export const metadata: Metadata = { title: "Запись" }

export default async function TransactionPage({ params }: PageProps<"/transactions/[id]">) {
  const { id } = await params
  const { user, budget, members } = await requireContext()
  const t = getTransaction(budget.id, id)
  if (!t) notFound()
  const categories = listCategories(budget.id)
  // Keep an archived category selectable while editing an old entry.
  if (!categories.some((c) => c.id === t.category_id)) {
    categories.push({ id: t.category_id, name: t.category_name, emoji: t.category_emoji, kind: t.kind, sort: 0, archived: 1, used: 0 })
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <Button asChild variant="ghost" size="sm" className="self-start">
        <Link href={`/transactions?p=${t.date.slice(0, 7)}`}>
          <ArrowLeftIcon />
          Все записи
        </Link>
      </Button>

      <section className="rounded-2xl border bg-card px-5 py-6 md:px-8">
        <div className="flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-full bg-muted text-2xl">{t.category_emoji}</span>
          <div className="min-w-0">
            <h1 className="truncate font-medium">{t.category_name}</h1>
            <p className="text-sm text-muted-foreground">
              {t.kind === "income" ? "Доход" : "Расход"} · {formatDay(t.date, true)}
            </p>
          </div>
        </div>
        <p className={cn("mt-5 text-5xl font-semibold tracking-tight", t.kind === "income" && "text-income")}>
          {t.kind === "income" ? "+" : ""}
          {formatMoney(t.amount)}
        </p>
        {t.note && <p className="mt-3 whitespace-pre-wrap">{t.note}</p>}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t pt-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {t.member_name && (
              <>
                <MemberAvatar name={t.member_name} className="size-6 border-0" />
                {t.kind === "income" ? "Получил(а)" : "Платил(а)"} {t.member_name}
              </>
            )}
            {t.source === "sheet" && <Badge variant="secondary">из таблицы</Badge>}
          </div>
          <TransactionActions
            draft={{
              id: t.id,
              kind: t.kind,
              amount: t.amount,
              categoryId: t.category_id,
              date: t.date,
              note: t.note,
              memberId: t.member_id,
            }}
            categories={categories}
            members={members.map((m) => ({ id: m.id, name: m.name }))}
            currentUserId={user.id}
          />
        </div>
      </section>

      <Card className="gap-4">
        <CardHeader>
          <CardTitle>Чеки и фото</CardTitle>
        </CardHeader>
        <CardContent>
          <PhotoGallery transactionId={t.id} attachments={t.attachments} />
        </CardContent>
      </Card>

      <Card className="gap-4">
        <CardHeader>
          <CardTitle>Комментарии</CardTitle>
        </CardHeader>
        <CardContent>
          <CommentThread transactionId={t.id} comments={t.comments} currentUserId={user.id} />
        </CardContent>
      </Card>
    </div>
  )
}
