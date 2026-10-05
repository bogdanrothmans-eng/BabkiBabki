"use client"

import { CheckIcon, TriangleAlertIcon } from "lucide-react"
import { useMemo, useState, useTransition } from "react"
import { toast } from "sonner"

import { CategoryPicker } from "@/components/category-picker"
import { DateChip, PayerChip, useTodayYesterday } from "@/components/entry-chips"
import type { CategoryOption, MemberOption } from "@/components/transaction-form"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { type DraftEntry, saveEntries } from "@/lib/actions/transactions"
import { formatMoney } from "@/lib/money"
import { plural } from "@/lib/plural"
import { guessCategory, type HistoryItem, noteFrom, parseQuickList } from "@/lib/quick-entry"
import { normalize } from "@/lib/sheet-import"
import { cn } from "@/lib/utils"

// A whole week pasted from notes or dictated at once: one "такси 612" per line,
// categories guessed, each fixable before saving.
export function ListEntry({
  categories,
  members,
  currentUserId,
  history,
}: {
  categories: CategoryOption[]
  members: MemberOption[]
  currentUserId: string
  history: HistoryItem[]
}) {
  const { today } = useTodayYesterday()
  const [date, setDate] = useState(today)
  const [memberId, setMemberId] = useState(currentUserId)
  const [text, setText] = useState("")
  const [overrides, setOverrides] = useState<Record<number, string>>({})
  const [error, setError] = useState<string>()
  const [saved, setSaved] = useState({ count: 0, total: 0 })
  const [pending, startTransition] = useTransition()

  const rows = useMemo(
    () =>
      parseQuickList(text).map((r, i) => ({
        ...r,
        index: i,
        categoryId: overrides[i] ?? (r.entry ? guessCategory(r.entry.text, r.entry.kind, categories, history)?.id : undefined),
      })),
    [text, overrides, categories, history],
  )
  const ready = rows.filter((r) => r.entry)
  const missing = ready.filter((r) => !r.categoryId).length
  const total = ready.reduce((s, r) => s + (r.entry!.kind === "expense" ? r.entry!.amount : 0), 0)

  function save() {
    if (!ready.length) return setError("Напишите хотя бы одну строку с суммой")
    if (missing) return setError(`Выберите категорию для ${missing} ${plural(missing, ["строки", "строк", "строк"])}`)
    const entries: DraftEntry[] = ready.map((r) => ({
      kind: r.entry!.kind,
      amount: r.entry!.amount,
      categoryId: r.categoryId!,
      date,
      note: noteFrom(r.entry!.text),
      memberId,
    }))
    startTransition(async () => {
      const result = await saveEntries(entries)
      if (!result.ok) return setError(result.error)
      toast.success(`Добавлено ${result.count} ${plural(result.count, ["запись", "записи", "записей"])}`)
      setSaved((s) => ({ count: s.count + result.count, total: s.total + result.total }))
      setText("")
      setOverrides({})
      setError(undefined)
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <label htmlFor="quick-list" className="sr-only">
        Траты, по одной на строку
      </label>
      <textarea
        id="quick-list"
        value={text}
        onChange={(e) => {
          setText(e.target.value)
          setOverrides({})
          setError(undefined)
        }}
        rows={5}
        autoFocus
        placeholder={"пятёрочка 3845\nтакси 612\nкофе 350\n+120000 зарплата"}
        aria-describedby="list-hint"
        className="min-h-36 w-full resize-none rounded-3xl bg-secondary px-4 py-3 text-base outline-none placeholder:text-muted-foreground/70 focus-visible:ring-[3px] focus-visible:ring-ring/50"
      />
      <p id="list-hint" className="-mt-2 px-4 text-sm text-muted-foreground">
        По одной трате на строку — вставьте из заметок или надиктуйте. Категории подберутся сами.
      </p>

      <div className="flex flex-wrap justify-center gap-2">
        <DateChip date={date} onChange={setDate} prefix="Все за " />
        <PayerChip members={members} memberId={memberId} onChange={setMemberId} kind="expense" />
      </div>

      {rows.length > 0 && (
        <ul className="flex flex-col divide-y overflow-hidden rounded-3xl bg-secondary/60" aria-label="Что получилось">
          {rows.map((r) =>
            r.entry ? (
              <li key={r.index} className="flex min-h-14 items-center gap-2 px-3 py-1">
                <CategoryPicker
                  categories={categories}
                  kind={r.entry.kind}
                  value={r.categoryId}
                  onChange={(id) => setOverrides({ ...overrides, [r.index]: id })}
                  className="max-w-[55%] shrink"
                />
                <span className="min-w-0 flex-1 truncate text-sm text-muted-foreground">
                  {/* Skip the note when it just repeats the category ("такси" → Такси). */}
                  {normalize(r.entry.text) === normalize(categories.find((c) => c.id === r.categoryId)?.name ?? "")
                    ? ""
                    : noteFrom(r.entry.text)}
                </span>
                <span className={cn("tabular shrink-0 font-medium", r.entry.kind === "income" && "text-income")}>
                  {r.entry.kind === "income" ? "+" : ""}
                  {formatMoney(r.entry.amount)}
                </span>
              </li>
            ) : (
              <li key={r.index} className="flex min-h-12 items-center gap-2 px-4 text-sm text-warning">
                <TriangleAlertIcon className="size-4 shrink-0" aria-hidden />
                <span className="truncate">«{r.line}» — нет суммы, пропустим</span>
              </li>
            ),
          )}
        </ul>
      )}

      {error ? (
        <p role="alert" className="text-center text-sm text-destructive">
          {error}
        </p>
      ) : (
        saved.count > 0 && (
          <p aria-live="polite" className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground">
            <CheckIcon className="size-4 text-income" aria-hidden />
            Добавлено {saved.count} {plural(saved.count, ["запись", "записи", "записей"])}
            {saved.total > 0 && ` · ${formatMoney(saved.total)}`}
          </p>
        )
      )}
      <Button
        type="button"
        size="lg"
        className="h-12 rounded-full text-base font-semibold"
        disabled={pending || !ready.length}
        onClick={save}
      >
        {pending ? <Spinner /> : <CheckIcon className="size-5" aria-hidden />}
        {ready.length
          ? `Сохранить ${ready.length} ${plural(ready.length, ["запись", "записи", "записей"])} · ${formatMoney(total)}`
          : "Сохранить"}
      </Button>
    </div>
  )
}
