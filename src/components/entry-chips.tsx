"use client"

import { ru } from "date-fns/locale"
import { CalendarIcon, UserIcon } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { formatDay, isoDate, parseIso } from "@/lib/period"

// iOS-style filled chips: 44px tall for touch, 40px with a pointer.
export const CHIP = "h-11 rounded-full px-4 font-medium md:h-10 [&_svg]:text-muted-foreground"

export function useTodayYesterday() {
  const [days] = useState(() => {
    const now = new Date()
    const y = new Date(now)
    y.setDate(now.getDate() - 1)
    return { today: isoDate(now), yesterday: isoDate(y) }
  })
  return days
}

export function DateChip({ date, onChange, prefix = "" }: { date: string; onChange: (d: string) => void; prefix?: string }) {
  const { today, yesterday } = useTodayYesterday()
  const [open, setOpen] = useState(false)
  const day = date === today ? "Сегодня" : date === yesterday ? "Вчера" : formatDay(date, true)
  // "Все за сегодня", not "Все за Сегодня".
  const label = prefix ? day[0].toLocaleLowerCase("ru") + day.slice(1) : day
  const pick = (d: string) => {
    onChange(d)
    setOpen(false)
  }
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button type="button" variant="secondary" className={CHIP} aria-label={`${prefix}${label}. Сменить дату`}>
          <CalendarIcon aria-hidden />
          {prefix}
          {label}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto rounded-3xl p-0" align="start">
        <div className="flex gap-2 p-3 pb-0">
          <Button type="button" size="sm" variant={date === today ? "default" : "outline"} onClick={() => pick(today)}>
            Сегодня
          </Button>
          <Button type="button" size="sm" variant={date === yesterday ? "default" : "outline"} onClick={() => pick(yesterday)}>
            Вчера
          </Button>
        </div>
        <Calendar
          mode="single"
          locale={ru}
          selected={parseIso(date)}
          defaultMonth={parseIso(date)}
          onSelect={(d) => d && pick(isoDate(d))}
        />
      </PopoverContent>
    </Popover>
  )
}

// Two people → one tap swaps who paid. The accessible name starts with the
// visible text (WCAG 2.5.3 Label in Name).
export function PayerChip({
  members,
  memberId,
  onChange,
  kind,
}: {
  members: { id: string; name: string }[]
  memberId: string
  onChange: (id: string) => void
  kind: "expense" | "income"
}) {
  if (members.length < 2) return null
  const payer = members.find((m) => m.id === memberId) ?? members[0]
  const label = `${kind === "expense" ? "Платит" : "Получает"} ${payer.name}`
  return (
    <Button
      type="button"
      variant="secondary"
      className={CHIP}
      aria-label={`${label}. Нажмите, чтобы сменить`}
      onClick={() => {
        const i = members.findIndex((m) => m.id === payer.id)
        onChange(members[(i + 1) % members.length].id)
      }}
    >
      <UserIcon aria-hidden />
      {label}
    </Button>
  )
}
