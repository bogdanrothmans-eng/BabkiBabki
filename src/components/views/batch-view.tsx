"use client"

import { useRouter } from "next/navigation"
import { useRef, useState, useTransition } from "react"
import { toast } from "sonner"

import { BackButton } from "@/components/back-button"
import { CategoryIcon } from "@/components/category-icon"
import { PayerChip, useTodayYesterday } from "@/components/entry-chips"
import { PeriodPicker } from "@/components/period-picker"
import type { CategoryOption, MemberOption } from "@/components/transaction-form"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { type DraftEntry, saveEntries } from "@/lib/actions/transactions"
import { formatMoney } from "@/lib/money"
import { formatDay, type Period, periodLabel, periodPreposition } from "@/lib/period"
import { plural } from "@/lib/plural"
import { evalAmount } from "@/lib/quick-entry"
import type { Breakdown } from "@/lib/queries"

// The couple's spreadsheet column, as a form: one amount per category for a
// month, summed on the fly ("3845+1200"). For people who sit down once a month.
export function BatchView({
  period,
  categories,
  existing,
  members,
  currentUserId,
}: {
  period: Period
  categories: CategoryOption[]
  existing: Breakdown[]
  members: MemberOption[]
  currentUserId: string
}) {
  const { today } = useTodayYesterday()
  const [values, setValues] = useState<Record<string, string>>({})
  const [memberId, setMemberId] = useState(currentUserId)
  const [error, setError] = useState<string>()
  const [pending, startTransition] = useTransition()
  const inputs = useRef<(HTMLInputElement | null)[]>([])
  const router = useRouter()

  const rows = categories.filter((c) => c.kind === "expense")
  const already = new Map(existing.map((e) => [e.category_id, e.total]))
  const parsed = rows.map((c) => ({ c, raw: values[c.id] ?? "", amount: evalAmount((values[c.id] ?? "").trim()) }))
  const filled = parsed.filter((p) => p.amount)
  const invalid = parsed.filter((p) => p.raw.trim() && !p.amount)
  const total = filled.reduce((s, p) => s + p.amount!, 0)
  // Entries land on the last day of the period, or today for the current one.
  const date = period.to < today ? period.to : today
  const note = period.kind === "month" ? `За ${periodLabel(period).split(" ")[0].toLowerCase()}` : "За период"

  function save() {
    if (invalid.length) {
      setError("Проверьте суммы, отмеченные красным")
      inputs.current[parsed.indexOf(invalid[0])]?.focus()
      return
    }
    if (!filled.length) return setError("Впишите хотя бы одну сумму")
    const entries: DraftEntry[] = filled.map((p) => ({
      kind: "expense",
      amount: p.amount!,
      categoryId: p.c.id,
      date,
      note,
      memberId,
    }))
    startTransition(async () => {
      const result = await saveEntries(entries)
      if (!result.ok) return setError(result.error)
      toast.success(`Сохранили ${result.count} ${plural(result.count, ["сумму", "суммы", "сумм"])} на ${formatMoney(result.total)}`)
      setValues({})
      router.push(`/?p=${period.key}`)
    })
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <BackButton href="/" label="Назад" />
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-xl font-semibold">Суммы по категориям</h1>
        <p className="max-w-md text-sm text-muted-foreground">
          Как колонка месяца в вашей таблице: впишите, сколько ушло на каждую категорию {periodPreposition(period)}.
          Можно складывать: 3845+1200.
        </p>
        <PeriodPicker period={period} />
        <PayerChip members={members} memberId={memberId} onChange={setMemberId} kind="expense" />
      </div>

      <ul className="divide-y overflow-hidden rounded-xl bg-card">
        {parsed.map((p, i) => {
          const bad = p.raw.trim() !== "" && !p.amount
          const sum = p.raw.includes("+") && p.amount ? formatMoney(p.amount) : null
          return (
            <li key={p.c.id} className="flex min-h-16 items-center gap-3 px-3 py-2">
              <CategoryIcon icon={p.c.icon} color={p.c.color} size="sm" />
              <label htmlFor={`sum-${p.c.id}`} className="min-w-0 flex-1">
                <span className="line-clamp-2 text-base leading-snug md:text-sm">{p.c.name}</span>
                {already.get(p.c.id) ? (
                  <span className="text-sm text-muted-foreground md:text-xs">уже есть {formatMoney(already.get(p.c.id)!)}</span>
                ) : null}
              </label>
              <span className="flex w-28 shrink-0 flex-col items-end">
                <input
                  ref={(el) => {
                    inputs.current[i] = el
                  }}
                  id={`sum-${p.c.id}`}
                  value={p.raw}
                  onChange={(e) => {
                    setValues({ ...values, [p.c.id]: e.target.value })
                    setError(undefined)
                  }}
                  onKeyDown={(e) => {
                    if (e.key !== "Enter") return
                    e.preventDefault()
                    inputs.current[i + 1]?.focus()
                  }}
                  inputMode="decimal"
                  enterKeyHint="next"
                  autoComplete="off"
                  placeholder="0"
                  aria-invalid={bad}
                  aria-describedby={sum ? `sum-${p.c.id}-total` : undefined}
                  className="tabular h-11 w-full rounded-lg border border-input bg-transparent px-3 text-right text-base outline-none placeholder:text-muted-foreground/60 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive md:h-9 md:text-sm"
                />
                {sum && (
                  <span id={`sum-${p.c.id}-total`} className="mt-0.5 text-xs text-muted-foreground">
                    = {sum}
                  </span>
                )}
              </span>
            </li>
          )
        })}
      </ul>

      <div className="sticky bottom-[calc(4.5rem+env(safe-area-inset-bottom))] flex flex-col gap-2 rounded-xl border bg-popover p-3 md:bottom-4">
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <Button size="lg" className="h-12 text-base md:h-11" disabled={pending} onClick={save}>
          {pending && <Spinner />}
          {filled.length
            ? `Сохранить ${filled.length} ${plural(filled.length, ["сумму", "суммы", "сумм"])} · ${formatMoney(total)}`
            : "Сохранить"}
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          Одна запись на категорию, датой {formatDay(date, true)}
        </p>
      </div>
    </div>
  )
}
