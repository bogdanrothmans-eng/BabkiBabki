// The add sheet's calculator keypad: "3845+1200" typed key by key, the way
// YNAB and GoPay let people sum a receipt without leaving the form.

import { formatAmountInput, toInputValue } from "./money"
import { evalAmount } from "./quick-entry"

export type Key = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "000" | "," | "+" | "-" | "back" | "="

const MAX_DIGITS = 9

function lastTerm(raw: string) {
  return raw.split(/[+-]/).pop() ?? ""
}

export function pressKey(raw: string, key: Key): string {
  const term = lastTerm(raw)
  const endsWithOperator = /[+-]$/.test(raw)
  switch (key) {
    case "back":
      return raw.slice(0, -1)
    case "+":
    case "-":
      if (!raw) return raw
      return endsWithOperator ? raw.slice(0, -1) + key : raw + key
    case "=": {
      const total = evalAmount(raw.replace(/[+-]$/, ""))
      return total ? toInputValue(total) : raw
    }
    case ",":
      if (term.includes(",")) return raw
      return raw + (term ? "," : "0,")
    default: {
      const [int, frac] = term.split(",")
      if (frac !== undefined) return frac.length >= 2 || key === "000" ? raw : raw + key
      if (key === "000" && !int) return raw
      if (int === "0") return raw.slice(0, -1) + (key === "000" ? "0" : key)
      if (int.length + key.length > MAX_DIGITS) return raw
      return raw + key
    }
  }
}

// Desktop keeps a real input: drop what the keypad could not have typed.
export function sanitizeExpression(value: string) {
  return value
    .replace(/[\s  ]/g, "")
    .replace(/−/g, "-")
    .replace(/\./g, ",")
    .replace(/[^\d,+-]/g, "")
    .replace(/^[+-]+/, "")
    .replace(/([+-])[+-]+/g, "$1")
}

// "125000+3845,5" → "125 000 + 3 845,5"
export function formatExpression(raw: string) {
  return raw
    .split(/([+-])/)
    .map((part) => (part === "+" ? " + " : part === "-" ? " − " : formatAmountInput(part)))
    .join("")
}

// What the save button should show while the user is mid-expression.
export function expressionTotal(raw: string) {
  return evalAmount(raw.replace(/[+-]$/, ""))
}
