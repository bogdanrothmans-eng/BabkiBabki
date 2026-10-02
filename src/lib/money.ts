// Amounts are stored as integer kopecks to avoid float drift.

const rub = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 })
const rubPrecise = new Intl.NumberFormat("ru-RU", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export function formatMoney(kopecks: number, opts: { sign?: boolean } = {}) {
  const abs = Math.abs(kopecks)
  const body = abs % 100 === 0 ? rub.format(abs / 100) : rubPrecise.format(abs / 100)
  const sign = kopecks < 0 ? "−" : opts.sign && kopecks > 0 ? "+" : ""
  return `${sign}${body} ₽`
}

// Accepts what people actually type or paste from a spreadsheet:
// "4 153", "4 153", "1234,50", "1.234,50", "350р", "12 429 ₽".
export function parseAmount(input: string): number | null {
  let s = input.replace(/[\s  ]/g, "").replace(/[₽рруб.]+$/i, "")
  if (!s) return null
  if (/^\d{1,3}(\.\d{3})+(,\d{1,2})?$/.test(s)) s = s.replace(/\./g, "")
  s = s.replace(",", ".")
  if (!/^\d+(\.\d{1,2})?$/.test(s)) return null
  const kopecks = Math.round(Number(s) * 100)
  return kopecks > 0 ? kopecks : null
}

export function toInputValue(kopecks: number) {
  return kopecks % 100 === 0 ? String(kopecks / 100) : (kopecks / 100).toFixed(2).replace(".", ",")
}
