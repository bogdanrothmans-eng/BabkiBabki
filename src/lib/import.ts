import "server-only"

import { db, id, transaction } from "./db"
import { listCategories } from "./queries"
import { guessEmoji, matchCategory, parseSheet, type SheetIssue } from "./sheet-import"

export type ImportResult = {
  imported: number
  total: number
  months: number[]
  createdCategories: string[]
  issues: SheetIssue[]
}

// Each filled cell becomes one entry on the 1st of its month. Re-importing the
// same year replaces the previous import instead of doubling it.
export function importSheet(budgetId: string, userId: string, text: string, year: number): ImportResult {
  const sheet = parseSheet(text)
  const categories = listCategories(budgetId, { includeArchived: true }).filter((c) => c.kind === "expense")
  const byName = new Map(categories.map((c) => [c.name, c.id]))
  const createdCategories: string[] = []

  return transaction(() => {
    db.prepare(
      "DELETE FROM transactions WHERE budget_id = ? AND source = 'sheet' AND date BETWEEN ? AND ?",
    ).run(budgetId, `${year}-01-01`, `${year}-12-31`)

    const resolved = new Map<string, { categoryId: string; note: string }>()
    const insertCategory = db.prepare(
      "INSERT INTO categories (id, budget_id, name, emoji, kind, sort) VALUES (?, ?, ?, ?, 'expense', ?)",
    )
    for (const name of sheet.categories) {
      const match = matchCategory(name, [...byName.keys()])
      if (match) {
        resolved.set(name, { categoryId: byName.get(match.existing)!, note: match.note })
        continue
      }
      const categoryId = id()
      insertCategory.run(categoryId, budgetId, name, guessEmoji(name), byName.size)
      byName.set(name, categoryId)
      createdCategories.push(name)
      resolved.set(name, { categoryId, note: "" })
    }

    const insert = db.prepare(
      `INSERT INTO transactions (id, budget_id, category_id, kind, amount, date, note, created_by, source)
       VALUES (?, ?, ?, 'expense', ?, ?, ?, ?, 'sheet')`,
    )
    for (const cell of sheet.cells) {
      const { categoryId, note } = resolved.get(cell.category)!
      const date = `${year}-${String(cell.month).padStart(2, "0")}-01`
      insert.run(id(), budgetId, categoryId, cell.amount, date, note ? `Из таблицы · ${note}` : "Из таблицы", userId)
    }

    return {
      imported: sheet.cells.length,
      total: sheet.cells.reduce((s, c) => s + c.amount, 0),
      months: [...new Set(sheet.cells.map((c) => c.month))].sort((a, b) => a - b),
      createdCategories,
      issues: sheet.issues,
    }
  })
}
