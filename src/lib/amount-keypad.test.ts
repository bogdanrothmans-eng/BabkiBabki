import { describe, expect, it } from "vitest"

import { expressionTotal, formatExpression, type Key, pressKey, sanitizeExpression } from "./amount-keypad"

const type = (...keys: Key[]) => keys.reduce(pressKey, "")

describe("pressKey", () => {
  it("builds a sum key by key", () => {
    expect(type("3", "8", "4", "5", "+", "1", "2", "0", "0")).toBe("3845+1200")
  })

  it("ignores an operator before any digit and swaps a repeated one", () => {
    expect(type("+")).toBe("")
    expect(type("5", "+", "-")).toBe("5-")
  })

  it("keeps decimals to two places and starts them with a zero", () => {
    expect(type(",", "5")).toBe("0,5")
    expect(type("1", ",", "2", "3", "4")).toBe("1,23")
    expect(type("1", ",", ",")).toBe("1,")
  })

  it("replaces a lone leading zero and skips 000 on an empty term", () => {
    expect(type("0", "7")).toBe("7")
    expect(type("000")).toBe("")
    expect(type("1", "2", "000")).toBe("12000")
  })

  it("collapses the expression on =", () => {
    expect(type("1", "2", "0", "0", "-", "2", "0", "0", "=")).toBe("1000")
    expect(type("1", "0", ",", "5", "+", "1", "=")).toBe("11,50")
  })

  it("erases", () => {
    expect(type("1", "2", "back")).toBe("1")
  })
})

describe("formatting", () => {
  it("groups thousands in every term", () => {
    expect(formatExpression("125000+3845,5")).toBe("125 000 + 3 845,5")
    expect(formatExpression("1200-")).toBe("1 200 − ")
  })

  it("totals a half-typed expression", () => {
    expect(expressionTotal("1200+")).toBe(120000)
  })

  it("cleans what is typed on a real keyboard", () => {
    expect(sanitizeExpression("1 200.50 + 3р")).toBe("1200,50+3")
    expect(sanitizeExpression("+−5")).toBe("5")
  })
})
