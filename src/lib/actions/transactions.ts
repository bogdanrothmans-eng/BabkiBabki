"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { requireContext } from "../auth"
import { db, id } from "../db"
import { removeFiles, saveAttachment, validateUpload } from "../files"
import { parseAmount } from "../money"

export type SaveResult = { ok: true; id: string } | { ok: false; error: string } | undefined

const entry = z.object({
  id: z.string().optional(),
  kind: z.enum(["expense", "income"]),
  amount: z.string(),
  categoryId: z.string().min(1, "Выберите категорию"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Укажите дату"),
  note: z.string().trim().max(500).default(""),
  memberId: z.string().optional(),
})

function photosFrom(form: FormData) {
  return form.getAll("photos").filter((f): f is File => f instanceof File && f.size > 0)
}

export async function saveTransaction(_: SaveResult, form: FormData): Promise<SaveResult> {
  const { user, budget, members } = await requireContext()
  const parsed = entry.safeParse({
    id: form.get("id") || undefined,
    kind: form.get("kind"),
    amount: form.get("amount") ?? "",
    categoryId: form.get("categoryId") ?? "",
    date: form.get("date") ?? "",
    note: form.get("note") ?? "",
    memberId: form.get("memberId") || undefined,
  })
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message }
  const data = parsed.data

  const amount = parseAmount(data.amount)
  if (amount === null) return { ok: false, error: "Введите сумму больше нуля" }
  if (amount > 100_000_000_00) return { ok: false, error: "Слишком большая сумма" }

  const category = db
    .prepare("SELECT kind FROM categories WHERE id = ? AND budget_id = ?")
    .get(data.categoryId, budget.id) as { kind: string } | undefined
  if (!category) return { ok: false, error: "Категория не найдена" }
  if (category.kind !== data.kind) return { ok: false, error: "Категория не подходит к типу операции" }

  const memberId = members.some((m) => m.id === data.memberId) ? data.memberId! : user.id
  const photos = photosFrom(form)
  const photoError = photos.map(validateUpload).find(Boolean)
  if (photoError) return { ok: false, error: photoError }

  let transactionId = data.id
  if (transactionId) {
    const result = db
      .prepare(
        `UPDATE transactions SET kind = ?, amount = ?, category_id = ?, date = ?, note = ?, member_id = ?,
         updated_at = datetime('now') WHERE id = ? AND budget_id = ?`,
      )
      .run(data.kind, amount, data.categoryId, data.date, data.note, memberId, transactionId, budget.id)
    if (result.changes === 0) return { ok: false, error: "Запись не найдена — возможно, её уже удалили" }
  } else {
    transactionId = id()
    db.prepare(
      `INSERT INTO transactions (id, budget_id, category_id, kind, amount, date, note, member_id, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(transactionId, budget.id, data.categoryId, data.kind, amount, data.date, data.note, memberId, user.id)
  }
  for (const photo of photos) await saveAttachment(transactionId, user.id, photo)

  revalidatePath("/", "layout")
  return { ok: true, id: transactionId }
}

function ownsTransaction(transactionId: string, budgetId: string) {
  return !!db.prepare("SELECT 1 FROM transactions WHERE id = ? AND budget_id = ?").get(transactionId, budgetId)
}

export async function deleteTransaction(transactionId: string) {
  const { budget } = await requireContext()
  if (!ownsTransaction(transactionId, budget.id)) return
  const files = db
    .prepare("SELECT id FROM attachments WHERE transaction_id = ?")
    .all(transactionId) as { id: string }[]
  db.prepare("DELETE FROM transactions WHERE id = ? AND budget_id = ?").run(transactionId, budget.id)
  await removeFiles(files.map((f) => f.id))
  revalidatePath("/", "layout")
}

export async function addComment(transactionId: string, body: string) {
  const { user, budget } = await requireContext()
  const text = body.trim().slice(0, 2000)
  if (!text || !ownsTransaction(transactionId, budget.id)) return
  db.prepare("INSERT INTO comments (id, transaction_id, user_id, body) VALUES (?, ?, ?, ?)").run(
    id(),
    transactionId,
    user.id,
    text,
  )
  revalidatePath("/", "layout")
}

export async function deleteComment(commentId: string) {
  const { user, budget } = await requireContext()
  db.prepare(
    `DELETE FROM comments WHERE id = ? AND user_id = ?
     AND transaction_id IN (SELECT id FROM transactions WHERE budget_id = ?)`,
  ).run(commentId, user.id, budget.id)
  revalidatePath("/", "layout")
}

export async function uploadPhotos(transactionId: string, form: FormData): Promise<{ error?: string }> {
  const { user, budget } = await requireContext()
  if (!ownsTransaction(transactionId, budget.id)) return { error: "Запись не найдена" }
  const photos = photosFrom(form)
  const error = photos.map(validateUpload).find(Boolean)
  if (error) return { error }
  for (const photo of photos) await saveAttachment(transactionId, user.id, photo)
  revalidatePath("/", "layout")
  return {}
}

export async function deleteAttachment(attachmentId: string) {
  const { budget } = await requireContext()
  const deleted = db
    .prepare(
      `DELETE FROM attachments WHERE id = ?
       AND transaction_id IN (SELECT id FROM transactions WHERE budget_id = ?)`,
    )
    .run(attachmentId, budget.id)
  if (deleted.changes) await removeFiles([attachmentId])
  revalidatePath("/", "layout")
}
