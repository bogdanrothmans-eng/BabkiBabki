"use client"

// The GitHub Pages demo has no server: the whole budget lives in
// localStorage and these functions mirror src/lib/queries.ts in plain JS.

import { useSyncExternalStore } from "react"

import { guessCategoryStyle } from "@/lib/category-style"
import { DEFAULT_EXPENSE_CATEGORIES, DEFAULT_INCOME_CATEGORIES } from "@/lib/default-categories"
import type { TransactionFilter } from "@/lib/filter"
import { isoDate, type Period, shiftPeriod } from "@/lib/period"
import type {
  Attachment,
  Breakdown,
  Category,
  Comment,
  Entry,
  Kind,
  Summary,
  TransactionRow,
  YearPivot,
} from "@/lib/queries"
import { matchCategory, parseSheet, type SheetIssue } from "@/lib/sheet-import"

import { SAMPLE_SHEET } from "./seed-sheet"

export type DemoMember = { id: string; name: string; email: string; role: "owner" | "member" }
type DemoCategory = Omit<Category, "used">
type DemoTransaction = {
  id: string
  category_id: string
  kind: Kind
  amount: number
  date: string
  note: string
  member_id: string | null
  created_by: string
  source: "manual" | "sheet"
  created_at: string
  updated_at: string
}
type DemoComment = { id: string; transaction_id: string; user_id: string; body: string; created_at: string }
type DemoAttachment = {
  id: string
  transaction_id: string
  user_id: string
  file_name: string
  mime: string
  size: number
  created_at: string
  data: string
}

export type DemoState = {
  currentUserId: string
  budget: { id: string; name: string }
  members: DemoMember[]
  categories: DemoCategory[]
  transactions: DemoTransaction[]
  comments: DemoComment[]
  attachments: DemoAttachment[]
}

const KEY = "babki-demo-v1"
const ANYA = "demo-anya"
const MISHA = "demo-misha"

export const id = () => crypto.randomUUID()
// Same "YYYY-MM-DD HH:MM:SS" UTC format SQLite's datetime('now') produces.
export const now = () => new Date().toISOString().replace("T", " ").slice(0, 19)

export type ImportResult = {
  imported: number
  total: number
  months: number[]
  createdCategories: string[]
  issues: SheetIssue[]
}

// Same rules as src/lib/import.ts: one entry per filled cell on the 1st of
// the month, re-importing a year replaces that year's previous import.
export function importInto(s: DemoState, text: string, year: number, userId: string): ImportResult {
  const sheet = parseSheet(text)
  const from = `${year}-01-01`
  const to = `${year}-12-31`
  s.transactions = s.transactions.filter((t) => !(t.source === "sheet" && t.date >= from && t.date <= to))

  const byName = new Map(s.categories.filter((c) => c.kind === "expense").map((c) => [c.name, c.id]))
  const resolved = new Map<string, { categoryId: string; note: string }>()
  const createdCategories: string[] = []
  for (const name of sheet.categories) {
    const match = matchCategory(name, [...byName.keys()])
    if (match) {
      resolved.set(name, { categoryId: byName.get(match.existing)!, note: match.note })
      continue
    }
    const categoryId = id()
    s.categories.push({ id: categoryId, name, ...guessCategoryStyle(name), kind: "expense", sort: byName.size, archived: 0 })
    byName.set(name, categoryId)
    createdCategories.push(name)
    resolved.set(name, { categoryId, note: "" })
  }

  const stamp = now()
  for (const cell of sheet.cells) {
    const { categoryId, note } = resolved.get(cell.category)!
    s.transactions.push({
      id: id(),
      category_id: categoryId,
      kind: "expense",
      amount: cell.amount,
      date: `${year}-${String(cell.month).padStart(2, "0")}-01`,
      note: note ? `Из таблицы · ${note}` : "Из таблицы",
      member_id: null,
      created_by: userId,
      source: "sheet",
      created_at: stamp,
      updated_at: stamp,
    })
  }
  return {
    imported: sheet.cells.length,
    total: sheet.cells.reduce((sum, c) => sum + c.amount, 0),
    months: [...new Set(sheet.cells.map((c) => c.month))].sort((a, b) => a - b),
    createdCategories,
    issues: sheet.issues,
  }
}

function seed(): DemoState {
  const s: DemoState = {
    currentUserId: ANYA,
    budget: { id: "demo-budget", name: "Аня и Миша" },
    members: [
      { id: ANYA, name: "Аня", email: "anya@example.com", role: "owner" },
      { id: MISHA, name: "Миша", email: "misha@example.com", role: "member" },
    ],
    categories: [],
    transactions: [],
    comments: [],
    attachments: [],
  }
  const add = (kind: Kind) => (name: string, sort: number) =>
    s.categories.push({ id: id(), name, ...guessCategoryStyle(name, kind), kind, sort, archived: 0 })
  DEFAULT_EXPENSE_CATEGORIES.forEach(add("expense"))
  DEFAULT_INCOME_CATEGORIES.forEach(add("income"))

  importInto(s, SAMPLE_SHEET, new Date().getFullYear(), ANYA)

  const category = (name: string) => s.categories.find((c) => c.name === name)!.id
  const daysAgo = (n: number) => {
    const d = new Date()
    d.setDate(d.getDate() - n)
    return isoDate(d)
  }
  const entries: [string, Kind, number, number, string, string][] = [
    ["Зарплата", "income", 12000000, 2, "Аванс", ANYA],
    ["Зарплата", "income", 9500000, 1, "", MISHA],
    ["Продукты питания", "expense", 384500, 0, "Пятёрочка на неделю", MISHA],
    ["Сладости и кофе", "expense", 42000, 0, "Капучино и круассан", ANYA],
    ["Такси", "expense", 61200, 1, "До аэропорта", ANYA],
    ["Животные", "expense", 289000, 1, "Корм и наполнитель коту", MISHA],
    ["ЖКХ", "expense", 731000, 2, "Квартплата", ANYA],
    ["Кафе и рестораны", "expense", 456000, 3, "Ужин с друзьями", MISHA],
    ["Аптеки", "expense", 128900, 4, "", ANYA],
    ["Связь и интернет", "expense", 65000, 5, "Домашний интернет", MISHA],
    ["Продукты питания", "expense", 215600, 6, "ВкусВилл", ANYA],
    ["Одежда, обувь и аксессуары", "expense", 549000, 8, "Кроссовки", MISHA],
  ]
  const ids = entries.map(([cat, kind, amount, ago, note, who]) => {
    const tid = id()
    const stamp = now()
    s.transactions.push({
      id: tid,
      category_id: category(cat),
      kind,
      amount,
      date: daysAgo(ago),
      note,
      member_id: who,
      created_by: who,
      source: "manual",
      created_at: stamp,
      updated_at: stamp,
    })
    return tid
  })
  s.comments.push(
    { id: id(), transaction_id: ids[7], user_id: ANYA, body: "Это за всех или только за нас двоих?", created_at: now() },
    { id: id(), transaction_id: ids[7], user_id: MISHA, body: "За нас, друзья скинули мне переводом 👍", created_at: now() },
    { id: id(), transaction_id: ids[5], user_id: ANYA, body: "Взял большой мешок? Тогда до конца месяца хватит", created_at: now() },
  )
  return s
}

let state: DemoState | null = null
const listeners = new Set<() => void>()

function load(): DemoState {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw) as DemoState
  } catch {
    // Private mode or corrupted data: start from the demo seed.
  }
  return seed()
}

export function getState(): DemoState {
  state ??= load()
  return state
}

function persist(next: DemoState) {
  localStorage.setItem(KEY, JSON.stringify(next))
}

export class StorageFullError extends Error {}

// Applies a change to a copy, saves it and notifies subscribers. Throws
// StorageFullError when the browser refuses to store more (photos are big).
export function update<T>(change: (draft: DemoState) => T): T {
  const draft = structuredClone(getState())
  const result = change(draft)
  try {
    persist(draft)
  } catch {
    throw new StorageFullError("В демо закончилось место в браузере — удалите пару фото или сбросьте демо")
  }
  state = draft
  listeners.forEach((l) => l())
  return result
}

export function resetDemo() {
  state = seed()
  try {
    persist(state)
  } catch {
    // Nothing to do: the demo still works in memory.
  }
  listeners.forEach((l) => l())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  const onStorage = (e: StorageEvent) => {
    if (e.key !== KEY) return
    state = null
    listener()
  }
  window.addEventListener("storage", onStorage)
  return () => {
    listeners.delete(listener)
    window.removeEventListener("storage", onStorage)
  }
}

// null during prerender and hydration, the live state afterwards.
export function useDemo(): DemoState | null {
  return useSyncExternalStore(subscribe, getState, () => null)
}

export function currentUser(s: DemoState) {
  return s.members.find((m) => m.id === s.currentUserId) ?? s.members[0]
}

const memberName = (s: DemoState, userId: string | null) => s.members.find((m) => m.id === userId)?.name ?? null

export function listCategories(s: DemoState, opts: { includeArchived?: boolean } = {}): Category[] {
  return s.categories
    .filter((c) => opts.includeArchived || !c.archived)
    .map((c) => ({ ...c, used: s.transactions.filter((t) => t.category_id === c.id).length }))
    .sort(
      (a, b) =>
        a.kind.localeCompare(b.kind) || a.archived - b.archived || a.sort - b.sort || a.name.localeCompare(b.name, "ru"),
    )
}

function toRow(s: DemoState, t: DemoTransaction): TransactionRow {
  const c = s.categories.find((x) => x.id === t.category_id)!
  return {
    id: t.id,
    kind: t.kind,
    amount: t.amount,
    date: t.date,
    note: t.note,
    source: t.source,
    category_id: c.id,
    category_name: c.name,
    category_icon: c.icon,
    category_color: c.color,
    member_id: t.member_id,
    member_name: memberName(s, t.member_id),
    comments: s.comments.filter((x) => x.transaction_id === t.id).length,
    photos: s.attachments.filter((x) => x.transaction_id === t.id).length,
  }
}

const inPeriod = (t: DemoTransaction, p: Period) => t.date >= p.from && t.date <= p.to

export function listTransactions(s: DemoState, period: Period, filter: TransactionFilter = {}): TransactionRow[] {
  const q = filter.q?.toLocaleLowerCase("ru")
  return s.transactions
    .filter((t) => inPeriod(t, period))
    .filter((t) => !filter.categoryId || t.category_id === filter.categoryId)
    .filter((t) => !filter.memberId || t.member_id === filter.memberId)
    .filter((t) => !filter.kind || t.kind === filter.kind)
    .map((t) => toRow(s, t))
    .filter((r) => !q || r.note.toLocaleLowerCase("ru").includes(q) || r.category_name.toLocaleLowerCase("ru").includes(q))
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, filter.limit ?? 500)
}

export function getSummary(s: DemoState, period: Period): Summary {
  const total = (p: Period, kind: Kind) =>
    s.transactions.filter((t) => t.kind === kind && inPeriod(t, p)).reduce((sum, t) => sum + t.amount, 0)
  const current = s.transactions.filter((t) => inPeriod(t, period))
  const byCategory = (kind: Kind): Breakdown[] => {
    const map = new Map<string, Breakdown>()
    for (const t of current.filter((x) => x.kind === kind)) {
      const c = s.categories.find((x) => x.id === t.category_id)!
      const row = map.get(c.id) ?? { category_id: c.id, name: c.name, icon: c.icon, color: c.color, total: 0, count: 0 }
      row.total += t.amount
      row.count++
      map.set(c.id, row)
    }
    return [...map.values()].sort((a, b) => b.total - a.total)
  }
  const byMember = new Map<string | null, number>()
  for (const t of current.filter((x) => x.kind === "expense")) {
    byMember.set(t.member_id, (byMember.get(t.member_id) ?? 0) + t.amount)
  }
  return {
    expense: total(period, "expense"),
    income: total(period, "income"),
    count: current.length,
    previousExpense: total(shiftPeriod(period, -1), "expense"),
    expenses: byCategory("expense"),
    incomes: byCategory("income"),
    byMember: [...byMember]
      .map(([member_id, sum]) => ({ member_id, name: memberName(s, member_id), total: sum }))
      .sort((a, b) => b.total - a.total),
  }
}

export function getEntry(s: DemoState, entryId: string): Entry | null {
  const t = s.transactions.find((x) => x.id === entryId)
  if (!t) return null
  const comments: Comment[] = s.comments
    .filter((c) => c.transaction_id === entryId)
    .map((c) => ({ id: c.id, body: c.body, created_at: c.created_at, user_id: c.user_id, user_name: memberName(s, c.user_id) }))
  const attachments: Attachment[] = s.attachments
    .filter((a) => a.transaction_id === entryId)
    .map((a) => ({
      id: a.id,
      file_name: a.file_name,
      mime: a.mime,
      size: a.size,
      created_at: a.created_at,
      user_name: memberName(s, a.user_id),
    }))
  return { ...toRow(s, t), created_at: t.created_at, updated_at: t.updated_at, comments, attachments }
}

export function getYearPivot(s: DemoState, year: number): YearPivot {
  const categories = listCategories(s, { includeArchived: true })
  const archived = new Set(categories.filter((c) => c.archived).map((c) => c.id))
  const rows = categories.map((c) => ({
    id: c.id,
    name: c.name,
    icon: c.icon,
    color: c.color,
    kind: c.kind,
    months: Array<number>(12).fill(0),
    total: 0,
  }))
  for (const t of s.transactions) {
    if (!t.date.startsWith(`${year}-`)) continue
    const row = rows.find((r) => r.id === t.category_id)
    if (!row) continue
    row.months[Number(t.date.slice(5, 7)) - 1] += t.amount
    row.total += t.amount
  }
  const visible = rows.filter((r) => !archived.has(r.id) || r.total > 0)
  const totals = (kind: Kind) =>
    Array.from({ length: 12 }, (_, m) => visible.filter((r) => r.kind === kind).reduce((sum, r) => sum + r.months[m], 0))
  return {
    expense: visible.filter((r) => r.kind === "expense"),
    income: visible.filter((r) => r.kind === "income"),
    expenseTotals: totals("expense"),
    incomeTotals: totals("income"),
  }
}

export function attachmentData(attachmentId: string) {
  return getState().attachments.find((a) => a.id === attachmentId)?.data
}
