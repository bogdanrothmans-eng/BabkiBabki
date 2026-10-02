import { CalendarIcon, FileSpreadsheetIcon, MessageSquareTextIcon, UserIcon } from "lucide-react"

import { BackButton } from "@/components/back-button"
import { CategoryIcon } from "@/components/category-icon"
import { CommentThread } from "@/components/comment-thread"
import { MemberAvatar } from "@/components/member-avatars"
import { PhotoGallery } from "@/components/photo-gallery"
import { TransactionActions } from "@/components/transaction-actions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatMoney } from "@/lib/money"
import { formatDay } from "@/lib/period"
import type { Category, Entry } from "@/lib/queries"
import { cn } from "@/lib/utils"

function Row({ icon: Icon, label, children }: { icon: typeof CalendarIcon; label: string; children: React.ReactNode }) {
  return (
    <div className="flex min-h-14 items-center gap-3 px-4 py-3">
      <Icon className="size-5 shrink-0 text-muted-foreground" aria-hidden />
      <dt className="w-28 shrink-0 text-sm text-muted-foreground">{label}</dt>
      <dd className="min-w-0 flex-1 text-right text-base break-words md:text-sm">{children}</dd>
    </div>
  )
}

// Layout follows Origin / Rocket Money: amount and category up top,
// details as labelled rows, receipts and the conversation below.
export function EntryView({
  entry: t,
  categories: active,
  members,
  currentUserId,
}: {
  entry: Entry
  categories: Category[]
  members: { id: string; name: string }[]
  currentUserId: string
}) {
  // Keep an archived category selectable while editing an old entry.
  const categories = active.some((c) => c.id === t.category_id)
    ? active
    : [
        ...active,
        {
          id: t.category_id,
          name: t.category_name,
          icon: t.category_icon,
          color: t.category_color,
          kind: t.kind,
          sort: 0,
          archived: 1,
          used: 0,
        },
      ]

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <BackButton href={`/transactions?p=${t.date.slice(0, 7)}`} label="Назад" />

      <section aria-labelledby="entry-title" className="flex flex-col items-center gap-3 pt-2 pb-2 text-center">
        <CategoryIcon icon={t.category_icon} color={t.category_color} size="lg" />
        <h1 id="entry-title" className="text-base font-medium">
          {t.category_name}
          <span className="sr-only">, {t.kind === "income" ? "доход" : "расход"}</span>
        </h1>
        <p className={cn("text-5xl font-semibold tracking-tight", t.kind === "income" && "text-income")}>
          {t.kind === "income" ? "+" : ""}
          {formatMoney(t.amount)}
        </p>
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
          members={members}
          currentUserId={currentUserId}
        />
      </section>

      <Card className="py-0">
        <dl className="divide-y">
          <Row icon={CalendarIcon} label="Дата">
            {formatDay(t.date, true)}
          </Row>
          <Row icon={UserIcon} label={t.kind === "income" ? "Получил(а)" : "Платил(а)"}>
            {t.member_name ? (
              <span className="inline-flex items-center gap-2">
                <MemberAvatar name={t.member_name} className="size-6 border-0" />
                {t.member_name}
              </span>
            ) : (
              <span className="text-muted-foreground">—</span>
            )}
          </Row>
          <Row icon={MessageSquareTextIcon} label="Описание">
            {t.note || <span className="text-muted-foreground">нет</span>}
          </Row>
          {t.source === "sheet" && (
            <Row icon={FileSpreadsheetIcon} label="Источник">
              Импорт из таблицы
            </Row>
          )}
        </dl>
      </Card>

      <Card className="gap-4">
        <CardHeader>
          <CardTitle>
            <h2>Чеки и фото</h2>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <PhotoGallery transactionId={t.id} attachments={t.attachments} />
        </CardContent>
      </Card>

      <Card className="gap-4">
        <CardHeader>
          <CardTitle>
            <h2>Комментарии</h2>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CommentThread transactionId={t.id} comments={t.comments} currentUserId={currentUserId} />
        </CardContent>
      </Card>
    </div>
  )
}
