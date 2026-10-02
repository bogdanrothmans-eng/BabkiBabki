"use client"

// Browser stand-ins for src/lib/actions/budget.ts (same signatures).

import { guessCategoryStyle, isCategoryColor, isCategoryIcon } from "@/lib/category-style"

import { getState, id, type ImportResult, importInto, update } from "../store"

type CategoryResult = { ok: true } | { ok: false; error: string; field?: "name" } | undefined
type ImportState = { ok: true; result: ImportResult; year: number } | { ok: false; error: string } | undefined

const sameName = (a: string, b: string) => a.toLocaleLowerCase("ru") === b.toLocaleLowerCase("ru")

function checkName(raw: string) {
  const name = raw.trim()
  if (!name) return { error: "Назовите категорию" }
  if (name.length > 60) return { error: "Слишком длинное название" }
  return { name }
}

export async function createCategory(_: CategoryResult, form: FormData): Promise<CategoryResult> {
  const checked = checkName(String(form.get("name") ?? ""))
  if ("error" in checked) return { ok: false, error: checked.error!, field: "name" }
  const kind = form.get("kind") === "income" ? "income" : "expense"
  if (getState().categories.some((c) => c.kind === kind && !c.archived && sameName(c.name, checked.name))) {
    return { ok: false, error: "Такая категория уже есть", field: "name" }
  }
  const guess = guessCategoryStyle(checked.name, kind)
  const icon = form.get("icon")
  const color = form.get("color")
  update((d) => {
    d.categories.push({
      id: id(),
      name: checked.name,
      icon: isCategoryIcon(icon) ? icon : guess.icon,
      color: isCategoryColor(color) ? color : guess.color,
      kind,
      sort: d.categories.filter((c) => c.kind === kind).length,
      archived: 0,
    })
  })
  return { ok: true }
}

export async function updateCategory(
  categoryId: string,
  values: { name: string; icon: string; color: string },
): Promise<CategoryResult> {
  const checked = checkName(values.name)
  if ("error" in checked) return { ok: false, error: checked.error!, field: "name" }
  update((d) => {
    const c = d.categories.find((x) => x.id === categoryId)
    if (!c) return
    c.name = checked.name
    if (isCategoryIcon(values.icon)) c.icon = values.icon
    if (isCategoryColor(values.color)) c.color = values.color
  })
  return { ok: true }
}

export async function removeCategory(categoryId: string) {
  update((d) => {
    const used = d.transactions.some((t) => t.category_id === categoryId)
    if (used) d.categories.find((c) => c.id === categoryId)!.archived = 1
    else d.categories = d.categories.filter((c) => c.id !== categoryId)
  })
}

export async function restoreCategory(categoryId: string) {
  update((d) => {
    const c = d.categories.find((x) => x.id === categoryId)
    if (c) c.archived = 0
  })
}

// The demo already has both partners; invites need a server.
export async function createInvite(): Promise<string> {
  throw new Error("Приглашения работают в полной версии с сервером")
}

export async function revokeInvite() {}

export async function removeMember() {}

export async function renameBudget(name: string) {
  const value = name.trim().slice(0, 60)
  if (!value) return
  update((d) => {
    d.budget.name = value
  })
}

export async function importSheetAction(_: ImportState, form: FormData): Promise<ImportState> {
  const file = form.get("file")
  const year = Number(form.get("year"))
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: "Выберите CSV-файл" }
  if (file.size > 2 * 1024 * 1024) return { ok: false, error: "Файл слишком большой для таблицы трат" }
  if (!Number.isInteger(year) || year < 2000 || year > 2100) return { ok: false, error: "Укажите год" }
  const text = await file.text()
  try {
    const result = update((d) => importInto(d, text, year, d.currentUserId))
    return { ok: true, result, year }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Не получилось прочитать файл" }
  }
}
