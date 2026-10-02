"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { renameBudget } from "@/lib/actions/budget"

export function BudgetNameForm({ name }: { name: string }) {
  const [value, setValue] = useState(name)
  const [pending, startTransition] = useTransition()
  return (
    <form
      className="flex gap-2"
      onSubmit={(e) => {
        e.preventDefault()
        startTransition(async () => {
          await renameBudget(value)
          toast.success("Название сохранено")
        })
      }}
    >
      <Input value={value} onChange={(e) => setValue(e.target.value)} maxLength={60} aria-label="Название бюджета" />
      <Button type="submit" variant="outline" disabled={pending || !value.trim() || value === name}>
        {pending && <Spinner />}
        Сохранить
      </Button>
    </form>
  )
}
