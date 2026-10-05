import { describe, expect, it } from "vitest"

import { DEFAULT_EXPENSE_CATEGORIES, DEFAULT_INCOME_CATEGORIES } from "./default-categories"
import { evalAmount, type GuessCategory, guessCategory, parseQuickLine, parseQuickList } from "./quick-entry"

describe("evalAmount", () => {
  it.each([
    ["350", 35000],
    ["3845+1200", 504500],
    ["350,50", 35050],
    ["12\u00a0429", 1242900],
    ["100 + 50", 15000],
    ["1200−200", 100000],
    ["1200-200+50,5", 105050],
  ])("%j → %d", (expr, kopecks) => expect(evalAmount(expr)).toBe(kopecks))

  it("rejects junk", () => {
    expect(evalAmount("3845+")).toBeNull()
    expect(evalAmount("abc")).toBeNull()
    expect(evalAmount("100-100")).toBeNull()
    expect(evalAmount("-100")).toBeNull()
  })
})

describe("parseQuickLine", () => {
  it.each([
    ["350 кофе", { amount: 35000, kind: "expense", text: "кофе" }],
    ["кофе 350", { amount: 35000, kind: "expense", text: "кофе" }],
    ["пятёрочка 3845+1200", { amount: 504500, kind: "expense", text: "пятёрочка" }],
    ["+120000 зарплата", { amount: 12000000, kind: "income", text: "зарплата" }],
    ["350р кофе", { amount: 35000, kind: "expense", text: "кофе" }],
    ["такси до аэропорта 612 ₽", { amount: 61200, kind: "expense", text: "такси до аэропорта" }],
    ["кофе 350, круассан", { amount: 35000, kind: "expense", text: "кофе, круассан" }],
    ["500", { amount: 50000, kind: "expense", text: "" }],
  ])("%j", (line, expected) => expect(parseQuickLine(line)).toEqual(expected))

  it("needs an amount", () => {
    expect(parseQuickLine("просто кофе")).toBeNull()
    expect(parseQuickLine("")).toBeNull()
  })
})

describe("parseQuickList", () => {
  it("splits lines and keeps the ones it could not read", () => {
    const rows = parseQuickList("пятёрочка 3845\nтакси 612\n\nкорм коту")
    expect(rows.map((r) => r.entry?.amount ?? null)).toEqual([384500, 61200, null])
    expect(rows[2].line).toBe("корм коту")
  })
})

describe("guessCategory", () => {
  const categories: GuessCategory[] = [
    ...DEFAULT_EXPENSE_CATEGORIES.map((name, i) => ({ id: `e${i}`, name, kind: "expense" as const, used: 0 })),
    ...DEFAULT_INCOME_CATEGORIES.map((name, i) => ({ id: `i${i}`, name, kind: "income" as const, used: 0 })),
  ]
  const name = (text: string, kind: "expense" | "income" = "expense", history = []) =>
    guessCategory(text, kind, categories, history)?.name ?? null

  it.each([
    ["пятёрочка", "Продукты питания"],
    ["кофе", "Сладости и кофе"],
    ["такси до аэропорта", "Такси"],
    ["корм коту", "Животные"],
    ["квартплата", "ЖКХ"],
    ["аптека", "Аптеки"],
    ["подарок маме", "Подарки"],
  ])("%s → %s", (text, expected) => expect(name(text)).toBe(expected))

  it("uses the couple's own history first", () => {
    const history = [{ note: "Бургер Кинг", category_id: "e4" }] // Кафе и рестораны, not fast food
    expect(guessCategory("бургер кинг", "expense", categories, history)?.name).toBe("Кафе и рестораны")
  })

  it("only offers categories of the right kind", () => {
    expect(name("зарплата", "income")).toBe("Зарплата")
    expect(name("зарплата", "expense")).toBeNull()
  })

  it("admits when it has no idea", () => {
    expect(name("что-то непонятное")).toBeNull()
    expect(name("")).toBeNull()
  })
})
