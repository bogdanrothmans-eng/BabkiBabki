"use client"

import { CategoriesManager } from "@/components/categories-manager"

import { listCategories, useDemo } from "../../store"

export default function CategoriesPage() {
  const s = useDemo()
  if (!s) return null
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold">Категории</h1>
        <p className="text-sm text-muted-foreground">
          Общие для всех участников бюджета. Категории с записями уходят в архив, чтобы прошлые месяцы не поменялись.
        </p>
      </div>
      <CategoriesManager categories={listCategories(s, { includeArchived: true })} />
    </div>
  )
}
