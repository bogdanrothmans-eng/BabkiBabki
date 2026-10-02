// Parses the "categories × months" spreadsheet the couple keeps in Google Sheets
// (File → Download → CSV) into categories and monthly amounts.

import { parseAmount } from "./money"

export type SheetCell = { category: string; month: number; amount: number }

export type SheetIssue =
  | { type: "text-number"; category: string; month: number; raw: string }
  | { type: "total-mismatch"; month: number; reported: number; computed: number }
  | { type: "unparsed"; category: string; month: number; raw: string }

export type ParsedSheet = {
  categories: string[]
  cells: SheetCell[]
  monthTotals: Record<number, number>
  issues: SheetIssue[]
}

const MONTH_PREFIXES = ["янв", "фев", "мар", "апр", "май", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"]

export function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let cell = ""
  let quoted = false
  const src = text.replace(/^﻿/, "")
  for (let i = 0; i < src.length; i++) {
    const ch = src[i]
    if (quoted) {
      if (ch === '"' && src[i + 1] === '"') {
        cell += '"'
        i++
      } else if (ch === '"') quoted = false
      else cell += ch
    } else if (ch === '"') quoted = true
    else if (ch === ",") {
      row.push(cell)
      cell = ""
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && src[i + 1] === "\n") i++
      row.push(cell)
      rows.push(row)
      row = []
      cell = ""
    } else cell += ch
  }
  if (cell !== "" || row.length) {
    row.push(cell)
    rows.push(row)
  }
  return rows
}

function monthIndex(header: string) {
  const h = header.trim().toLowerCase()
  const i = MONTH_PREFIXES.findIndex((p) => h.startsWith(p))
  return i === -1 ? null : i + 1
}

export function parseSheet(text: string): ParsedSheet {
  const rows = parseCsv(text)
  const headerAt = rows.findIndex((r) => r.filter((c) => monthIndex(c) !== null).length >= 3)
  if (headerAt === -1) throw new Error("Не нашли строку с месяцами (январь, февраль, …)")

  const columns = new Map<number, number>() // column index → month
  rows[headerAt].forEach((c, i) => {
    const m = monthIndex(c)
    if (m !== null && i > 0) columns.set(i, m)
  })

  const categories: string[] = []
  const cells: SheetCell[] = []
  const issues: SheetIssue[] = []
  const reported: Record<number, number> = {}

  for (const row of rows.slice(headerAt + 1)) {
    const name = (row[0] ?? "").trim().replace(/\s+/g, " ")
    if (!name) continue
    if (/^итог/i.test(name)) {
      for (const [col, month] of columns) {
        const v = parseAmount(row[col] ?? "")
        if (v !== null) reported[month] = v
      }
      break
    }
    if (!categories.includes(name)) categories.push(name)
    for (const [col, month] of columns) {
      const raw = (row[col] ?? "").trim()
      if (!raw) continue
      const amount = parseAmount(raw)
      if (amount === null) {
        issues.push({ type: "unparsed", category: name, month, raw })
        continue
      }
      // A space inside a number makes Google Sheets store it as text,
      // so SUM() silently skips it.
      if (/\d[\s ]\d/.test(raw)) issues.push({ type: "text-number", category: name, month, raw })
      cells.push({ category: name, month, amount })
    }
  }

  const monthTotals: Record<number, number> = {}
  for (const c of cells) monthTotals[c.month] = (monthTotals[c.month] ?? 0) + c.amount
  for (const [m, value] of Object.entries(reported)) {
    const month = Number(m)
    const computed = monthTotals[month] ?? 0
    if (value !== computed) issues.push({ type: "total-mismatch", month, reported: value, computed })
  }

  return { categories, cells, monthTotals, issues }
}

function normalize(name: string) {
  return name
    .toLowerCase()
    .replace(/\(.*?\)/g, " ")
    .replace(/ё/g, "е")
    .replace(/[^a-zа-я0-9]+/g, " ")
    .split(" ")
    .filter((w) => w && w !== "и")
    .join(" ")
}

function distance(a: string, b: string) {
  const dp = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    let prev = dp[0]
    dp[0] = i
    for (let j = 1; j <= b.length; j++) {
      const tmp = dp[j]
      dp[j] = Math.min(dp[j] + 1, dp[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1))
      prev = tmp
    }
  }
  return dp[b.length]
}

export type CategoryMatch = { existing: string; note: string } | null

// Finds which existing category a spreadsheet row belongs to:
// "Чипсы Пиво" → "Чипсы и пиво", "Садоводчество" → "Садоводство",
// "Работа Миша" → "Работа" with the person kept as a note.
export function matchCategory(sheetName: string, existing: string[]): CategoryMatch {
  const target = normalize(sheetName)
  const normalized = existing.map(normalize)
  let i = normalized.indexOf(target)
  if (i !== -1) return { existing: existing[i], note: "" }
  i = normalized.findIndex((n) => n.length >= 6 && distance(n, target) <= 2)
  if (i !== -1) return { existing: existing[i], note: "" }
  i = normalized.findIndex((n) => target.startsWith(`${n} `) && target.split(" ").length === n.split(" ").length + 1)
  if (i !== -1) return { existing: existing[i], note: sheetName.trim().split(/\s+/).at(-1) ?? "" }
  return null
}
