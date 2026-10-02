"use client"

import { ru } from "date-fns/locale"
import { CalendarIcon, CameraIcon, XIcon } from "lucide-react"
import { useActionState, useEffect, useMemo, useRef, useState, startTransition } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { saveTransaction, type SaveResult } from "@/lib/actions/transactions"
import { compressImage } from "@/lib/compress-image"
import { formatMoney, parseAmount, toInputValue } from "@/lib/money"
import { formatDay, isoDate, parseIso } from "@/lib/period"
import { cn } from "@/lib/utils"

export type CategoryOption = { id: string; name: string; emoji: string; kind: "expense" | "income"; used: number }
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
  const [amount, setAmount] = useState(initial?.amount ? toInputValue(initial.amount) : "")
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? "")
  const [date, setDate] = useState(initial?.date ?? isoDate(new Date()))
  const [memberId, setMemberId] = useState(initial?.memberId ?? currentUserId)
  const [showAll, setShowAll] = useState(false)
  const [photos, setPhotos] = useState<{ file: File; url: string }[]>([])
  const fileInput = useRef<HTMLInputElement>(null)
  const [state, dispatch, pending] = useActionState<SaveResult, FormData>(saveTransaction, undefined)

  const options = useMemo(() => {
    const ofKind = categories.filter((c) => c.kind === kind)
    // Most used first so the usual 3–4 categories are always one tap away.
    const ranked = [...ofKind].sort((a, b) => b.used - a.used)
    const quick = ranked.slice(0, QUICK_CATEGORIES)
    const selected = ofKind.find((c) => c.id === categoryId)
    if (selected && !quick.includes(selected)) quick[quick.length - 1] = selected
    return { quick, all: ofKind }
  }, [categories, kind, categoryId])

  useEffect(() => {
    if (!state) return
    if (state.ok) {
      toast.success(editing ? "Сохранено" : "Добавлено")
      onSaved?.(state.id)
    } else toast.error(state.error)
  }, [state]) // eslint-disable-line react-hooks/exhaustive-deps

  const parsed = parseAmount(amount)
  const [{ today, yesterday }] = useState(() => {
    const now = new Date()
    const y = new Date(now)
    y.setDate(now.getDate() - 1)
    return { today: isoDate(now), yesterday: isoDate(y) }
  })

  async function submit(form: FormData) {
    form.delete("photos")
    for (const { file } of photos) form.append("photos", await compressImage(file))
    startTransition(() => dispatch(form))
  }

  return (
    <form action={submit} className="flex flex-col gap-5">
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
        <TabsList className="mx-auto">
          <TabsTrigger value="expense" className="px-5">
            Расход
          </TabsTrigger>
          <TabsTrigger value="income" className="px-5">
            Доход
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <label className="flex flex-col items-center gap-1">
        <span className="sr-only">Сумма</span>
        <span className="flex items-baseline justify-center gap-2">
          <input
            name="amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            inputMode="decimal"
            autoComplete="off"
            autoFocus={!editing}
            placeholder="0"
            aria-invalid={amount !== "" && parsed === null}
            className={cn(
              "w-full max-w-[9ch] bg-transparent text-center text-5xl font-semibold tracking-tight outline-none placeholder:text-muted-foreground/40 sm:text-6xl",
              kind === "income" && "text-income",
            )}
            style={{ width: `${Math.max(amount.length, 1) + 0.5}ch` }}
          />
          <span className="text-3xl font-medium text-muted-foreground">₽</span>
        </span>
      </label>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-medium">Категория</legend>
        <div className="grid grid-cols-4 gap-2">
          {(showAll ? options.all : options.quick).map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCategoryId(c.id)}
              aria-pressed={categoryId === c.id}
              className={cn(
                "flex min-h-18 flex-col items-center justify-center gap-1 rounded-lg border px-1 py-2 text-center text-xs leading-tight transition-colors",
                "hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none",
                categoryId === c.id && "border-primary bg-primary text-primary-foreground hover:bg-primary",
              )}
            >
              <span className="text-xl leading-none">{c.emoji}</span>
              <span className="line-clamp-2 break-words">{c.name}</span>
            </button>
          ))}
        </div>
        {options.all.length > QUICK_CATEGORIES && (
          <Button type="button" variant="ghost" size="sm" onClick={() => setShowAll((v) => !v)}>
            {showAll ? "Свернуть" : `Все категории (${options.all.length})`}
          </Button>
        )}
      </fieldset>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">Дата</span>
        <div className="flex flex-wrap gap-2">
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
                <CalendarIcon />
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
          <span className="text-sm font-medium">{kind === "expense" ? "Кто платил" : "Кто получил"}</span>
          <ToggleGroup
            type="single"
            variant="outline"
            value={memberId ?? ""}
            onValueChange={(v) => v && setMemberId(v)}
            className="w-full"
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
              className="size-16 flex-col gap-1 text-xs"
              onClick={() => fileInput.current?.click()}
            >
              <CameraIcon className="size-5" />
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

      <div className="sticky bottom-0 -mb-1 bg-background pt-2 pb-1">
        <Button type="submit" size="lg" className="h-12 w-full text-base" disabled={pending || !parsed || !categoryId}>
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
    <div className="relative size-16 overflow-hidden rounded-md border bg-muted">
      {file.type.startsWith("image/") ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={file.name} className="size-full object-cover" />
      ) : (
        <span className="flex size-full items-center justify-center text-xs text-muted-foreground">PDF</span>
      )}
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Убрать ${file.name}`}
        className="absolute top-0.5 right-0.5 rounded-full bg-background/90 p-0.5 shadow"
      >
        <XIcon className="size-3" />
      </button>
    </div>
  )
}
