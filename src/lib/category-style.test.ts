import { describe, expect, it } from "vitest"

import { CATEGORY_ICONS, guessCategoryStyle, isCategoryColor, isCategoryIcon } from "./category-style"
import { DEFAULT_EXPENSE_CATEGORIES, DEFAULT_INCOME_CATEGORIES } from "./default-categories"

describe("guessCategoryStyle", () => {
  it.each([
    ["Такси", "car-taxi-front"],
    ["Общественный транспорт", "tram-front"],
    ["Активности (зал, спорт, танцы)", "dumbbell"],
    ["Продукты питания", "shopping-cart"],
    ["Каршеринг", "key-round"],
  ])("%s → %s", (name, icon) => {
    expect(guessCategoryStyle(name).icon).toBe(icon)
  })

  it("falls back to neutral icons", () => {
    expect(guessCategoryStyle("Что-то новое")).toEqual({ icon: "circle-ellipsis", color: "slate" })
    expect(guessCategoryStyle("Наследство", "income")).toEqual({ icon: "coins", color: "green" })
  })

  it("gives every default category a real icon", () => {
    for (const name of DEFAULT_EXPENSE_CATEGORIES) {
      expect(guessCategoryStyle(name).icon, name).not.toBe("circle-ellipsis")
    }
    for (const name of DEFAULT_INCOME_CATEGORIES.slice(0, 3)) {
      expect(guessCategoryStyle(name, "income").icon, name).not.toBe("coins")
    }
  })
})

describe("validators", () => {
  it("accept only known keys", () => {
    expect(isCategoryIcon(CATEGORY_ICONS[0])).toBe(true)
    expect(isCategoryIcon("☕")).toBe(false)
    expect(isCategoryColor("teal")).toBe(true)
    expect(isCategoryColor("#ff0000")).toBe(false)
  })
})
