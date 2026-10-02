"use client"

// Browser stand-ins for src/lib/actions/transactions.ts (same signatures),
// swapped in by turbopack.resolveAlias in demo/next.config.ts.

import { parseAmount } from "@/lib/money"

import { getState, id, now, StorageFullError, update } from "../store"

type SaveResult = { ok: true; id: string } | { ok: false; error: string } | undefined

const MAX_PHOTO = 1.5 * 1024 * 1024

function photosFrom(form: FormData) {
  return form.getAll("photos").filter((f): f is File => f instanceof File && f.size > 0)
}

function readAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

async function toAttachments(transactionId: string, files: File[]) {
  const userId = getState().currentUserId
  const out = []
  for (const file of files) {
    if (!/^(image\/|application\/pdf)/.test(file.type)) throw new Error(`«${file.name}»: можно фото или PDF`)
    if (file.size > MAX_PHOTO) throw new Error(`«${file.name}» слишком большой для демо (до 1,5 МБ)`)
    out.push({
      id: id(),
      transaction_id: transactionId,
      user_id: userId,
      file_name: file.name || "photo.jpg",
      mime: file.type,
      size: file.size,
      created_at: now(),
      data: await readAsDataUrl(file),
    })
  }
  return out
}

function message(error: unknown) {
  return error instanceof StorageFullError || error instanceof Error ? error.message : "Не получилось сохранить"
}

export async function saveTransaction(_: SaveResult, form: FormData): Promise<SaveResult> {
  const amount = parseAmount(String(form.get("amount") ?? ""))
  if (amount === null) return { ok: false, error: "Введите сумму больше нуля" }
  const kind = form.get("kind") === "income" ? "income" : "expense"
  const categoryId = String(form.get("categoryId") ?? "")
  const s = getState()
  const category = s.categories.find((c) => c.id === categoryId)
  if (!category) return { ok: false, error: "Выберите категорию" }
  if (category.kind !== kind) return { ok: false, error: "Категория не подходит к типу операции" }
  const memberId = String(form.get("memberId") ?? "")
  const date = String(form.get("date") ?? "")
  const note = String(form.get("note") ?? "").trim().slice(0, 500)
  const existing = String(form.get("id") ?? "")
  const transactionId = existing || id()

  try {
    const attachments = await toAttachments(transactionId, photosFrom(form))
    update((d) => {
      const fields = {
        kind,
        amount,
        category_id: categoryId,
        date,
        note,
        member_id: d.members.some((m) => m.id === memberId) ? memberId : d.currentUserId,
        updated_at: now(),
      } as const
      const current = d.transactions.find((t) => t.id === existing)
      if (current) Object.assign(current, fields)
      else
        d.transactions.push({
          id: transactionId,
          ...fields,
          created_by: d.currentUserId,
          source: "manual",
          created_at: now(),
        })
      d.attachments.push(...attachments)
    })
    return { ok: true, id: transactionId }
  } catch (error) {
    return { ok: false, error: message(error) }
  }
}

export async function deleteTransaction(transactionId: string) {
  update((d) => {
    d.transactions = d.transactions.filter((t) => t.id !== transactionId)
    d.comments = d.comments.filter((c) => c.transaction_id !== transactionId)
    d.attachments = d.attachments.filter((a) => a.transaction_id !== transactionId)
  })
}

export async function addComment(transactionId: string, body: string) {
  const text = body.trim().slice(0, 2000)
  if (!text) return
  update((d) => {
    d.comments.push({ id: id(), transaction_id: transactionId, user_id: d.currentUserId, body: text, created_at: now() })
  })
}

export async function deleteComment(commentId: string) {
  update((d) => {
    d.comments = d.comments.filter((c) => !(c.id === commentId && c.user_id === d.currentUserId))
  })
}

export async function uploadPhotos(transactionId: string, form: FormData): Promise<{ error?: string }> {
  try {
    const attachments = await toAttachments(transactionId, photosFrom(form))
    update((d) => {
      d.attachments.push(...attachments)
    })
    return {}
  } catch (error) {
    return { error: message(error) }
  }
}

export async function deleteAttachment(attachmentId: string) {
  update((d) => {
    d.attachments = d.attachments.filter((a) => a.id !== attachmentId)
  })
}
