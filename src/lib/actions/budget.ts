"use server"

import { randomBytes } from "node:crypto"
import { revalidatePath } from "next/cache"
import { z } from "zod"

import { requireContext } from "../auth"
import { db, id } from "../db"
import { importSheet, type ImportResult } from "../import"
import { CATEGORY_COLORS, CATEGORY_ICONS, guessCategoryStyle } from "../category-style"

const INVITE_DAYS = 7

export type CategoryResult = { ok: true } | { ok: false; error: string; field?: "name" } | undefined

const category = z.object({
  name: z.string().trim().min(1, "Назовите категорию").max(60, "Слишком длинное название"),
  icon: z.enum(CATEGORY_ICONS).optional(),
  color: z.enum(CATEGORY_COLORS).optional(),
  kind: z.enum(["expense", "income"]),
})

export async function createCategory(_: CategoryResult, form: FormData): Promise<CategoryResult> {
  const { budget } = await requireContext()
  const parsed = category.safeParse({
    name: form.get("name") ?? "",
    icon: form.get("icon") || undefined,
    color: form.get("color") || undefined,
    kind: form.get("kind"),
  })
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message, field: "name" }
  const { name, kind } = parsed.data
  // SQLite lower() is ASCII-only, so compare Cyrillic names in JS.
  const taken = (
    db.prepare("SELECT name FROM categories WHERE budget_id = ? AND kind = ? AND archived = 0").all(budget.id, kind) as {
      name: string
    }[]
  ).some((c) => c.name.toLocaleLowerCase("ru") === name.toLocaleLowerCase("ru"))
  if (taken) return { ok: false, error: "Такая категория уже есть", field: "name" }
  const guess = guessCategoryStyle(name, kind)
  const { next } = db
    .prepare("SELECT COALESCE(MAX(sort), -1) + 1 AS next FROM categories WHERE budget_id = ? AND kind = ?")
    .get(budget.id, kind) as { next: number }
  db.prepare("INSERT INTO categories (id, budget_id, name, icon, color, kind, sort) VALUES (?, ?, ?, ?, ?, ?, ?)").run(
    id(),
    budget.id,
    name,
    parsed.data.icon ?? guess.icon,
    parsed.data.color ?? guess.color,
    kind,
    next,
  )
  revalidatePath("/", "layout")
  return { ok: true }
}

export async function updateCategory(
  categoryId: string,
  values: { name: string; icon: string; color: string },
): Promise<CategoryResult> {
  const { budget } = await requireContext()
  const parsed = category.pick({ name: true, icon: true, color: true }).required().safeParse(values)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message, field: "name" }
  db.prepare("UPDATE categories SET name = ?, icon = ?, color = ? WHERE id = ? AND budget_id = ?").run(
    parsed.data.name,
    parsed.data.icon,
    parsed.data.color,
    categoryId,
    budget.id,
  )
  revalidatePath("/", "layout")
  return { ok: true }
}

// Categories with history are archived rather than deleted so past months keep adding up.
export async function removeCategory(categoryId: string) {
  const { budget } = await requireContext()
  const used = db.prepare("SELECT 1 FROM transactions WHERE category_id = ? LIMIT 1").get(categoryId)
  if (used) db.prepare("UPDATE categories SET archived = 1 WHERE id = ? AND budget_id = ?").run(categoryId, budget.id)
  else db.prepare("DELETE FROM categories WHERE id = ? AND budget_id = ?").run(categoryId, budget.id)
  revalidatePath("/", "layout")
}

export async function restoreCategory(categoryId: string) {
  const { budget } = await requireContext()
  db.prepare("UPDATE categories SET archived = 0 WHERE id = ? AND budget_id = ?").run(categoryId, budget.id)
  revalidatePath("/", "layout")
}

export async function createInvite() {
  const { user, budget } = await requireContext()
  const token = randomBytes(18).toString("base64url")
  const expires = new Date(Date.now() + INVITE_DAYS * 86400000).toISOString()
  db.prepare("INSERT INTO invites (token, budget_id, created_by, expires_at) VALUES (?, ?, ?, ?)").run(
    token,
    budget.id,
    user.id,
    expires,
  )
  revalidatePath("/settings")
  return token
}

export async function revokeInvite(token: string) {
  const { budget } = await requireContext()
  db.prepare("DELETE FROM invites WHERE token = ? AND budget_id = ? AND used_at IS NULL").run(token, budget.id)
  revalidatePath("/settings")
}

export async function removeMember(userId: string) {
  const { user, budget, role } = await requireContext()
  if (role !== "owner" || userId === user.id) return
  db.prepare("DELETE FROM budget_members WHERE budget_id = ? AND user_id = ? AND role = 'member'").run(budget.id, userId)
  revalidatePath("/", "layout")
}

export async function renameBudget(name: string) {
  const { budget } = await requireContext()
  const value = name.trim().slice(0, 60)
  if (!value) return
  db.prepare("UPDATE budgets SET name = ? WHERE id = ?").run(value, budget.id)
  revalidatePath("/", "layout")
}

export type ImportState = { ok: true; result: ImportResult; year: number } | { ok: false; error: string } | undefined

export async function importSheetAction(_: ImportState, form: FormData): Promise<ImportState> {
  const { user, budget } = await requireContext()
  const file = form.get("file")
  const year = Number(form.get("year"))
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: "Выберите CSV-файл" }
  if (file.size > 2 * 1024 * 1024) return { ok: false, error: "Файл слишком большой для таблицы трат" }
  if (!Number.isInteger(year) || year < 2000 || year > 2100) return { ok: false, error: "Укажите год" }
  try {
    const result = importSheet(budget.id, user.id, await file.text(), year)
    revalidatePath("/", "layout")
    return { ok: true, result, year }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Не получилось прочитать файл" }
  }
}
