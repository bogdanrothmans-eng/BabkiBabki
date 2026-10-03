// Demo data: two partners sharing one budget, history imported from the
// spreadsheet, plus a few fresh entries with comments.
//   npm run seed                      → uses seed/sheet-sample.csv (anonymized)
//   npm run seed -- data/import/x.csv → your own export
import fs from "node:fs"

import { createUser, findUserByEmail } from "@/lib/users"
import { createBudget } from "@/lib/budget"
import { db, id } from "@/lib/db"
import { importSheet } from "@/lib/import"
import { isoDate } from "@/lib/period"

const csvPath = process.argv[2] ?? "seed/sheet-sample.csv"
const year = Number(process.argv[3] ?? 2026)
const PASSWORD = "babki123"

if (findUserByEmail("anya@example.com")) {
  console.log("Demo users already exist — delete data/babki.db to reseed.")
  process.exit(0)
}

const anya = createUser("anya@example.com", "Аня", PASSWORD)
const misha = createUser("misha@example.com", "Миша", PASSWORD)
const budgetId = createBudget(anya, "Аня и Миша")
db.prepare("INSERT INTO budget_members (budget_id, user_id, role) VALUES (?, ?, 'member')").run(budgetId, misha)

const result = importSheet(budgetId, anya, fs.readFileSync(csvPath, "utf8"), year)
console.log(`Imported ${result.imported} cells from ${csvPath}; issues: ${result.issues.length}`)

const category = (name: string) =>
  (db.prepare("SELECT id FROM categories WHERE budget_id = ? AND name = ?").get(budgetId, name) as { id: string }).id

const daysAgo = (n: number) => isoDate(new Date(Date.now() - n * 86400000))
const entries: [string, "expense" | "income", number, number, string, string][] = [
  // The last sitting was five days ago, so the catch-up card shows up.
  ["Зарплата", "income", 12000000, 7, "Аванс", anya],
  ["Зарплата", "income", 9500000, 6, "", misha],
  ["Продукты питания", "expense", 384500, 5, "Пятёрочка на неделю", misha],
  ["Сладости и кофе", "expense", 42000, 5, "Капучино и круассан", anya],
  ["Такси", "expense", 61200, 6, "До аэропорта", anya],
  ["Животные", "expense", 289000, 6, "Корм и наполнитель коту", misha],
  ["ЖКХ", "expense", 731000, 7, "Квартплата за сентябрь", anya],
  ["Кафе и рестораны", "expense", 456000, 8, "Ужин с друзьями", misha],
  ["Аптеки", "expense", 128900, 9, "", anya],
  ["Связь и интернет", "expense", 65000, 10, "Домашний интернет", misha],
  ["Продукты питания", "expense", 215600, 11, "ВкусВилл", anya],
  ["Одежда, обувь и аксессуары", "expense", 549000, 13, "Кроссовки", misha],
]
const insert = db.prepare(
  `INSERT INTO transactions (id, budget_id, category_id, kind, amount, date, note, member_id, created_by)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
)
const ids = entries.map(([cat, kind, amount, ago, note, who]) => {
  const tid = id()
  insert.run(tid, budgetId, category(cat), kind, amount, daysAgo(ago), note, who, who)
  return tid
})

const comment = db.prepare("INSERT INTO comments (id, transaction_id, user_id, body, created_at) VALUES (?, ?, ?, ?, ?)")
comment.run(id(), ids[7], anya, "Это за всех или только за нас двоих?", "2026-09-29 19:02:00")
comment.run(id(), ids[7], misha, "За нас, Лёша с Катей скинули мне переводом 👍", "2026-09-29 19:15:00")
comment.run(id(), ids[5], anya, "Взял большой мешок? Тогда до конца месяца хватит", "2026-10-01 09:30:00")

console.log(`Done. Log in as anya@example.com or misha@example.com, password: ${PASSWORD}`)
