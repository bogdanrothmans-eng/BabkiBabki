import { describe, expect, it } from "vitest"

import { formatAmountInput, formatMoney, parseAmount, toInputValue } from "./money"

describe("parseAmount", () => {
  it.each([
    ["350", 35000],
    ["4 153", 415300],
    ["4 153", 415300],
    ["1234,5", 123450],
    ["1.234,50", 123450],
    ["12.99", 1299],
    ["350р", 35000],
    ["12 429 ₽", 1242900],
  ])("%s → %d", (input, expected) => {
    expect(parseAmount(input)).toBe(expected)
  })

  it.each(["", "abc", "0", "-5", "1,234,5"])("rejects %j", (input) => {
    expect(parseAmount(input)).toBeNull()
  })
})

describe("formatMoney", () => {
  it("drops kopecks for whole rubles and groups thousands", () => {
    expect(formatMoney(4882000).replace(/\s/g, " ")).toBe("48 820 ₽")
    expect(formatMoney(123450).replace(/\s/g, " ")).toBe("1 234,50 ₽")
    expect(formatMoney(-5000)).toBe("−50 ₽")
    expect(formatMoney(5000, { sign: true })).toBe("+50 ₽")
  })

  it("round-trips through the input format", () => {
    expect(parseAmount(toInputValue(123450))).toBe(123450)
    expect(toInputValue(35000)).toBe("350")
  })
})

describe("formatAmountInput", () => {
  it.each([
    ["125000", "125 000"],
    ["1250,5", "1 250,5"],
    ["12.99", "12,99"],
    ["1,2345", "1,23"],
    ["007", "7"],
    ["abc350р", "350"],
    ["", ""],
  ])("%j → %j", (raw, shown) => {
    expect(formatAmountInput(raw)).toBe(shown)
  })

  it("stays parseable", () => {
    expect(parseAmount(formatAmountInput("125000,5"))).toBe(12500050)
  })
})
