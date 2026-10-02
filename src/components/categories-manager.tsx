"use client"

import { ArchiveRestoreIcon, CheckIcon, PlusIcon, Trash2Icon } from "lucide-react"
import { useState, useTransition } from "react"
import { toast } from "sonner"

import { CategoryIcon, ICON_COMPONENTS } from "@/components/category-icon"
import { ResponsiveDialog } from "@/components/responsive-dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { createCategory, removeCategory, restoreCategory, updateCategory } from "@/lib/actions/budget"
import {
  CATEGORY_COLORS,
  CATEGORY_ICONS,
  type CategoryColor,
  type CategoryIconName,
  guessCategoryStyle,
  ICON_LABELS,
} from "@/lib/category-style"
import { plural } from "@/lib/plural"
import type { Category, Kind } from "@/lib/queries"
import { cn } from "@/lib/utils"

const COLOR_NAMES: Record<CategoryColor, string> = {
  blue: "синий",
  indigo: "индиго",
  violet: "фиолетовый",
  pink: "розовый",
  red: "красный",
  orange: "оранжевый",
  amber: "янтарный",
  green: "зелёный",
  teal: "бирюзовый",
  sky: "голубой",
  slate: "серый",
}

type Editing = { kind: Kind; category?: Category }

// Name, colour and icon with a live preview — the pattern Buddy, Origin and
// Tripsy use for custom categories.
function CategoryEditor({ editing, onDone }: { editing: Editing; onDone: () => void }) {
  const { category, kind } = editing
  const [name, setName] = useState(category?.name ?? "")
  const [icon, setIcon] = useState<CategoryIconName>((category?.icon as CategoryIconName) ?? "circle-ellipsis")
  const [color, setColor] = useState<CategoryColor>((category?.color as CategoryColor) ?? "blue")
  const [touched, setTouched] = useState(!!category)
  const [error, setError] = useState<string>()
  const [pending, startTransition] = useTransition()

  function onName(value: string) {
    setName(value)
    setError(undefined)
    // Suggest an icon from the name until the user picks one themselves.
    if (!touched) {
      const guess = guessCategoryStyle(value, kind)
      setIcon(guess.icon)
      setColor(guess.color)
    }
  }

  return (
    <form
      className="flex flex-col gap-5"
      noValidate
      onSubmit={(e) => {
        e.preventDefault()
        if (!name.trim()) return setError("Назовите категорию")
        startTransition(async () => {
          const form = new FormData()
          for (const [key, value] of Object.entries({ name, icon, color, kind })) form.set(key, value)
          const result = category
            ? await updateCategory(category.id, { name, icon, color })
            : await createCategory(undefined, form)
          if (result?.ok) {
            toast.success(category ? "Сохранено" : "Категория добавлена")
            onDone()
          } else if (result) setError(result.error)
        })
      }}
    >
      <h2 className="text-lg font-semibold">{category ? "Категория" : kind === "expense" ? "Новая категория расходов" : "Новый источник дохода"}</h2>

      <div className="flex items-center gap-3">
        <CategoryIcon icon={icon} color={color} size="lg" />
        <div className="grid flex-1 gap-2">
          <Label htmlFor="category-name">Название</Label>
          <Input
            id="category-name"
            value={name}
            onChange={(e) => onName(e.target.value)}
            maxLength={60}
            autoFocus={!category}
            aria-invalid={!!error}
            aria-describedby={error ? "category-name-error" : undefined}
          />
        </div>
      </div>
      {error && (
        <p id="category-name-error" className="-mt-3 text-sm text-destructive">
          {error}
        </p>
      )}

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-medium">Цвет</legend>
        <div role="radiogroup" aria-label="Цвет" className="flex flex-wrap gap-1">
          {CATEGORY_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              role="radio"
              aria-checked={color === c}
              aria-label={COLOR_NAMES[c]}
              onClick={() => {
                setColor(c)
                setTouched(true)
              }}
              className="flex size-11 items-center justify-center rounded-full focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
            >
              <span
                style={{ backgroundColor: `var(--cat-${c})` }}
                className={cn(
                  "flex size-8 items-center justify-center rounded-full text-white ring-offset-2 ring-offset-background",
                  color === c && "ring-2 ring-foreground",
                )}
              >
                {color === c && <CheckIcon className="size-4" aria-hidden />}
              </span>
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-medium">Иконка</legend>
        <div role="radiogroup" aria-label="Иконка" className="grid grid-cols-6 gap-1 sm:grid-cols-9">
          {CATEGORY_ICONS.map((key) => {
            const Icon = ICON_COMPONENTS[key]
            return (
              <button
                key={key}
                type="button"
                role="radio"
                aria-checked={icon === key}
                aria-label={ICON_LABELS[key]}
                onClick={() => {
                  setIcon(key)
                  setTouched(true)
                }}
                className={cn(
                  "flex size-11 items-center justify-center rounded-xl text-muted-foreground transition-colors duration-150 hover:bg-accent hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none",
                  icon === key && "bg-accent text-foreground ring-2 ring-primary",
                )}
              >
                <Icon className="size-5" aria-hidden />
              </button>
            )
          })}
        </div>
      </fieldset>

      <div className="sticky bottom-0 -mb-1 bg-background pt-2 pb-1">
        <Button type="submit" size="lg" className="w-full" disabled={pending}>
          {pending && <Spinner />}
          {category ? "Сохранить" : "Добавить"}
        </Button>
      </div>
    </form>
  )
}

function RemoveCategory({ category }: { category: Category }) {
  const [pending, startTransition] = useTransition()
  const archive = category.used > 0
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={`Убрать «${category.name}»`} className="text-muted-foreground">
          <Trash2Icon aria-hidden />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{archive ? `Убрать «${category.name}» в архив?` : `Удалить «${category.name}»?`}</AlertDialogTitle>
          <AlertDialogDescription>
            {archive
              ? `В ней ${category.used} ${plural(category.used, ["запись", "записи", "записей"])} — они останутся в истории и в итогах прошлых месяцев. Категорию можно будет вернуть из архива.`
              : "Записей в ней нет, категория исчезнет из списка."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Отмена</AlertDialogCancel>
          <AlertDialogAction
            disabled={pending}
            className={archive ? undefined : "bg-destructive text-white hover:bg-destructive/90"}
            onClick={() =>
              startTransition(async () => {
                await removeCategory(category.id)
                toast.success(archive ? "Категория в архиве" : "Категория удалена")
              })
            }
          >
            {archive ? "В архив" : "Удалить"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

function CategoryList({ items, onEdit }: { items: Category[]; onEdit: (c: Category) => void }) {
  const [, startTransition] = useTransition()
  const active = items.filter((c) => !c.archived)
  const archived = items.filter((c) => c.archived)

  return (
    <>
      <ul className="divide-y overflow-hidden rounded-xl border bg-card">
        {active.map((c) => (
          <li key={c.id} className="flex items-center gap-1 pr-2">
            <button
              type="button"
              onClick={() => onEdit(c)}
              aria-label={`Изменить «${c.name}»`}
              className="flex min-h-16 min-w-0 flex-1 items-center gap-3 px-3 py-2 text-left transition-colors duration-150 hover:bg-accent/60 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none focus-visible:ring-inset"
            >
              <CategoryIcon icon={c.icon} color={c.color} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-base md:text-sm">{c.name}</span>
                <span className="text-sm text-muted-foreground md:text-xs">
                  {c.used ? `${c.used} ${plural(c.used, ["запись", "записи", "записей"])}` : "пока без записей"}
                </span>
              </span>
            </button>
            <RemoveCategory category={c} />
          </li>
        ))}
      </ul>
      {archived.length > 0 && (
        <details className="group mt-2">
          <summary className="flex min-h-11 items-center text-sm text-muted-foreground">Архив ({archived.length})</summary>
          <ul className="mt-1 divide-y overflow-hidden rounded-xl border bg-card">
            {archived.map((c) => (
              <li key={c.id} className="flex min-h-16 items-center gap-3 px-3 py-2">
                <CategoryIcon icon={c.icon} color="slate" />
                <span className="flex-1 truncate text-base text-muted-foreground md:text-sm">{c.name}</span>
                <Button
                  variant="ghost"
                  onClick={() =>
                    startTransition(async () => {
                      await restoreCategory(c.id)
                      toast.success("Категория снова в списке")
                    })
                  }
                >
                  <ArchiveRestoreIcon aria-hidden />
                  Вернуть
                </Button>
              </li>
            ))}
          </ul>
        </details>
      )}
    </>
  )
}

export function CategoriesManager({ categories }: { categories: Category[] }) {
  const [editing, setEditing] = useState<Editing | null>(null)
  const [round, setRound] = useState(0)

  function open(next: Editing) {
    setRound((r) => r + 1)
    setEditing(next)
  }

  return (
    <>
      <Tabs defaultValue="expense" className="gap-4">
        <TabsList className="w-full md:w-fit">
          <TabsTrigger value="expense">Расходы</TabsTrigger>
          <TabsTrigger value="income">Доходы</TabsTrigger>
        </TabsList>
        {(["expense", "income"] as const).map((kind) => (
          <TabsContent key={kind} value={kind} className="flex flex-col gap-3">
            <Button variant="outline" className="self-start" onClick={() => open({ kind })}>
              <PlusIcon aria-hidden />
              {kind === "expense" ? "Новая категория" : "Новый источник дохода"}
            </Button>
            <CategoryList items={categories.filter((c) => c.kind === kind)} onEdit={(c) => open({ kind, category: c })} />
          </TabsContent>
        ))}
      </Tabs>
      <ResponsiveDialog
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(null)}
        title={editing?.category ? "Изменить категорию" : "Новая категория"}
      >
        {editing && <CategoryEditor key={round} editing={editing} onDone={() => setEditing(null)} />}
      </ResponsiveDialog>
    </>
  )
}
