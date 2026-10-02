"use client"

import { ru } from "date-fns/locale"
import { CalendarIcon, CameraIcon, Settings2Icon, XIcon } from "lucide-react"
import Link from "next/link"
import { startTransition, useActionState, useEffect, useMemo, useRef, useState } from "react"
import { toast } from "sonner"

import { CategoryIcon } from "@/components/category-icon"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Spinner } from "@/components/ui/spinner"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { saveTransaction, type SaveResult } from "@/lib/actions/transactions"
import { compressImage } from "@/lib/compress-image"
import { formatAmountInput, formatMoney, parseAmount, toInputValue } from "@/lib/money"
import { formatDay, isoDate, parseIso } from "@/lib/period"
import { cn } from "@/lib/utils"

export type CategoryOption = {
  id: string
  name: string
  icon: string
  color: string
  kind: "expense" | "income"
  used: number
}
export type MemberOption = { id: string; name: string }

export type TransactionDraft = {
  id?: string
  kind: "expense" | "income"
  amount?: number
  categoryId?: string
  date?: string
  note?: string
  memberId?: string | null
}

const QUICK_CATEGORIES = 8

type Errors = { amount?: string; category?: string }

export function TransactionForm({
  categories,
  members,
  currentUserId,
  initial,
  onSaved,
}: {
  categories: CategoryOption[]
  members: MemberOption[]
  currentUserId: string
  initial?: TransactionDraft
  onSaved?: (id: string) => void
}) {
  const editing = !!initial?.id
  const [kind, setKind] = useState<"expense" | "income">(initial?.kind ?? "expense")
  const [amount, setAmount] = useState(initial?.amount ? formatAmountInput(toInputValue(initial.amount)) : "")
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? "")
  const [date, setDate] = useState(initial?.date ?? isoDate(new Date()))
  const [memberId, setMemberId] = useState(initial?.memberId ?? currentUserId)
  const [showAll, setShowAll] = useState(false)
  const [photos, setPhotos] = useState<{ file: File; url: string }[]>([])
  const [errors, setErrors] = useState<Errors>({})
  const [preparing, setPreparing] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)
  const amountInput = useRef<HTMLInputElement>(null)
  const categoryGroup = useRef<HTMLFieldSetElement>(null)
  const [state, dispatch, saving] = useActionState<SaveResult, FormData>(saveTransaction, undefined)
  const pending = saving || preparing
  const [{ today, yesterday }] = useState(() => {
    const now = new Date()
    const y = new Date(now)
    y.setDate(now.getDate() - 1)
    return { today: isoDate(now), yesterday: isoDate(y) }
  })

  const options = useMemo(() => {
    const ofKind = categories.filter((c) => c.kind === kind)
    // Most used first so the usual 3–4 categories are always one tap away.
    const quick = [...ofKind].sort((a, b) => b.used - a.used).slice(0, QUICK_CATEGORIES)
    const selected = ofKind.find((c) => c.id === categoryId)
    if (selected && !quick.includes(selected)) quick[quick.length - 1] = selected
    return { quick, all: ofKind }
  }, [categories, kind, categoryId])

  useEffect(() => {
    if (!state?.ok) return
    toast.success(editing ? "Сохранено" : "Добавлено")
    onSaved?.(state.id)
  }, [state]) // eslint-disable-line react-hooks/exhaustive-deps
  const serverError = state && !state.ok ? state.error : undefined

  const parsed = parseAmount(amount)

  async function submit(form: FormData) {
    const next: Errors = {}
    if (!parsed) next.amount = "Введите сумму больше нуля"
    if (!categoryId) next.category = "Выберите категорию"
    setErrors(next)
    if (next.amount) return amountInput.current?.focus()
    if (next.category) return categoryGroup.current?.querySelector("button")?.focus()

    setPreparing(true)
    form.delete("photos")
    for (const { file } of photos) form.append("photos", await compressImage(file))
    setPreparing(false)
    startTransition(() => dispatch(form))
  }

  return (
    <form action={submit} noValidate className="flex flex-col gap-5">
      {initial?.id && <input type="hidden" name="id" value={initial.id} />}
      <input type="hidden" name="kind" value={kind} />
      <input type="hidden" name="categoryId" value={categoryId} />
      <input type="hidden" name="date" value={date} />
      <input type="hidden" name="memberId" value={memberId ?? ""} />

      <Tabs
        value={kind}
        onValueChange={(v) => {
          setKind(v as typeof kind)
          setCategoryId("")
        }}
      >
        <TabsList className="mx-auto w-full max-w-64">
          <TabsTrigger value="expense">Расход</TabsTrigger>
          <TabsTrigger value="income">Доход</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="flex flex-col items-center gap-1">
        <label htmlFor="amount" className="text-sm text-muted-foreground">
          Сумма
        </label>
        <div className="flex items-baseline justify-center gap-2">
          <input
            ref={amountInput}
            id="amount"
            name="amount"
            value={amount}
            onChange={(e) => {
              setAmount(formatAmountInput(e.target.value))
              if (errors.amount) setErrors({ ...errors, amount: undefined })
            }}
            inputMode="decimal"
            enterKeyHint="done"
            autoComplete="off"
            autoFocus={!editing}
            placeholder="0"
            aria-invalid={!!errors.amount}
            aria-describedby={errors.amount ? "amount-error" : undefined}
            className={cn(
              "max-w-[10ch] min-w-[2ch] rounded-md bg-transparent text-center text-5xl font-semibold tracking-tight outline-none placeholder:text-muted-foreground/50 focus-visible:ring-[3px] focus-visible:ring-ring/50 sm:text-6xl",
              kind === "income" && "text-income",
            )}
            style={{ width: `${Math.max(amount.length, 1) + 1}ch` }}
          />
          <span aria-hidden className="text-3xl font-medium text-muted-foreground">
            ₽
          </span>
        </div>
        {errors.amount && (
          <p id="amount-error" className="text-sm text-destructive">
            {errors.amount}
          </p>
        )}
      </div>

      <fieldset
        ref={categoryGroup}
        className="flex flex-col gap-2"
        aria-invalid={!!errors.category}
        aria-describedby={errors.category ? "category-error" : undefined}
      >
        <div className="flex items-center justify-between">
          <legend className="text-sm font-medium">Категория</legend>
          <Link
            href="/categories"
            className="flex min-h-11 items-center gap-1 text-sm text-muted-foreground hover:text-foreground md:min-h-0"
          >
            <Settings2Icon className="size-4" aria-hidden />
            Настроить
          </Link>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {(showAll ? options.all : options.quick).map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => {
                setCategoryId(c.id)
                if (errors.category) setErrors({ ...errors, category: undefined })
              }}
              aria-pressed={categoryId === c.id}
              className={cn(
                "flex min-h-20 flex-col items-center justify-start gap-1.5 rounded-xl border border-transparent px-1 py-2 text-center text-xs leading-tight transition-colors duration-150",
                "hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none",
                categoryId === c.id && "border-primary bg-accent font-medium",
              )}
            >
              <CategoryIcon icon={c.icon} color={c.color} />
              <span className="line-clamp-2 break-words">{c.name}</span>
            </button>
          ))}
        </div>
        {errors.category && (
          <p id="category-error" className="text-sm text-destructive">
            {errors.category}
          </p>
        )}
        {options.all.length > QUICK_CATEGORIES && (
          <Button type="button" variant="ghost" onClick={() => setShowAll((v) => !v)} aria-expanded={showAll}>
            {showAll ? "Свернуть" : `Все категории (${options.all.length})`}
          </Button>
        )}
      </fieldset>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium" id="date-label">
          Дата
        </span>
        <div className="flex flex-wrap gap-2" role="group" aria-labelledby="date-label">
          <Button type="button" size="sm" variant={date === today ? "default" : "outline"} onClick={() => setDate(today)}>
            Сегодня
          </Button>
          <Button
            type="button"
            size="sm"
            variant={date === yesterday ? "default" : "outline"}
            onClick={() => setDate(yesterday)}
          >
            Вчера
          </Button>
          <Popover>
            <PopoverTrigger asChild>
              <Button type="button" size="sm" variant={date !== today && date !== yesterday ? "default" : "outline"}>
                <CalendarIcon aria-hidden />
                {date !== today && date !== yesterday ? formatDay(date, true) : "Другая дата"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                locale={ru}
                selected={parseIso(date)}
                defaultMonth={parseIso(date)}
                onSelect={(d) => d && setDate(isoDate(d))}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {members.length > 1 && (
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium" id="member-label">
            {kind === "expense" ? "Кто платил" : "Кто получил"}
          </span>
          <ToggleGroup
            type="single"
            variant="outline"
            value={memberId ?? ""}
            onValueChange={(v) => v && setMemberId(v)}
            className="w-full"
            aria-labelledby="member-label"
          >
            {members.map((m) => (
              <ToggleGroupItem
                key={m.id}
                value={m.id}
                className="flex-1 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
              >
                {m.id === currentUserId ? `${m.name} (я)` : m.name}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <Label htmlFor="note">Комментарий</Label>
        <Textarea
          id="note"
          name="note"
          defaultValue={initial?.note}
          placeholder="Например: Пятёрочка, корм коту"
          rows={2}
          maxLength={500}
          className="text-base md:text-sm"
        />
      </div>

      {!editing && (
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium">Чек или фото</span>
          <div className="flex flex-wrap gap-2">
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
            <Button
              type="button"
              variant="outline"
              className="h-16 w-16 flex-col gap-1 text-xs md:h-16"
              onClick={() => fileInput.current?.click()}
            >
              <CameraIcon className="size-5" aria-hidden />
              Добавить
            </Button>
          </div>
          <input
            ref={fileInput}
            type="file"
            accept="image/*,application/pdf"
            multiple
            hidden
            onChange={(e) => {
              const added = Array.from(e.target.files ?? []).map((file) => ({ file, url: URL.createObjectURL(file) }))
              setPhotos([...photos, ...added])
              e.target.value = ""
            }}
          />
        </div>
      )}

      <div className="sticky bottom-0 -mb-1 flex flex-col gap-2 bg-background pt-2 pb-1">
        {serverError && !pending && (
          <p role="alert" className="text-sm text-destructive">
            {serverError}
          </p>
        )}
        <Button type="submit" size="lg" className="h-12 w-full text-base md:h-11" disabled={pending}>
          {pending && <Spinner />}
          {pending
            ? "Сохраняем…"
            : `${editing ? "Сохранить" : "Добавить"}${parsed ? ` ${formatMoney(parsed)}` : ""}`}
        </Button>
      </div>
    </form>
  )
}

function PhotoPreview({ file, url, onRemove }: { file: File; url: string; onRemove: () => void }) {
  return (
    <div className="relative size-16">
      <div className="size-full overflow-hidden rounded-lg border bg-muted">
        {file.type.startsWith("image/") ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt={file.name} width={64} height={64} className="size-full object-cover" />
        ) : (
          <span className="flex size-full items-center justify-center text-xs text-muted-foreground">PDF</span>
        )}
      </div>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Убрать ${file.name}`}
        className="absolute -top-3 -right-3 flex size-11 items-center justify-center"
      >
        <span className="rounded-full bg-background p-1 shadow ring-1 ring-border">
          <XIcon className="size-3.5" aria-hidden />
        </span>
      </button>
    </div>
  )
}
