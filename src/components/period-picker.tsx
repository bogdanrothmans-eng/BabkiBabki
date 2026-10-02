"use client"

import { ru } from "date-fns/locale"
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useState } from "react"
import type { DateRange } from "react-day-picker"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  isoDate,
  MONTHS_SHORT,
  monthPeriod,
  parseIso,
  type Period,
  periodLabel,
  rangePeriod,
  shiftPeriod,
  yearPeriod,
} from "@/lib/period"
import { cn } from "@/lib/utils"

export function PeriodPicker({ period }: { period: Period }) {
  const pathname = usePathname()
  const params = useSearchParams()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const from = parseIso(period.from)
  const [year, setYear] = useState(from.getFullYear())
  const [range, setRange] = useState<DateRange | undefined>({ from, to: parseIso(period.to) })
  const now = new Date()

  function href(next: Period) {
    const q = new URLSearchParams(params)
    q.set("p", next.key)
    return `${pathname}?${q}`
  }

  function go(next: Period) {
    setOpen(false)
    router.push(href(next))
  }

  return (
    <div className="flex items-center gap-1">
      <Button asChild variant="ghost" size="icon" aria-label="Предыдущий период">
        <Link href={href(shiftPeriod(period, -1))} scroll={false}>
          <ChevronLeftIcon />
        </Link>
      </Button>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="min-w-40 font-medium">
            {periodLabel(period)}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-3" align="center">
          <Tabs defaultValue={period.kind}>
            <TabsList className="w-full">
              <TabsTrigger value="month">Месяц</TabsTrigger>
              <TabsTrigger value="year">Год</TabsTrigger>
              <TabsTrigger value="range">Период</TabsTrigger>
            </TabsList>

            <TabsContent value="month" className="mt-3 w-64">
              <div className="mb-2 flex items-center justify-between">
                <Button variant="ghost" size="icon-sm" onClick={() => setYear(year - 1)} aria-label="Предыдущий год">
                  <ChevronLeftIcon />
                </Button>
                <span className="text-sm font-medium">{year}</span>
                <Button variant="ghost" size="icon-sm" onClick={() => setYear(year + 1)} aria-label="Следующий год">
                  <ChevronRightIcon />
                </Button>
              </div>
              <div className="grid grid-cols-3 gap-1">
                {MONTHS_SHORT.map((m, i) => {
                  const p = monthPeriod(year, i + 1)
                  const isCurrent = year === now.getFullYear() && i === now.getMonth()
                  return (
                    <Button
                      key={m}
                      size="sm"
                      variant={p.key === period.key ? "default" : "ghost"}
                      className={cn("capitalize", isCurrent && p.key !== period.key && "underline underline-offset-4")}
                      onClick={() => go(p)}
                    >
                      {m}
                    </Button>
                  )
                })}
              </div>
            </TabsContent>

            <TabsContent value="year" className="mt-3 grid w-64 grid-cols-3 gap-1">
              {Array.from({ length: 6 }, (_, i) => now.getFullYear() - 4 + i).map((y) => (
                <Button
                  key={y}
                  size="sm"
                  variant={period.kind === "year" && from.getFullYear() === y ? "default" : "ghost"}
                  onClick={() => go(yearPeriod(y))}
                >
                  {y}
                </Button>
              ))}
            </TabsContent>

            <TabsContent value="range" className="mt-1">
              <Calendar
                mode="range"
                locale={ru}
                selected={range}
                onSelect={setRange}
                defaultMonth={from}
                className="p-0 pt-2"
              />
              <Button
                className="mt-2 w-full"
                disabled={!range?.from}
                onClick={() => range?.from && go(rangePeriod(isoDate(range.from), isoDate(range.to ?? range.from)))}
              >
                Показать
              </Button>
            </TabsContent>
          </Tabs>
        </PopoverContent>
      </Popover>
      <Button asChild variant="ghost" size="icon" aria-label="Следующий период">
        <Link href={href(shiftPeriod(period, 1))} scroll={false}>
          <ChevronRightIcon />
        </Link>
      </Button>
    </div>
  )
}
