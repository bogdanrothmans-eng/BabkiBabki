"use client"

import { ListPlusIcon, Table2Icon } from "lucide-react"
import Link from "next/link"

import { useAddTransaction } from "@/components/add-transaction"
import { useTodayYesterday } from "@/components/entry-chips"
import { Button } from "@/components/ui/button"
import { formatDay, parseIso } from "@/lib/period"
import { plural } from "@/lib/plural"

// People enter spending in sittings, once a week or a month. When the last
// sitting was a while ago, offer the two batch ways in.
export function CatchUpCard({
  coveredUntil,
  periodKey,
  always = false,
}: {
  coveredUntil: string | null
  periodKey: string
  always?: boolean
}) {
  const { today } = useTodayYesterday()
  const open = useAddTransaction()
  const days = coveredUntil ? Math.round((parseIso(today).getTime() - parseIso(coveredUntil).getTime()) / 86400000) : null
  if (!always && days !== null && days < 3) return null

  return (
    <section aria-labelledby="catch-up-title" className="flex flex-col gap-3 rounded-2xl border border-primary/40 bg-card p-4">
      <div>
        <h2 id="catch-up-title" className="font-semibold">
          {!coveredUntil
            ? "Пора внести траты"
            : days! < 3
              ? "За этот период трат пока нет"
              : `Траты внесены по ${formatDay(coveredUntil)} — ${days} ${plural(days!, ["день", "дня", "дней"])} назад`}
        </h2>
        <p className="text-sm text-muted-foreground">
          Внесите всё разом: списком из заметок или суммами по категориям
          {coveredUntil ? "." : (
            <>
              {" "}— или{" "}
              <Link href="/settings#import" className="text-foreground underline underline-offset-4">
                перенесите историю из Google Таблицы
              </Link>
              .
            </>
          )}
        </p>
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <Button variant="outline" onClick={() => open("list")}>
          <ListPlusIcon aria-hidden />
          Внести списком
        </Button>
        <Button asChild variant="outline">
          <Link href={`/batch?p=${periodKey}`}>
            <Table2Icon aria-hidden />
            Суммами за месяц
          </Link>
        </Button>
      </div>
    </section>
  )
}
