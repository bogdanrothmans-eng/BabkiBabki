import { describe, expect, it } from "vitest"

import { parsePeriod, periodLabel, shiftPeriod } from "./period"

const today = new Date(2026, 9, 2)

describe("parsePeriod", () => {
  it("defaults to the current month", () => {
    expect(parsePeriod(undefined, today)).toMatchObject({ kind: "month", from: "2026-10-01", to: "2026-10-31" })
  })

  it("parses months, years and ranges", () => {
    expect(parsePeriod("2026-02", today)).toMatchObject({ from: "2026-02-01", to: "2026-02-28" })
    expect(parsePeriod("2026", today)).toMatchObject({ kind: "year", from: "2026-01-01", to: "2026-12-31" })
    expect(parsePeriod("2026-07-15_2026-07-01", today)).toMatchObject({ from: "2026-07-01", to: "2026-07-15" })
  })

  it("falls back on garbage", () => {
    expect(parsePeriod("2026-13", today).key).toBe("2026-10")
    expect(parsePeriod("lol", today).key).toBe("2026-10")
  })
})

describe("shiftPeriod", () => {
  it("moves months across year boundaries", () => {
    expect(shiftPeriod(parsePeriod("2026-01"), -1).key).toBe("2025-12")
    expect(shiftPeriod(parsePeriod("2026-12"), 1).key).toBe("2027-01")
  })

  it("moves ranges by their own length", () => {
    expect(shiftPeriod(parsePeriod("2026-07-01_2026-07-10"), 1).key).toBe("2026-07-11_2026-07-20")
  })
})

describe("periodLabel", () => {
  it("reads naturally in Russian", () => {
    expect(periodLabel(parsePeriod("2026-07"))).toBe("Июль 2026")
    expect(periodLabel(parsePeriod("2026"))).toBe("2026 год")
    expect(periodLabel(parsePeriod("2026-07-01_2026-07-10"))).toBe("1 июля — 10 июля 2026")
  })
})
