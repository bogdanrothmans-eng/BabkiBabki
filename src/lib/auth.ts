import "server-only"

import { randomBytes } from "node:crypto"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { cache } from "react"

import { createBudget } from "./budget"
import { db } from "./db"
import type { User } from "./users"

export type { User }

const SESSION_COOKIE = "babki_session"
export const BUDGET_COOKIE = "babki_budget"
const SESSION_DAYS = 60

export type Member = User & { role: "owner" | "member" }
export type Budget = { id: string; name: string; currency: string }

export async function startSession(userId: string) {
  const token = randomBytes(32).toString("base64url")
  const expires = new Date(Date.now() + SESSION_DAYS * 86400000)
  db.prepare("INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)").run(
    token,
    userId,
    expires.toISOString(),
  )
  const store = await cookies()
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires,
  })
}

export async function endSession() {
  const store = await cookies()
  const token = store.get(SESSION_COOKIE)?.value
  if (token) db.prepare("DELETE FROM sessions WHERE id = ?").run(token)
  store.delete(SESSION_COOKIE)
  store.delete(BUDGET_COOKIE)
}

export const getUser = cache(async (): Promise<User | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value
  if (!token) return null
  const row = db
    .prepare(
      `SELECT u.id, u.email, u.name FROM sessions s JOIN users u ON u.id = s.user_id
       WHERE s.id = ? AND s.expires_at > ?`,
    )
    .get(token, new Date().toISOString()) as User | undefined
  return row ?? null
})

export async function requireUser() {
  const user = await getUser()
  if (!user) redirect("/login")
  return user
}

export function budgetsOf(userId: string) {
  return db
    .prepare(
      `SELECT b.id, b.name, b.currency, m.role FROM budget_members m JOIN budgets b ON b.id = m.budget_id
       WHERE m.user_id = ? ORDER BY m.joined_at`,
    )
    .all(userId) as (Budget & { role: Member["role"] })[]
}

export function membersOf(budgetId: string) {
  return db
    .prepare(
      `SELECT u.id, u.email, u.name, m.role FROM budget_members m JOIN users u ON u.id = m.user_id
       WHERE m.budget_id = ? ORDER BY m.joined_at`,
    )
    .all(budgetId) as Member[]
}

export type Context = { user: User; budget: Budget; role: Member["role"]; members: Member[] }

// The signed-in user plus the budget they are looking at. Every query and
// mutation is scoped by `budget.id`, which is only ever taken from here.
export const requireContext = cache(async (): Promise<Context> => {
  const user = await requireUser()
  let budgets = budgetsOf(user.id)
  if (budgets.length === 0) {
    createBudget(user.id, "Наш бюджет")
    budgets = budgetsOf(user.id)
  }
  const preferred = (await cookies()).get(BUDGET_COOKIE)?.value
  const current = budgets.find((b) => b.id === preferred) ?? budgets[0]
  const { role, ...budget } = current
  return { user, budget, role, members: membersOf(budget.id) }
})
