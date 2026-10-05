// Turns what people type or dictate into entries: "350 кофе",
// "пятёрочка 3845+1200", "+120000 зарплата", one per line for a whole week.

import { normalize } from "./sheet-import"

export type QuickEntry = {
  amount: number // kopecks
  kind: "expense" | "income"
  text: string // what is left after the amount, used as the note and for guessing
}

// "3845+1200" → 504500, "1200−200" → 100000, "350,50" → 35050, "12 429" (nbsp) → 1242900.
const TERM = String.raw`\d+(?:[.,]\d{1,2})?`
const EXPRESSION = new RegExp(`^${TERM}(?:[+-]${TERM})*$`)

export function evalAmount(expr: string): number | null {
  const s = expr.replace(/[\s\u00a0\u202f]/g, "").replace(/−/g, "-")
  if (!EXPRESSION.test(s)) return null
  let total = 0
  for (const [, sign, term] of s.matchAll(new RegExp(`([+-]?)(${TERM})`, "g"))) {
    total += (sign === "-" ? -1 : 1) * Math.round(Number(term.replace(",", ".")) * 100)
  }
  return total > 0 ? total : null
}

// An amount is a run of digits (thousands may be grouped with non-breaking
// spaces, as banks and spreadsheets copy them) optionally summed with "+".
const NUMBER = String.raw`\d+(?:[  ]\d{3})*(?:[.,]\d{1,2})?`
const AMOUNT = new RegExp(String.raw`(^|\s)(\+?)(${NUMBER}(?:\s*\+\s*${NUMBER})*)(?=[\s,;]|$|[₽р])`, "u")

export function parseQuickLine(line: string): QuickEntry | null {
  const source = line.trim()
  const m = AMOUNT.exec(source)
  if (!m) return null
  const amount = evalAmount(m[3])
  if (amount === null) return null
  const text = (source.slice(0, m.index) + " " + source.slice(m.index + m[0].length))
    .replace(/(^|\s)(₽|руб\.?|р\.?)(?=\s|$)/giu, " ")
    .replace(/^[₽р]\b/u, "")
    .replace(/\s+/g, " ")
    .replace(/\s+([,.;:])/g, "$1")
    .replace(/^[\s,.;:–—-]+|[\s,.;:–—-]+$/g, "")
  return { amount, kind: m[2] === "+" ? "income" : "expense", text }
}

export function parseQuickList(text: string) {
  return text
    .split(/\r?\n|;/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => ({ line, entry: parseQuickLine(line) }))
}

export type GuessCategory = { id: string; name: string; kind: "expense" | "income"; used: number }
export type HistoryItem = { note: string; category_id: string }

// Common words mapped to the default category names (src/lib/default-categories.ts).
const SYNONYMS: [RegExp, string][] = [
  [/пят[её]рочк|магнит|перекр[её]ст|ашан|лент|вкусвилл|дикси|глобус|самокат|продукт|еда|молок|хлеб|овощ|фрукт|рынок/i, "Продукты питания"],
  [/кофе|капучин|латте|раф|круассан|шоколад|конфет|торт|пирож|слад/i, "Сладости и кофе"],
  [/пиво|чипс|сидр/i, "Чипсы и пиво"],
  [/шаурм|бургер|макдон|вкусно и точка|kfc|ростикс|суши|роллы|пицц|фастфуд/i, "Фастфуд и суши"],
  [/кафе|ресторан|бар\b|ужин|обед|завтрак|кофейн/i, "Кафе и рестораны"],
  [/аптек|лекарств|таблет|витамин/i, "Аптеки"],
  [/такси|uber|яндекс go|ситимобил/i, "Такси"],
  [/метро|автобус|трамва|электричк|проезд|тройк/i, "Общественный транспорт"],
  [/каршеринг|делимобил|ситидрайв/i, "Каршеринг"],
  [/бензин|заправк|азс|парковк|мойк/i, "Автомобиль"],
  [/жкх|квартплат|коммунал|свет\b|электричеств|газ\b|вода\b|аренд/i, "ЖКХ"],
  [/интернет|мобильн|связь|телефон|симк/i, "Связь и интернет"],
  [/корм|ветеринар|наполнител|кот\b|кошк|собак|пёс|пес\b/i, "Животные"],
  [/одежд|обув|кроссовк|куртк|джинс|футболк|платье/i, "Одежда, обувь и аксессуары"],
  [/косметик|крем|шампун|помад|тушь/i, "Косметика"],
  [/стрижк|парикмахер|маникюр|педикюр|юрист|массаж/i, "Услуги (стрижка, юрист, маникюр)"],
  [/зал\b|фитнес|бассейн|йог|танц|тренир|спорт/i, "Активности (зал, спорт, танцы)"],
  [/кино|театр|музей|концерт|бан[яи]\b|спа\b|боулинг/i, "Развлечения и отдых"],
  [/билет|отель|гостиниц|авиа|поезд|отпуск/i, "Путешествия"],
  [/подар/i, "Подарки"],
  [/курс|книг|учеб|обучен/i, "Образование"],
  [/врач|стоматолог|анализ|клиник/i, "Врачи"],
  [/штраф|налог|пошлин/i, "Налоги, штрафы, госпошлины"],
  [/зарплат|аванс|оклад/i, "Зарплата"],
  [/подработ|фриланс|заказ/i, "Подработка"],
  [/кэшб[еэ]к|процент|вклад/i, "Кэшбэк и проценты"],
]

const words = (s: string) => normalize(s).split(" ").filter((w) => w.length >= 3)

// Best category for a note, in order of trust: what this couple chose for the
// same words before, then common synonyms, then the category's own name.
export function guessCategory(
  text: string,
  kind: "expense" | "income",
  categories: GuessCategory[],
  history: HistoryItem[] = [],
): GuessCategory | null {
  const options = categories.filter((c) => c.kind === kind)
  const byId = new Map(options.map((c) => [c.id, c]))
  const tokens = words(text)
  if (!tokens.length) return null

  const votes = new Map<string, number>()
  for (const h of history) {
    if (!byId.has(h.category_id)) continue
    const past = words(h.note)
    const shared = tokens.filter((t) => past.some((p) => p.startsWith(t.slice(0, 5)) || t.startsWith(p.slice(0, 5)))).length
    if (shared) votes.set(h.category_id, (votes.get(h.category_id) ?? 0) + shared)
  }
  const learned = [...votes].sort((a, b) => b[1] - a[1])[0]
  if (learned) return byId.get(learned[0])!

  const synonym = SYNONYMS.find(([re]) => re.test(text))
  if (synonym) {
    const target = normalize(synonym[1])
    const match = options.find((c) => normalize(c.name) === target)
    if (match) return match
  }

  // Shared word stems with the category name: "аптека" → "Аптеки".
  const scored = options
    .map((c) => {
      const name = words(c.name)
      const score = tokens.filter((t) => name.some((n) => n.slice(0, 4) === t.slice(0, 4))).length
      return { c, score }
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || b.c.used - a.c.used)
  return scored[0]?.c ?? null
}

// Reads like a note: "пятёрочка" → "Пятёрочка".
export function noteFrom(text: string) {
  return text ? text[0].toLocaleUpperCase("ru") + text.slice(1) : ""
}
