"use client"

import { SearchIcon } from "lucide-react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"

import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

const ALL = "all"

export function TransactionFilters({
  categories,
  members,
}: {
  categories: { id: string; name: string; kind: string }[]
  members: { id: string; name: string }[]
}) {
  const params = useSearchParams()
  const pathname = usePathname()
  const router = useRouter()
  const [q, setQ] = useState(params.get("q") ?? "")

  function update(key: string, value: string) {
    const next = new URLSearchParams(params)
    if (value && value !== ALL) next.set(key, value)
    else next.delete(key)
    if (key === "kind") next.delete("category")
    router.replace(`${pathname}?${next}`, { scroll: false })
  }

  useEffect(() => {
    if (q === (params.get("q") ?? "")) return
    const t = setTimeout(() => update("q", q.trim()), 300)
    return () => clearTimeout(t)
  }, [q]) // eslint-disable-line react-hooks/exhaustive-deps

  const kind = params.get("kind") ?? ALL
  const visible = categories.filter((c) => kind === ALL || c.kind === kind)

  return (
    <div className="flex flex-col gap-2 md:flex-row md:items-center">
      <Tabs value={kind} onValueChange={(v) => update("kind", v)}>
        <TabsList className="w-full md:w-fit">
          <TabsTrigger value={ALL}>Все</TabsTrigger>
          <TabsTrigger value="expense">Расходы</TabsTrigger>
          <TabsTrigger value="income">Доходы</TabsTrigger>
        </TabsList>
      </Tabs>
      <div className="grid grid-cols-2 gap-2 md:flex md:flex-1">
        <Select value={params.get("category") ?? ALL} onValueChange={(v) => update("category", v)}>
          <SelectTrigger className="w-full md:w-52" aria-label="Категория">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Все категории</SelectItem>
            {visible.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {members.length > 1 && (
          <Select value={params.get("member") ?? ALL} onValueChange={(v) => update("member", v)}>
            <SelectTrigger className="w-full md:w-40" aria-label="Кто">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Все участники</SelectItem>
              {members.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <div className="relative col-span-2 md:ml-auto md:w-72">
          <SearchIcon aria-hidden className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Поиск по комментарию"
            aria-label="Поиск по комментарию и категории"
            className="pl-9"
            type="search"
            enterKeyHint="search"
          />
        </div>
      </div>
    </div>
  )
}
