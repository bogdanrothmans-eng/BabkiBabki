"use client"

import { CheckIcon, FileTextIcon, Table2Icon } from "lucide-react"
import Link from "next/link"
import { useMemo, useRef, useState, useTransition } from "react"

import { CategoryIcon } from "@/components/category-icon"
import { CategoryPicker } from "@/components/category-picker"
import { DateChip, PayerChip, useTodayYesterday } from "@/components/entry-chips"
import type { CategoryOption, MemberOption } from "@/components/transaction-form"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { type DraftEntry, saveEntries } from "@/lib/actions/transactions"
import { formatMoney } from "@/lib/money"
import { plural } from "@/lib/plural"
import { guessCategory, type HistoryItem, noteFrom, parseQuickLine, parseQuickList } from "@/lib/quick-entry"
import { normalize } from "@/lib/sheet-import"
import { cn } from "@/lib/utils"

type Props = {
  categories: CategoryOption[]
  members: MemberOption[]
  currentUserId: string
  history: HistoryItem[]
  initialMode?: "line" | "list"
  onDetailed: () => void
  onDone: () => void
}

type Added = { key: string; text: string; amount: number; kind: "expense" | "income"; category?: CategoryOption }

function useGuess(categories: CategoryOption[], history: HistoryItem[]) {
  return (text: string, kind: "expense" | "income") => guessCategory(text, kind, categories, history)?.id
}

// The default way to add: type "350 кофе", press Enter, type the next one.
// "Списком" takes a whole week pasted from notes or dictated at once.
export function QuickAdd(props: Props) {
  const { today } = useTodayYesterday()
  const [mode, setMode] = useState<"line" | "list">(props.initialMode ?? "line")
  // Shared by both modes and kept between entries: a catch-up session for
  // last Saturday sets the date once.
  const [date, setDate] = useState(today)
  const [memberId, setMemberId] = useState(props.currentUserId)
  const [added, setAdded] = useState<Added[]>([])

  return (
    <div className="flex flex-col gap-4">
      <Tabs value={mode} onValueChange={(v) => setMode(v as typeof mode)}>
        <TabsList className="mx-auto w-full max-w-72">
          <TabsTrigger value="line">Строкой</TabsTrigger>
          <TabsTrigger value="list">Списком</TabsTrigger>
        </TabsList>
      </Tabs>

      {mode === "line" ? (
        <LineMode {...props} date={date} setDate={setDate} memberId={memberId} setMemberId={setMemberId} onAdded={(a) => setAdded([a, ...added])} />
      ) : (
        <ListMode {...props} date={date} setDate={setDate} memberId={memberId} setMemberId={setMemberId} onAdded={(a) => setAdded([...a, ...added])} />
      )}

      {added.length > 0 && (
        <section aria-labelledby="added-title" className="flex flex-col gap-1">
          <h3 id="added-title" className="text-sm text-muted-foreground">
            Добавлено сейчас: {added.length} · {formatMoney(added.reduce((s, a) => s + (a.kind === "expense" ? a.amount : 0), 0))}
          </h3>
          <ul className="flex flex-col">
            {added.slice(0, 4).map((a) => (
              <li key={a.key} className="flex min-h-10 items-center gap-2 text-sm">
                <CheckIcon className="size-4 text-income" aria-hidden />
                {a.category && <CategoryIcon icon={a.category.icon} color={a.category.color} size="sm" className="size-6 [&_svg]:size-3.5" />}
                <span className="min-w-0 flex-1 truncate">{a.text || a.category?.name}</span>
                <span className={cn("tabular", a.kind === "income" && "text-income")}>
                  {a.kind === "income" ? "+" : ""}
                  {formatMoney(a.amount)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-3">
        <div className="flex flex-col items-start">
          <Button type="button" variant="ghost" onClick={props.onDetailed} className="text-muted-foreground">
            <FileTextIcon aria-hidden />
            Форма с чеком и комментарием
          </Button>
          <Button asChild variant="ghost" className="text-muted-foreground">
            <Link href="/batch" onClick={props.onDone}>
              <Table2Icon aria-hidden />
              Суммами по категориям за месяц
            </Link>
          </Button>
        </div>
        {added.length > 0 && (
          <Button type="button" variant="outline" onClick={props.onDone}>
            Готово
          </Button>
        )}
      </div>
    </div>
  )
}

type ModeProps = Props & {
  date: string
  setDate: (d: string) => void
  memberId: string
  setMemberId: (id: string) => void
}

function LineMode({ categories, members, history, date, setDate, memberId, setMemberId, onAdded }: ModeProps & { onAdded: (a: Added) => void }) {
  const [text, setText] = useState("")
  const [override, setOverride] = useState<string>()
  const [error, setError] = useState<string>()
  const [pending, startTransition] = useTransition()
  const input = useRef<HTMLInputElement>(null)
  const guess = useGuess(categories, history)

  const parsed = parseQuickLine(text)
  const kind = parsed?.kind ?? "expense"
  const categoryId = override ?? (parsed ? guess(parsed.text, kind) : undefined)
  const category = categories.find((c) => c.id === categoryId)

  function submit() {
    if (!parsed) return setError(text.trim() ? "Добавьте сумму — например «кофе 350»" : "Напишите, что и сколько")
    if (!category) return setError("Выберите категорию")
    const entry: DraftEntry = { kind, amount: parsed.amount, categoryId: category.id, date, note: noteFrom(parsed.text), memberId }
    startTransition(async () => {
      const result = await saveEntries([entry])
      if (!result.ok) return setError(result.error)
      onAdded({ key: crypto.randomUUID(), text: entry.note, amount: entry.amount, kind, category })
      setText("")
      setOverride(undefined)
      setError(undefined)
      input.current?.focus()
    })
  }

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault()
        submit()
      }}
    >
      <label htmlFor="quick-line" className="text-sm font-medium">
        Что и сколько
      </label>
      <input
        ref={input}
        id="quick-line"
        value={text}
        onChange={(e) => {
          setText(e.target.value)
          setOverride(undefined)
          setError(undefined)
        }}
        autoFocus
        autoComplete="off"
        enterKeyHint="send"
        placeholder="350 кофе"
        aria-invalid={!!error}
        aria-describedby={error ? "quick-error" : "quick-hint"}
        className="h-14 w-full rounded-xl border border-input bg-transparent px-4 text-xl outline-none placeholder:text-muted-foreground/60 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive"
      />
      {error ? (
        <p id="quick-error" role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : (
        <p id="quick-hint" className="text-sm text-muted-foreground">
          «пятёрочка 3845+1200», «такси 612», «+120000 зарплата»
        </p>
      )}

      {/* Live preview: what will be saved, with the guessed category one tap from changing. */}
      <div className="flex min-h-16 items-center gap-2 rounded-xl bg-card px-2 py-2" aria-live="polite">
        {parsed ? (
          <>
            <CategoryPicker
              categories={categories}
              kind={kind}
              value={categoryId}
              onChange={(id) => {
                setOverride(id)
                setError(undefined)
              }}
              className="flex-1"
            />
            <span className={cn("tabular shrink-0 pr-2 text-xl font-semibold", kind === "income" && "text-income")}>
              {kind === "income" ? "+" : ""}
              {formatMoney(parsed.amount)}
            </span>
          </>
        ) : (
          <span className="px-2 text-sm text-muted-foreground">Здесь появится категория и сумма</span>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <DateChip date={date} onChange={setDate} />
        <PayerChip members={members} memberId={memberId} onChange={setMemberId} kind={kind} />
      </div>

      <Button type="submit" size="lg" className="h-12 text-base md:h-11" disabled={pending}>
        {pending && <Spinner />}
        {parsed ? `Добавить ${formatMoney(parsed.amount)}` : "Добавить"}
      </Button>
    </form>
  )
}

function ListMode({ categories, members, history, date, setDate, memberId, setMemberId, onAdded }: ModeProps & { onAdded: (a: Added[]) => void }) {
  const [text, setText] = useState("")
  const [overrides, setOverrides] = useState<Record<number, string>>({})
  const [error, setError] = useState<string>()
  const [pending, startTransition] = useTransition()
  const guess = useGuess(categories, history)

  const rows = useMemo(
    () =>
      parseQuickList(text).map((r, i) => ({
        ...r,
        index: i,
        categoryId: overrides[i] ?? (r.entry ? guess(r.entry.text, r.entry.kind) : undefined),
      })),
    [text, overrides], // eslint-disable-line react-hooks/exhaustive-deps
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
      onAdded(
        entries.map((e) => ({
          key: crypto.randomUUID(),
          text: e.note,
          amount: e.amount,
          kind: e.kind,
          category: categories.find((c) => c.id === e.categoryId),
        })),
      )
      setText("")
      setOverrides({})
      setError(undefined)
    })
  }

  return (
    <div className="flex flex-col gap-3">
      <label htmlFor="quick-list" className="text-sm font-medium">
        Траты, по одной на строку
      </label>
      <Textarea
        id="quick-list"
        value={text}
        onChange={(e) => {
          setText(e.target.value)
          setOverrides({})
          setError(undefined)
        }}
        rows={5}
        autoFocus
        placeholder={"пятёрочка 3845\nтакси 612\nкофе 350"}
        aria-describedby="list-hint"
        className="text-base"
      />
      <p id="list-hint" className="text-sm text-muted-foreground">
        Вставьте из заметок или надиктуйте с клавиатуры телефона. Категории подберутся сами.
      </p>

      <div className="flex flex-wrap gap-2">
        <DateChip date={date} onChange={setDate} prefix="Все за " />
        <PayerChip members={members} memberId={memberId} onChange={setMemberId} kind="expense" />
      </div>

      {rows.length > 0 && (
        <ul className="divide-y rounded-xl bg-card" aria-label="Что получилось">
          {rows.map((r) =>
            r.entry ? (
              <li key={r.index} className="flex min-h-14 items-center gap-2 px-2 py-1">
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
                <span className={cn("tabular shrink-0 pr-1 font-medium", r.entry.kind === "income" && "text-income")}>
                  {r.entry.kind === "income" ? "+" : ""}
                  {formatMoney(r.entry.amount)}
                </span>
              </li>
            ) : (
              <li key={r.index} className="flex min-h-11 items-center gap-2 px-3 text-sm text-warning">
                <span className="truncate">«{r.line}» — нет суммы, пропустим</span>
              </li>
            ),
          )}
        </ul>
      )}

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <Button type="button" size="lg" className="h-12 text-base md:h-11" disabled={pending || !ready.length} onClick={save}>
        {pending && <Spinner />}
        {ready.length
          ? `Сохранить ${ready.length} ${plural(ready.length, ["запись", "записи", "записей"])} · ${formatMoney(total)}`
          : "Сохранить"}
      </Button>
    </div>
  )
}
