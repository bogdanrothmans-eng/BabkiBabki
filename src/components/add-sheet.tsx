"use client"

import {
  ArrowDownLeftIcon,
  ArrowUpRightIcon,
  CameraIcon,
  CheckIcon,
  ChevronLeftIcon,
  DeleteIcon,
  EllipsisIcon,
  EqualIcon,
  ListIcon,
  MinusIcon,
  PencilLineIcon,
  PlusIcon,
  Settings2Icon,
  Table2Icon,
  XIcon,
} from "lucide-react"
import { ToggleGroup as ToggleGroupPrimitive } from "radix-ui"
import Link from "next/link"
import { useEffect, useMemo, useRef, useState, useTransition } from "react"

import { CategoryIcon } from "@/components/category-icon"
import { CHIP, DateChip, PayerChip, useTodayYesterday } from "@/components/entry-chips"
import { ListEntry } from "@/components/list-entry"
import { type CategoryOption, type MemberOption, PhotoPreview } from "@/components/transaction-form"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Spinner } from "@/components/ui/spinner"
import { useIsMobile } from "@/hooks/use-mobile"
import { saveTransaction } from "@/lib/actions/transactions"
import {
  expressionTotal,
  formatExpression,
  type Key,
  pressKey,
  sanitizeExpression,
} from "@/lib/amount-keypad"
import { compressImage } from "@/lib/compress-image"
import { formatMoney, toInputValue } from "@/lib/money"
import { guessCategory, type HistoryItem } from "@/lib/quick-entry"
import { cn } from "@/lib/utils"

type Kind = "expense" | "income"
export type AddView = "amount" | "list"

type Props = {
  categories: CategoryOption[]
  members: MemberOption[]
  currentUserId: string
  history: HistoryItem[]
  initialView?: AddView
  onClose: () => void
}

const ROW_SIZE = 7
// Header and bottom bar stay put; the middle scrolls on short phones.
const SCREEN = "flex min-h-0 flex-1 flex-col gap-3"
const SCROLL =
  "-mx-4 flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-4 pt-1 pb-2 [mask-image:linear-gradient(to_bottom,black_calc(100%-12px),transparent)]"
const ROUND = "rounded-full md:size-11"
const TILE =
  "group flex w-full flex-col items-center gap-1 rounded-3xl py-1 text-center text-xs leading-4 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"

// The add sheet: kind, amount, category — then "Добавить". Date, payer and
// receipt sit as chips; list entry and monthly sums live behind "⋯".
// Stays open after saving: people catch up on a week's spending at once.
export function AddSheet({ categories, members, currentUserId, history, initialView = "amount", onClose }: Props) {
  const { today } = useTodayYesterday()
  const isMobile = useIsMobile()
  const [view, setView] = useState<AddView | "categories">(initialView)
  const [kind, setKind] = useState<Kind>("expense")
  const [raw, setRaw] = useState("")
  const [note, setNote] = useState("")
  const [picked, setPicked] = useState<string>()
  const [date, setDate] = useState(today)
  const [memberId, setMemberId] = useState(currentUserId)
  const [photos, setPhotos] = useState<{ file: File; url: string }[]>([])
  const [errors, setErrors] = useState<{ amount?: string; category?: string; server?: string }>({})
  // A toast would cover the sheet's header, so the button itself confirms:
  // "Добавлено · 3-я запись" for a moment, then back to "Добавить".
  const [added, setAdded] = useState(0)
  const [flash, setFlash] = useState<string>()
  const [pending, startTransition] = useTransition()
  const [preparing, setPreparing] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)
  const amountInput = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!flash) return
    const timer = setTimeout(() => setFlash(undefined), 1600)
    return () => clearTimeout(timer)
  }, [flash])

  const ofKind = useMemo(() => categories.filter((c) => c.kind === kind).sort((a, b) => b.used - a.used), [categories, kind])
  const guessed = note.trim() ? guessCategory(note, kind, categories, history)?.id : undefined
  const categoryId = picked ?? guessed
  const category = ofKind.find((c) => c.id === categoryId)
  const total = expressionTotal(raw)
  const busy = pending || preparing

  function changeKind(next: Kind) {
    setKind(next)
    setPicked(undefined)
    setErrors({})
  }

  function changeAmount(next: string) {
    setRaw(next)
    if (errors.amount || errors.server) setErrors({ ...errors, amount: undefined, server: undefined })
  }

  function pick(id: string) {
    setPicked(id)
    setErrors({ ...errors, category: undefined, server: undefined })
    setView("amount")
  }

  async function save() {
    const next: typeof errors = {}
    if (!total) next.amount = "Введите сумму"
    if (!category) next.category = "Выберите категорию"
    setErrors(next)
    if (!total || !category) {
      if (!total && !isMobile) amountInput.current?.focus()
      return
    }

    const form = new FormData()
    form.set("kind", kind)
    form.set("amount", toInputValue(total))
    form.set("categoryId", category.id)
    form.set("date", date)
    form.set("note", note.trim())
    form.set("memberId", memberId)
    setPreparing(true)
    for (const { file } of photos) form.append("photos", await compressImage(file))
    setPreparing(false)

    startTransition(async () => {
      const result = await saveTransaction(undefined, form)
      if (!result?.ok) return setErrors({ server: result?.error ?? "Не получилось сохранить" })
      const count = added + 1
      setAdded(count)
      setFlash(count > 1 ? `Добавлено · ${count}-я запись` : `Добавлено: ${category.name}`)
      photos.forEach((p) => URL.revokeObjectURL(p.url))
      setPhotos([])
      setRaw("")
      setNote("")
      setPicked(undefined)
      if (!isMobile) amountInput.current?.focus()
    })
  }

  if (view === "list") {
    return (
      <div className={SCREEN}>
        <SheetHeader title="Списком" onBack={initialView === "list" ? undefined : () => setView("amount")} onClose={onClose} />
        <div className={SCROLL}>
          <ListEntry categories={categories} members={members} currentUserId={currentUserId} history={history} />
        </div>
      </div>
    )
  }

  if (view === "categories") {
    return (
      <div className={SCREEN}>
        <SheetHeader title={kind === "expense" ? "Категория расхода" : "Категория дохода"} onBack={() => setView("amount")} onClose={onClose} />
        <div className={SCROLL}>
          <ul className="grid grid-cols-4 gap-x-2 gap-y-4 pb-2" aria-label="Все категории">
            {ofKind.map((c) => (
              <li key={c.id}>
                <CategoryTile category={c} selected={c.id === categoryId} onClick={() => pick(c.id)} />
              </li>
            ))}
            <li>
              <Link href="/categories" onClick={onClose} className={TILE}>
                <span className="flex size-12 items-center justify-center rounded-full border border-dashed border-input transition-transform group-active:scale-95">
                  <Settings2Icon className="size-5" aria-hidden />
                </span>
                <span className="line-clamp-2 h-8 text-muted-foreground">Настроить</span>
              </Link>
            </li>
          </ul>
        </div>
      </div>
    )
  }

  // Keep the chosen category in the quick row even if it is a rare one.
  const top = ofKind.slice(0, ROW_SIZE)
  const row = category && !top.includes(category) ? [category, ...top.slice(0, ROW_SIZE - 1)] : top
  const shown = formatExpression(raw)

  return (
    <form
      noValidate
      className={SCREEN}
      onSubmit={(e) => {
        e.preventDefault()
        save()
      }}
    >
      <div className="grid grid-cols-[44px_1fr_44px] items-center gap-2">
        <Button type="button" variant="secondary" size="icon" className={ROUND} aria-label="Закрыть" onClick={onClose}>
          <XIcon className="size-5" aria-hidden />
        </Button>
        <KindSwitch value={kind} onChange={changeKind} />
        <MoreMenu onList={() => setView("list")} onClose={onClose} />
      </div>

      <div className={SCROLL}>
        {/* Amount. The invisible twin sizes the input to its text, so "₽" hugs the number. */}
        <div className="flex flex-col items-center [@media(max-height:700px)]:-mb-1">
          <div className={cn("flex max-w-full items-baseline justify-center gap-1 font-semibold tracking-tight", amountSize(shown))}>
            {kind === "income" && (
              <span className="text-[0.7em] text-income" aria-hidden>
                +
              </span>
            )}
            <span className="inline-grid min-w-0">
              <span aria-hidden className="tabular invisible col-start-1 row-start-1 whitespace-pre">
                {shown || "0"}
              </span>
              <input
                ref={amountInput}
                size={1}
                value={shown}
                onChange={(e) => changeAmount(sanitizeExpression(e.target.value))}
                readOnly={isMobile}
                autoFocus={!isMobile}
                inputMode="decimal"
                enterKeyHint="done"
                autoComplete="off"
                placeholder="0"
                aria-label={kind === "expense" ? "Сумма расхода" : "Сумма дохода"}
                aria-invalid={!!errors.amount}
                aria-describedby={errors.amount ? "amount-error" : undefined}
                className={cn(
                  "tabular col-start-1 row-start-1 w-full min-w-0 bg-transparent text-center caret-primary outline-none placeholder:text-muted-foreground/40 read-only:cursor-default",
                  kind === "income" && "text-income",
                )}
              />
            </span>
            <span className="text-[0.55em] font-medium text-muted-foreground" aria-hidden>
              ₽
            </span>
          </div>
          {errors.amount ? (
            <p id="amount-error" role="alert" className="flex h-11 items-center text-sm text-destructive md:h-9">
              {errors.amount}
            </p>
          ) : (
            <label className="flex h-11 max-w-full items-center gap-2 rounded-full px-4 md:h-9 text-muted-foreground transition-colors focus-within:bg-secondary hover:bg-secondary/60">
              <PencilLineIcon className="size-4 shrink-0" aria-hidden />
              <span className="sr-only">Комментарий</span>
              <input
                value={note}
                onChange={(e) => {
                  setNote(e.target.value)
                  if (errors.category) setErrors({ ...errors, category: undefined })
                }}
                maxLength={500}
                enterKeyHint="done"
                autoComplete="off"
                placeholder="Комментарий"
                size={Math.max(note.length, 11) + 1}
                className="min-w-0 bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground md:text-sm"
              />
            </label>
          )}
        </div>

        {/* Categories: the most used one tap away, the rest behind "Все". */}
        <div className="flex flex-col gap-1">
          <ul
            aria-label="Категория"
            aria-describedby={errors.category ? "category-error" : undefined}
            className="relative -mx-4 flex snap-x scroll-px-4 overflow-x-auto px-3 py-1 [scrollbar-width:none] md:mx-0 md:grid md:grid-cols-4 md:gap-y-3 md:overflow-visible md:px-0"
          >
            {row.map((c) => (
              <li key={c.id} className="w-[76px] shrink-0 snap-start md:w-auto">
                <CategoryTile category={c} selected={c.id === categoryId} onClick={() => pick(c.id)} />
              </li>
            ))}
            <li className="w-[76px] shrink-0 snap-start md:w-auto">
              <button type="button" onClick={() => setView("categories")} className={TILE}>
                <span className="flex size-12 items-center justify-center rounded-full bg-secondary transition-transform group-active:scale-95">
                  <EllipsisIcon className="size-5" aria-hidden />
                </span>
                <span className="line-clamp-2 h-8 text-muted-foreground">Все</span>
              </button>
            </li>
          </ul>
          {errors.category && (
            <p id="category-error" role="alert" className="text-center text-sm text-destructive">
              {errors.category}
            </p>
          )}
        </div>

        {/* Optional details fold into one row of chips; the comment sits under the amount. */}
        <div className="flex flex-wrap justify-center gap-2">
          <DateChip date={date} onChange={setDate} />
          <PayerChip members={members} memberId={memberId} onChange={setMemberId} kind={kind} />
          <Button
            type="button"
            variant="secondary"
            size={photos.length ? "default" : "icon"}
            className={cn(CHIP, !photos.length && "w-11 px-0 md:w-10")}
            aria-label={photos.length ? undefined : "Фото чека"}
            onClick={() => fileInput.current?.click()}
          >
            <CameraIcon aria-hidden />
            {photos.length > 0 && `Чек · ${photos.length}`}
          </Button>
        </div>

        {photos.length > 0 && (
          <div className="flex flex-wrap justify-center gap-3">
            {photos.map((p) => (
              <PhotoPreview
                key={p.url}
                file={p.file}
                url={p.url}
                onRemove={() => {
                  URL.revokeObjectURL(p.url)
                  setPhotos(photos.filter((x) => x !== p))
                }}
              />
            ))}
          </div>
        )}
        <input
          ref={fileInput}
          type="file"
          accept="image/*,application/pdf"
          multiple
          hidden
          onChange={(e) => {
            const files = Array.from(e.target.files ?? []).map((file) => ({ file, url: URL.createObjectURL(file) }))
            setPhotos([...photos, ...files])
            e.target.value = ""
          }}
        />
      </div>

      {/* Pinned to the bottom: the keypad and the one primary action. */}
      <div className="flex flex-col gap-3">
        {isMobile && <Keypad onKey={(key) => changeAmount(pressKey(raw, key))} />}
        {errors.server && !busy && (
          <p role="alert" className="text-center text-sm text-destructive">
            {errors.server}
          </p>
        )}
        <p className="sr-only" aria-live="polite">
          {flash}
        </p>
        <Button
          type="submit"
          size="lg"
          className={cn(
            "h-12 rounded-full text-base font-semibold transition-colors duration-200 [@media(max-height:700px)]:h-11",
            flash && !raw && "bg-income text-background hover:bg-income",
          )}
          disabled={busy}
        >
          {busy ? <Spinner /> : <CheckIcon className="size-5" aria-hidden />}
          {busy ? "Сохраняем…" : flash && !raw ? flash : `Добавить${total ? ` ${formatMoney(total)}` : ""}`}
        </Button>
      </div>
    </form>
  )
}

// Long sums shrink so "125 000 + 3 845" still fits on a 375px phone.
function amountSize(shown: string) {
  const length = shown.length
  if (length <= 7) return "text-[56px] leading-[56px] [@media(max-height:700px)]:text-[48px] [@media(max-height:700px)]:leading-[48px]"
  if (length <= 11) return "text-[44px] leading-[56px]"
  if (length <= 15) return "text-[36px] leading-[56px]"
  return "text-[28px] leading-[56px]"
}

function SheetHeader({ title, onBack, onClose }: { title: string; onBack?: () => void; onClose: () => void }) {
  return (
    <div className="grid grid-cols-[44px_1fr_44px] items-center gap-2">
      {onBack ? (
        <Button type="button" variant="secondary" size="icon" className={ROUND} aria-label="Назад" onClick={onBack}>
          <ChevronLeftIcon className="size-5" aria-hidden />
        </Button>
      ) : (
        <span />
      )}
      <h2 className="text-center text-base font-semibold">{title}</h2>
      <Button type="button" variant="secondary" size="icon" className={ROUND} aria-label="Закрыть" onClick={onClose}>
        <XIcon className="size-5" aria-hidden />
      </Button>
    </div>
  )
}

// iOS segmented control; radio semantics come from Radix ToggleGroup.
function KindSwitch({ value, onChange }: { value: Kind; onChange: (kind: Kind) => void }) {
  const item =
    "flex items-center justify-center gap-1.5 rounded-full text-sm font-medium text-muted-foreground outline-none transition-colors duration-200 focus-visible:ring-[3px] focus-visible:ring-ring/50 data-[state=on]:bg-foreground data-[state=on]:text-background [&_svg]:size-4"
  return (
    <ToggleGroupPrimitive.Root
      type="single"
      value={value}
      onValueChange={(v) => v && onChange(v as Kind)}
      aria-label="Тип записи"
      className="mx-auto grid h-11 w-full max-w-60 grid-cols-2 rounded-full bg-secondary p-1"
    >
      <ToggleGroupPrimitive.Item value="expense" className={item}>
        <ArrowUpRightIcon aria-hidden />
        Расход
      </ToggleGroupPrimitive.Item>
      <ToggleGroupPrimitive.Item value="income" className={item}>
        <ArrowDownLeftIcon aria-hidden />
        Доход
      </ToggleGroupPrimitive.Item>
    </ToggleGroupPrimitive.Root>
  )
}

function MoreMenu({ onList, onClose }: { onList: () => void; onClose: () => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="secondary" size="icon" className={ROUND} aria-label="Другие способы ввода">
          <EllipsisIcon className="size-5" aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 rounded-3xl p-2">
        <DropdownMenuItem className="min-h-11 rounded-2xl px-3" onSelect={onList}>
          <ListIcon aria-hidden />
          Несколько трат списком
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="min-h-11 rounded-2xl px-3">
          <Link href="/batch" onClick={onClose}>
            <Table2Icon aria-hidden />
            Суммы по категориям за месяц
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function CategoryTile({ category, selected, onClick }: { category: CategoryOption; selected: boolean; onClick: () => void }) {
  const ref = useRef<HTMLButtonElement>(null)
  // A guessed or picked category scrolls into view in the horizontal row.
  // Only the row scrolls sideways — scrollIntoView would also move the sheet.
  useEffect(() => {
    const el = ref.current
    const row = el?.closest("ul")
    if (!selected || !el || !row || row.scrollWidth <= row.clientWidth) return
    row.scrollTo({ left: el.offsetLeft - (row.clientWidth - el.offsetWidth) / 2, behavior: "smooth" })
  }, [selected])
  return (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={TILE}
    >
      <span
        className={cn(
          "rounded-full ring-offset-2 ring-offset-card transition-[transform,box-shadow] duration-150 group-active:scale-95",
          selected && "ring-2 ring-primary",
        )}
      >
        <CategoryIcon icon={category.icon} color={category.color} className="size-12 rounded-full [&_svg]:size-6" />
      </span>
      <span className={cn("line-clamp-2 h-8 break-words", selected ? "font-medium text-foreground" : "text-muted-foreground")}>
        {category.name}
      </span>
    </button>
  )
}

const KEYS: { key: Key; label: React.ReactNode; name?: string; op?: boolean }[] = [
  { key: "1", label: "1" },
  { key: "2", label: "2" },
  { key: "3", label: "3" },
  { key: "back", label: <DeleteIcon aria-hidden />, name: "Стереть", op: true },
  { key: "4", label: "4" },
  { key: "5", label: "5" },
  { key: "6", label: "6" },
  { key: "+", label: <PlusIcon aria-hidden />, name: "Плюс", op: true },
  { key: "7", label: "7" },
  { key: "8", label: "8" },
  { key: "9", label: "9" },
  { key: "-", label: <MinusIcon aria-hidden />, name: "Минус", op: true },
  { key: ",", label: ",", name: "Запятая" },
  { key: "0", label: "0" },
  { key: "000", label: "000", name: "Три нуля" },
  { key: "=", label: <EqualIcon aria-hidden />, name: "Посчитать", op: true },
]

// Our own keypad: the iOS decimal keyboard has no "+", and summing a receipt
// ("3845+1200") is the point of weekly catch-up.
function Keypad({ onKey }: { onKey: (key: Key) => void }) {
  return (
    <div role="group" aria-label="Клавиатура суммы" className="grid grid-cols-4 gap-2">
      {KEYS.map(({ key, label, name, op }) => (
        <button
          key={key}
          type="button"
          aria-label={name}
          onClick={() => onKey(key)}
          className={cn(
            "flex h-11 items-center justify-center rounded-3xl bg-secondary text-2xl font-medium select-none [@media(max-height:700px)]:h-10",
            "transition-[transform,background-color] duration-100 outline-none active:scale-[0.96] active:bg-muted-foreground/25",
            "focus-visible:ring-[3px] focus-visible:ring-ring/50 [&_svg]:size-6",
            op && "text-primary",
          )}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
