import "server-only"

import { guessCategoryStyle } from "./category-style"
import { db, id, transaction } from "./db"
import { DEFAULT_EXPENSE_CATEGORIES, DEFAULT_INCOME_CATEGORIES } from "./default-categories"

export function createBudget(ownerId: string, name: string, withDefaults = true) {
  const budgetId = id()
  transaction(() => {
    db.prepare("INSERT INTO budgets (id, name) VALUES (?, ?)").run(budgetId, name)
    db.prepare("INSERT INTO budget_members (budget_id, user_id, role) VALUES (?, ?, 'owner')").run(
      budgetId,
      ownerId,
    )
    if (!withDefaults) return
    const insert = db.prepare(
      "INSERT INTO categories (id, budget_id, name, icon, color, kind, sort) VALUES (?, ?, ?, ?, ?, ?, ?)",
    )
    const add = (kind: "expense" | "income") => (name: string, sort: number) => {
      const style = guessCategoryStyle(name, kind)
      insert.run(id(), budgetId, name, style.icon, style.color, kind, sort)
    }
    DEFAULT_EXPENSE_CATEGORIES.forEach(add("expense"))
    DEFAULT_INCOME_CATEGORIES.forEach(add("income"))
  })
  return budgetId
}
