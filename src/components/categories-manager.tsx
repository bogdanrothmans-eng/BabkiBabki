"use client"

import { ArchiveRestoreIcon, PencilIcon, PlusIcon, Trash2Icon } from "lucide-react"
import { useActionState, useEffect, useRef, useState, useTransition } from "react"
import { toast } from "sonner"

import { ResponsiveDialog } from "@/components/responsive-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  type CategoryResult,
  createCategory,
  removeCategory,
  restoreCategory,
  updateCategory,
} from "@/lib/actions/budget"
import { plural } from "@/lib/plural"
import type { Category } from "@/lib/queries"

const EMOJI_SUGGESTIONS = ["🛒", "☕", "🍽️", "🚕", "🏠", "💊", "🐾", "🎁", "👕", "💄", "🎓", "✈️", "🎮", "📚", "🍷", "🧸", "💰", "💳"]

function AddCategory({ kind }: { kind: "expense" | "income" }) {
  const [state, action, pending] = useActionState<CategoryResult, FormData>(createCategory, undefined)
  const form = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state?.ok) {
      toast.success("Категория добавлена")
      form.current?.reset()
    } else if (state) toast.error(state.error)
  }, [state])

  return (
    <form ref={form} action={action} className="flex gap-2">
      <input type="hidden" name="kind" value={kind} />
      <Input name="emoji" placeholder="🙂" className="w-14 text-center text-lg" maxLength={8} aria-label="Иконка" />
      <Input name="name" placeholder={kind === "expense" ? "Новая категория расходов" : "Новый источник дохода"} required maxLength={60} aria-label="Название" />
      <Button type="submit" disabled={pending}>
        <PlusIcon />
        <span className="hidden sm:inline">Добавить</span>
      </Button>
    </form>
  )
}

function EditCategory({ category, onDone }: { category: Category; onDone: () => void }) {
  const [name, setName] = useState(category.name)
  const [emoji, setEmoji] = useState(category.emoji)
  const [pending, startTransition] = useTransition()

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault()
        startTransition(async () => {
          const result = await updateCategory(category.id, name, emoji)
          if (result?.ok) {
            toast.success("Сохранено")
            onDone()
          } else if (result) toast.error(result.error)
        })
      }}
    >
      <h2 className="text-lg font-semibold">Категория</h2>
      <div className="flex gap-2">
        <div className="grid gap-2">
          <Label htmlFor="cat-emoji">Иконка</Label>
          <Input id="cat-emoji" value={emoji} onChange={(e) => setEmoji(e.target.value)} className="w-16 text-center text-lg" maxLength={8} />
        </div>
        <div className="grid flex-1 gap-2">
          <Label htmlFor="cat-name">Название</Label>
          <Input id="cat-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} required />
        </div>
      </div>
      <div className="flex flex-wrap gap-1">
        {EMOJI_SUGGESTIONS.map((e) => (
          <Button key={e} type="button" variant={emoji === e ? "secondary" : "ghost"} size="icon-sm" onClick={() => setEmoji(e)}>
            {e}
          </Button>
        ))}
      </div>
      <Button type="submit" size="lg" disabled={pending}>
        Сохранить
      </Button>
    </form>
  )
}

function CategoryList({ items }: { items: Category[] }) {
  const [editing, setEditing] = useState<Category | null>(null)
  const [, startTransition] = useTransition()
  const active = items.filter((c) => !c.archived)
  const archived = items.filter((c) => c.archived)

  return (
    <>
      <ul className="divide-y rounded-xl border bg-card">
        {active.map((c) => (
          <li key={c.id} className="flex items-center gap-3 px-3 py-2">
            <span className="text-xl">{c.emoji}</span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm">{c.name}</span>
              <span className="text-xs text-muted-foreground">
                {c.used ? `${c.used} ${plural(c.used, ["запись", "записи", "записей"])}` : "пока не использовалась"}
              </span>
            </span>
            <Button variant="ghost" size="icon-sm" aria-label={`Изменить «${c.name}»`} onClick={() => setEditing(c)}>
              <PencilIcon />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`Убрать «${c.name}»`}
              onClick={() =>
                startTransition(async () => {
                  await removeCategory(c.id)
                  toast.success(c.used ? "Категория в архиве — старые записи сохранены" : "Категория удалена")
                })
              }
            >
              <Trash2Icon />
            </Button>
          </li>
        ))}
      </ul>
      {archived.length > 0 && (
        <details className="mt-4">
          <summary className="cursor-pointer text-sm text-muted-foreground">Архив ({archived.length})</summary>
          <ul className="mt-2 divide-y rounded-xl border bg-card">
            {archived.map((c) => (
              <li key={c.id} className="flex items-center gap-3 px-3 py-2 text-muted-foreground">
                <span className="text-xl grayscale">{c.emoji}</span>
                <span className="flex-1 truncate text-sm">{c.name}</span>
                <Button variant="ghost" size="sm" onClick={() => startTransition(() => restoreCategory(c.id))}>
                  <ArchiveRestoreIcon />
                  Вернуть
                </Button>
              </li>
            ))}
          </ul>
        </details>
      )}
      <ResponsiveDialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)} title="Изменить категорию">
        {editing && <EditCategory key={editing.id} category={editing} onDone={() => setEditing(null)} />}
      </ResponsiveDialog>
    </>
  )
}

export function CategoriesManager({ categories }: { categories: Category[] }) {
  return (
    <Tabs defaultValue="expense" className="gap-4">
      <TabsList>
        <TabsTrigger value="expense">Расходы</TabsTrigger>
        <TabsTrigger value="income">Доходы</TabsTrigger>
      </TabsList>
      {(["expense", "income"] as const).map((kind) => (
        <TabsContent key={kind} value={kind} className="flex flex-col gap-4">
          <AddCategory kind={kind} />
          <CategoryList items={categories.filter((c) => c.kind === kind)} />
        </TabsContent>
      ))}
    </Tabs>
  )
}
