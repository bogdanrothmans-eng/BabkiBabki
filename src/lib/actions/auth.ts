"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { z } from "zod"

import { BUDGET_COOKIE, endSession, requireUser, startSession } from "../auth"
import { createBudget } from "../budget"
import { db, transaction } from "../db"
import { createUser, findUserByEmail, verifyPassword } from "../users"

export type FormState = { error?: string; field?: "name" | "email" | "password"; values?: { name?: string; email?: string } } | undefined

const credentials = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email("Похоже, в почте опечатка")),
  password: z.string().min(6, "Пароль — минимум 6 символов"),
})

function issue(error: z.ZodError): FormState {
  const first = error.issues[0]
  const field = first.path[0]
  return {
    error: first.message,
    field: field === "name" || field === "email" || field === "password" ? field : undefined,
  }
}

function safeNext(next: FormDataEntryValue | null) {
  const value = typeof next === "string" ? next : ""
  return value.startsWith("/") && !value.startsWith("//") ? value : "/"
}

function findInvite(token: string) {
  return db
    .prepare("SELECT token, budget_id FROM invites WHERE token = ? AND used_at IS NULL AND expires_at > ?")
    .get(token, new Date().toISOString()) as { token: string; budget_id: string } | undefined
}

function joinBudget(token: string, userId: string) {
  const invite = findInvite(token)
  if (!invite) return null
  transaction(() => {
    db.prepare(
      "INSERT OR IGNORE INTO budget_members (budget_id, user_id, role) VALUES (?, ?, 'member')",
    ).run(invite.budget_id, userId)
    db.prepare("UPDATE invites SET used_by = ?, used_at = datetime('now') WHERE token = ?").run(userId, token)
  })
  return invite.budget_id
}

async function selectBudget(budgetId: string) {
  ;(await cookies()).set(BUDGET_COOKIE, budgetId, { path: "/", sameSite: "lax", maxAge: 60 * 60 * 24 * 365 })
}

export async function register(_: FormState, form: FormData): Promise<FormState> {
  const values = { name: String(form.get("name") ?? ""), email: String(form.get("email") ?? "") }
  const parsed = credentials
    .extend({ name: z.string().trim().min(1, "Как вас зовут?").max(40) })
    .safeParse(Object.fromEntries(form))
  if (!parsed.success) return { ...issue(parsed.error), values }
  const { email, password, name } = parsed.data
  if (findUserByEmail(email)) return { error: "Эта почта уже зарегистрирована — войдите", field: "email", values }

  const userId = createUser(email, name, password)
  const invite = String(form.get("invite") ?? "")
  const budgetId = (invite && joinBudget(invite, userId)) || createBudget(userId, "Наш бюджет")
  await startSession(userId)
  await selectBudget(budgetId)
  redirect("/")
}

export async function login(_: FormState, form: FormData): Promise<FormState> {
  const values = { email: String(form.get("email") ?? "") }
  const parsed = credentials.safeParse(Object.fromEntries(form))
  if (!parsed.success) return { ...issue(parsed.error), values }
  const user = findUserByEmail(parsed.data.email)
  if (!user || !verifyPassword(parsed.data.password, user.password_hash)) {
    // Deliberately not tied to one field: don't reveal which emails exist.
    return { error: "Неверная почта или пароль", values }
  }
  await startSession(user.id)
  const invite = String(form.get("invite") ?? "")
  const joined = invite ? joinBudget(invite, user.id) : null
  if (joined) await selectBudget(joined)
  redirect(joined ? "/" : safeNext(form.get("next")))
}

export async function logout() {
  await endSession()
  redirect("/login")
}

export async function acceptInvite(token: string) {
  const user = await requireUser()
  const budgetId = joinBudget(token, user.id)
  if (!budgetId) redirect(`/invite/${token}`)
  await selectBudget(budgetId)
  redirect("/")
}

export async function switchBudget(budgetId: string) {
  const user = await requireUser()
  const member = db
    .prepare("SELECT 1 FROM budget_members WHERE budget_id = ? AND user_id = ?")
    .get(budgetId, user.id)
  if (member) await selectBudget(budgetId)
  redirect("/")
}
