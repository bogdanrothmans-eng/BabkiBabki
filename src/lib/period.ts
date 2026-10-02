// A period is encoded in the URL as ?p=2026-07 (month), ?p=2026 (year)
// or ?p=2026-07-01_2026-07-15 (custom range, inclusive).

export type Period = {
  kind: "month" | "year" | "range"
  from: string // YYYY-MM-DD inclusive
  to: string // YYYY-MM-DD inclusive
  key: string
}

export const MONTHS = [
  "январь", "февраль", "март", "апрель", "май", "июнь",
  "июль", "август", "сентябрь", "октябрь", "ноябрь", "декабрь",
]
const MONTHS_GENITIVE = [
  "января", "февраля", "марта", "апреля", "мая", "июня",
  "июля", "августа", "сентября", "октября", "ноября", "декабря",
]
export const MONTHS_SHORT = [
  "янв", "фев", "мар", "апр", "май", "июн", "июл", "авг", "сен", "окт", "ноя", "дек",
]

const pad = (n: number) => String(n).padStart(2, "0")

export function isoDate(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function parseIso(s: string) {
  const [y, m, d] = s.split("-").map(Number)
  return new Date(y, m - 1, d)
}

function lastDayOfMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate()
}

export function monthPeriod(year: number, month: number): Period {
  return {
    kind: "month",
    from: `${year}-${pad(month)}-01`,
    to: `${year}-${pad(month)}-${pad(lastDayOfMonth(year, month))}`,
    key: `${year}-${pad(month)}`,
  }
}

export function yearPeriod(year: number): Period {
  return { kind: "year", from: `${year}-01-01`, to: `${year}-12-31`, key: String(year) }
}

export function rangePeriod(from: string, to: string): Period {
  if (from > to) [from, to] = [to, from]
  return { kind: "range", from, to, key: `${from}_${to}` }
}

export function parsePeriod(p: string | undefined, today = new Date()): Period {
  if (p) {
    let m = /^(\d{4})-(\d{2})$/.exec(p)
    if (m && +m[2] >= 1 && +m[2] <= 12) return monthPeriod(+m[1], +m[2])
    m = /^(\d{4})$/.exec(p)
    if (m) return yearPeriod(+m[1])
    m = /^(\d{4}-\d{2}-\d{2})_(\d{4}-\d{2}-\d{2})$/.exec(p)
    if (m && !isNaN(parseIso(m[1]).getTime()) && !isNaN(parseIso(m[2]).getTime())) {
      return rangePeriod(m[1], m[2])
    }
  }
  return monthPeriod(today.getFullYear(), today.getMonth() + 1)
}

export function shiftPeriod(period: Period, step: 1 | -1): Period {
  const from = parseIso(period.from)
  if (period.kind === "month") {
    const d = new Date(from.getFullYear(), from.getMonth() + step, 1)
    return monthPeriod(d.getFullYear(), d.getMonth() + 1)
  }
  if (period.kind === "year") return yearPeriod(from.getFullYear() + step)
  const days = Math.round((parseIso(period.to).getTime() - from.getTime()) / 86400000) + 1
  const start = new Date(from)
  start.setDate(start.getDate() + step * days)
  const end = new Date(start)
  end.setDate(end.getDate() + days - 1)
  return rangePeriod(isoDate(start), isoDate(end))
}

export function periodLabel(period: Period) {
  const from = parseIso(period.from)
  if (period.kind === "month") {
    const name = MONTHS[from.getMonth()]
    return `${name[0].toUpperCase()}${name.slice(1)} ${from.getFullYear()}`
  }
  if (period.kind === "year") return `${from.getFullYear()} год`
  return `${formatDay(period.from)} — ${formatDay(period.to, true)}`
}

// "в июле", "в 2026 году", "за период" — used in sentences under the total.
export function periodPreposition(period: Period) {
  const from = parseIso(period.from)
  if (period.kind === "month") return `в ${MONTHS_PREPOSITIONAL[from.getMonth()]}`
  if (period.kind === "year") return `в ${from.getFullYear()} году`
  return "за период"
}
const MONTHS_PREPOSITIONAL = [
  "январе", "феврале", "марте", "апреле", "мае", "июне",
  "июле", "августе", "сентябре", "октябре", "ноябре", "декабре",
]

export function formatDay(iso: string, withYear = false) {
  const d = parseIso(iso)
  const base = `${d.getDate()} ${MONTHS_GENITIVE[d.getMonth()]}`
  return withYear ? `${base} ${d.getFullYear()}` : base
}

export function relativeDayLabel(iso: string, today = new Date()) {
  const t = isoDate(today)
  const y = new Date(today)
  y.setDate(y.getDate() - 1)
  if (iso === t) return "Сегодня"
  if (iso === isoDate(y)) return "Вчера"
  const d = parseIso(iso)
  const weekday = d.toLocaleDateString("ru-RU", { weekday: "short" })
  return `${formatDay(iso, d.getFullYear() !== today.getFullYear())}, ${weekday}`
}
