import "server-only"

import { db } from "./db"
import type { TransactionFilter } from "./filter"
import { type Period, shiftPeriod } from "./period"

export type Kind = "expense" | "income"

export type Category = {
  id: string
  name: string
  icon: string
  color: string
  kind: Kind
  sort: number
  archived: number
  used: number
}

export function listCategories(budgetId: string, opts: { includeArchived?: boolean } = {}) {
  return db
    .prepare(
      `SELECT c.id, c.name, c.icon, c.color, c.kind, c.sort, c.archived,
              (SELECT COUNT(*) FROM transactions t WHERE t.category_id = c.id) AS used
       FROM categories c
       WHERE c.budget_id = ? ${opts.includeArchived ? "" : "AND c.archived = 0"}
       ORDER BY c.kind, c.archived, c.sort, c.name`,
    )
    .all(budgetId) as Category[]
}

export type TransactionRow = {
  id: string
  kind: Kind
  amount: number
  date: string
  note: string
  source: string
  category_id: string
  category_name: string
  category_icon: string
  category_color: string
  member_id: string | null
  member_name: string | null
  comments: number
  photos: number
}

const TRANSACTION_SELECT = `
  SELECT t.id, t.kind, t.amount, t.date, t.note, t.source, t.category_id,
         c.name AS category_name, c.icon AS category_icon, c.color AS category_color,
         t.member_id, u.name AS member_name,
         (SELECT COUNT(*) FROM comments x WHERE x.transaction_id = t.id) AS comments,
         (SELECT COUNT(*) FROM attachments a WHERE a.transaction_id = t.id) AS photos
  FROM transactions t
  JOIN categories c ON c.id = t.category_id
  LEFT JOIN users u ON u.id = t.member_id`

export type { TransactionFilter }

export function listTransactions(budgetId: string, period: Period, filter: TransactionFilter = {}) {
  const where = ["t.budget_id = ?", "t.date BETWEEN ? AND ?"]
  const args: (string | number)[] = [budgetId, period.from, period.to]
  if (filter.categoryId) {
    where.push("t.category_id = ?")
    args.push(filter.categoryId)
  }
  if (filter.memberId) {
    where.push("t.member_id = ?")
    args.push(filter.memberId)
  }
  if (filter.kind) {
    where.push("t.kind = ?")
    args.push(filter.kind)
  }
  if (filter.q) {
    where.push("(t.note LIKE ? OR c.name LIKE ?)")
    args.push(`%${filter.q}%`, `%${filter.q}%`)
  }
  args.push(filter.limit ?? 500)
  return db
    .prepare(
      `${TRANSACTION_SELECT} WHERE ${where.join(" AND ")}
       ORDER BY t.date DESC, t.created_at DESC LIMIT ?`,
    )
    .all(...args) as TransactionRow[]
}

function totals(budgetId: string, period: Period) {
  const row = db
    .prepare(
      `SELECT COALESCE(SUM(CASE WHEN kind = 'expense' THEN amount END), 0) AS expense,
              COALESCE(SUM(CASE WHEN kind = 'income' THEN amount END), 0) AS income,
              COUNT(*) AS count
       FROM transactions WHERE budget_id = ? AND date BETWEEN ? AND ?`,
    )
    .get(budgetId, period.from, period.to) as { expense: number; income: number; count: number }
  return row
}

export type Breakdown = {
  category_id: string
  name: string
  icon: string
  color: string
  total: number
  count: number
}

export function getSummary(budgetId: string, period: Period) {
  const current = totals(budgetId, period)
  const previous = totals(budgetId, shiftPeriod(period, -1))
  const byCategory = (kind: Kind) =>
    db
      .prepare(
        `SELECT c.id AS category_id, c.name, c.icon, c.color, SUM(t.amount) AS total, COUNT(*) AS count
         FROM transactions t JOIN categories c ON c.id = t.category_id
         WHERE t.budget_id = ? AND t.kind = ? AND t.date BETWEEN ? AND ?
         GROUP BY c.id ORDER BY total DESC`,
      )
      .all(budgetId, kind, period.from, period.to) as Breakdown[]
  const byMember = db
    .prepare(
      `SELECT t.member_id, u.name, SUM(t.amount) AS total
       FROM transactions t LEFT JOIN users u ON u.id = t.member_id
       WHERE t.budget_id = ? AND t.kind = 'expense' AND t.date BETWEEN ? AND ?
       GROUP BY t.member_id ORDER BY total DESC`,
    )
    .all(budgetId, period.from, period.to) as { member_id: string | null; name: string | null; total: number }[]

  return {
    ...current,
    previousExpense: previous.expense,
    expenses: byCategory("expense"),
    incomes: byCategory("income"),
    byMember,
  }
}

export type Summary = ReturnType<typeof getSummary>

export type Comment = { id: string; body: string; created_at: string; user_id: string | null; user_name: string | null }
export type Attachment = { id: string; file_name: string; mime: string; size: number; created_at: string; user_name: string | null }

export function getTransaction(budgetId: string, transactionId: string) {
  const row = db
    .prepare(`${TRANSACTION_SELECT} WHERE t.budget_id = ? AND t.id = ?`)
    .get(budgetId, transactionId) as (TransactionRow & { created_at: string; updated_at: string }) | undefined
  if (!row) return null
  const comments = db
    .prepare(
      `SELECT c.id, c.body, c.created_at, c.user_id, u.name AS user_name
       FROM comments c LEFT JOIN users u ON u.id = c.user_id
       WHERE c.transaction_id = ? ORDER BY c.created_at`,
    )
    .all(transactionId) as Comment[]
  const attachments = db
    .prepare(
      `SELECT a.id, a.file_name, a.mime, a.size, a.created_at, u.name AS user_name
       FROM attachments a LEFT JOIN users u ON u.id = a.user_id
       WHERE a.transaction_id = ? ORDER BY a.created_at`,
    )
    .all(transactionId) as Attachment[]
  return { ...row, comments, attachments }
}

export type Entry = NonNullable<ReturnType<typeof getTransaction>>

export type PivotRow = { id: string; name: string; icon: string; color: string; kind: Kind; months: number[]; total: number }

// Same shape as the couple's spreadsheet: categories down, months across.
export function getYearPivot(budgetId: string, year: number) {
  const cells = db
    .prepare(
      `SELECT category_id, CAST(substr(date, 6, 2) AS INTEGER) AS month, SUM(amount) AS total
       FROM transactions WHERE budget_id = ? AND date BETWEEN ? AND ?
       GROUP BY category_id, month`,
    )
    .all(budgetId, `${year}-01-01`, `${year}-12-31`) as { category_id: string; month: number; total: number }[]

  const categories = listCategories(budgetId, { includeArchived: true })
  const archived = new Set(categories.filter((c) => c.archived).map((c) => c.id))
  const rows = new Map<string, PivotRow>()
  for (const c of categories) {
    rows.set(c.id, { id: c.id, name: c.name, icon: c.icon, color: c.color, kind: c.kind, months: Array(12).fill(0), total: 0 })
  }
  for (const cell of cells) {
    const row = rows.get(cell.category_id)
    if (!row) continue
    row.months[cell.month - 1] += cell.total
    row.total += cell.total
  }
  const visible = [...rows.values()].filter((r) => !archived.has(r.id) || r.total > 0)
  const monthTotals = (kind: Kind) =>
    Array.from({ length: 12 }, (_, m) => visible.filter((r) => r.kind === kind).reduce((s, r) => s + r.months[m], 0))
  return {
    expense: visible.filter((r) => r.kind === "expense"),
    income: visible.filter((r) => r.kind === "income"),
    expenseTotals: monthTotals("expense"),
    incomeTotals: monthTotals("income"),
  }
}

export type YearPivot = ReturnType<typeof getYearPivot>

export function listInvites(budgetId: string) {
  return db
    .prepare(
      `SELECT token, created_at, expires_at FROM invites
       WHERE budget_id = ? AND used_at IS NULL AND expires_at > ? ORDER BY created_at DESC`,
    )
    .all(budgetId, new Date().toISOString()) as { token: string; created_at: string; expires_at: string }[]
}
