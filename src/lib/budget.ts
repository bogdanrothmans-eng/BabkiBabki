import "server-only"

import { db, id, transaction } from "./db"
import { guessEmoji } from "./sheet-import"

// The couple's own spreadsheet categories, with typos fixed and the two
// per-person "Работа <имя>" rows merged — who paid is tracked per entry instead.
export const DEFAULT_EXPENSE_CATEGORIES = [
  "Продукты питания",
  "Чипсы и пиво",
  "Сладости и кофе",
  "Фастфуд и суши",
  "Кафе и рестораны",
  "Аптеки",
  "Мелкие расходники для жизни",
  "Одежда, обувь и аксессуары",
  "Животные",
  "Бытовая химия",
  "Мелкие товары для дома",
  "Техника и мебель",
  "Электроника",
  "Строительство и ремонт",
  "ЖКХ",
  "Связь и интернет",
  "Садоводство",
  "Товары для взрослых",
  "Врачи",
  "Косметика",
  "Услуги (стрижка, юрист, маникюр)",
  "Активности (зал, спорт, танцы)",
  "Работа",
  "Образование",
  "Развлечения и отдых",
  "Путешествия",
  "Автомобиль",
  "Каршеринг",
  "Такси",
  "Общественный транспорт",
  "Детям",
  "Подарки",
  "Расходы на окружающих",
  "Благотворительность",
  "Налоги, штрафы, госпошлины",
  "Непредвиденные покупки",
  "Нежелательные траты и кредиты",
]

export const DEFAULT_INCOME_CATEGORIES = ["Зарплата", "Подработка", "Кэшбэк и проценты", "Другие доходы"]

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
      "INSERT INTO categories (id, budget_id, name, emoji, kind, sort) VALUES (?, ?, ?, ?, ?, ?)",
    )
    DEFAULT_EXPENSE_CATEGORIES.forEach((n, i) =>
      insert.run(id(), budgetId, n, guessEmoji(n), "expense", i),
    )
    DEFAULT_INCOME_CATEGORIES.forEach((n, i) =>
      insert.run(id(), budgetId, n, guessEmoji(n, "income"), "income", i),
    )
  })
  return budgetId
}
