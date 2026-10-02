import { ImageIcon, MessageCircleIcon } from "lucide-react"
import Link from "next/link"

import { MemberAvatar } from "@/components/member-avatars"
import { formatMoney } from "@/lib/money"
import { relativeDayLabel } from "@/lib/period"
import type { TransactionRow } from "@/lib/queries"
import { cn } from "@/lib/utils"

export function TransactionList({ rows, showMembers }: { rows: TransactionRow[]; showMembers: boolean }) {
  const days = new Map<string, TransactionRow[]>()
  for (const r of rows) days.set(r.date, [...(days.get(r.date) ?? []), r])

  return (
    <div className="flex flex-col gap-5">
      {[...days].map(([date, items]) => {
        const spent = items.filter((i) => i.kind === "expense").reduce((s, i) => s + i.amount, 0)
        return (
          <section key={date}>
            <h3 className="mb-1 flex items-baseline justify-between px-1 text-xs font-medium text-muted-foreground">
              <span>{relativeDayLabel(date)}</span>
              {spent > 0 && <span className="tabular">{formatMoney(spent)}</span>}
            </h3>
            <ul className="divide-y rounded-xl border bg-card">
              {items.map((t) => (
                <li key={t.id}>
                  <Link
                    href={`/transactions/${t.id}`}
                    className="flex items-center gap-3 px-3 py-3 transition-colors hover:bg-accent/60 first:rounded-t-xl last:rounded-b-xl"
                  >
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-lg">
                      {t.category_emoji}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{t.category_name}</span>
                      <span className="flex items-center gap-2 text-xs text-muted-foreground">
                        {t.note && <span className="truncate">{t.note}</span>}
                        {t.comments > 0 && (
                          <span className="flex shrink-0 items-center gap-0.5" aria-label={`Комментариев: ${t.comments}`}>
                            <MessageCircleIcon className="size-3" />
                            {t.comments}
                          </span>
                        )}
                        {t.photos > 0 && (
                          <span className="flex shrink-0 items-center gap-0.5" aria-label={`Фото: ${t.photos}`}>
                            <ImageIcon className="size-3" />
                            {t.photos}
                          </span>
                        )}
                      </span>
                    </span>
                    {showMembers && t.member_name && <MemberAvatar name={t.member_name} className="size-6 border-0" />}
                    <span
                      className={cn(
                        "tabular shrink-0 text-right text-sm font-semibold",
                        t.kind === "income" && "text-income",
                      )}
                    >
                      {t.kind === "income" ? "+" : ""}
                      {formatMoney(t.amount)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )
      })}
    </div>
  )
}
