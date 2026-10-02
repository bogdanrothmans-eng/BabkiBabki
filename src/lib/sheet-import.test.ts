import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"

import { matchCategory, parseCsv, parseSheet } from "./sheet-import"

const sample = fs.readFileSync(path.join(import.meta.dirname, "../../seed/sheet-sample.csv"), "utf8")

describe("parseSheet", () => {
  const sheet = parseSheet(sample)

  it("reads every category row up to the total line", () => {
    expect(sheet.categories).toHaveLength(38)
    expect(sheet.categories[0]).toBe("Продукты питания")
    expect(sheet.categories).toContain("Одежда, обувь и аксессуары")
    expect(sheet.categories).toContain("Работа Миша")
    expect(sheet.categories.at(-1)).toBe("Нежелательные траты + кредиты")
  })

  it("keeps amounts in kopecks and maps columns to months", () => {
    const food = sheet.cells.filter((c) => c.category === "Продукты питания")
    expect(food.map((c) => c.month)).toEqual([1, 6, 7])
    expect(food.every((c) => c.amount % 100 === 0)).toBe(true)
  })

  it("flags numbers typed with a space that SUM() ignores", () => {
    const textNumber = sheet.issues.find((i) => i.type === "text-number")
    expect(textNumber).toMatchObject({ category: "Активности (зал, спорт, танцы)", month: 1, raw: "4 603" })
    const mismatch = sheet.issues.find((i) => i.type === "total-mismatch")
    expect(mismatch).toMatchObject({ month: 1, reported: 5108900, computed: 5108900 + 460300 })
  })

  it("agrees with the sheet total where every cell is numeric", () => {
    expect(sheet.monthTotals[6]).toBe(8264000)
    expect(sheet.issues.some((i) => i.type === "total-mismatch" && i.month === 6)).toBe(false)
  })

  it("rejects files without a month header", () => {
    expect(() => parseSheet("a,b\n1,2")).toThrow(/месяц/)
  })
})

describe("parseCsv", () => {
  it("handles quoted commas, escaped quotes and CRLF", () => {
    expect(parseCsv('"a, b","say ""hi""",c\r\n1,2,3')).toEqual([
      ["a, b", 'say "hi"', "c"],
      ["1", "2", "3"],
    ])
  })
})

describe("matchCategory", () => {
  const existing = ["Чипсы и пиво", "Садоводство", "Работа", "Услуги (стрижка, юрист, маникюр)", "Развлечения и отдых", "Такси"]

  it.each([
    ["Чипсы Пиво", "Чипсы и пиво", ""],
    ["Садоводчество ", "Садоводство", ""],
    ["Работа Миша ", "Работа", "Миша"],
    ["Услуги (стрижка, юрист, маникюр и тд)", "Услуги (стрижка, юрист, маникюр)", ""],
    ["Развлечения и отдых (бани, спа, музеи)", "Развлечения и отдых", ""],
  ])("%s → %s", (name, match, note) => {
    expect(matchCategory(name, existing)).toEqual({ existing: match, note })
  })

  it("does not force unrelated rows into a category", () => {
    expect(matchCategory("Каршеринг", existing)).toBeNull()
    expect(matchCategory("Такси Москва Сити", existing)).toBeNull()
  })
})
