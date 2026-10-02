import type { Metadata } from "next"

import { CategoriesManager } from "@/components/categories-manager"
import { requireContext } from "@/lib/auth"
import { listCategories } from "@/lib/queries"

export const metadata: Metadata = { title: "Категории" }

export default async function CategoriesPage() {
  const { budget } = await requireContext()
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold">Категории</h1>
        <p className="text-sm text-muted-foreground">
          Общие для всех участников бюджета. Категории с записями уходят в архив, чтобы прошлые месяцы не поменялись.
        </p>
      </div>
      <CategoriesManager categories={listCategories(budget.id, { includeArchived: true })} />
    </div>
  )
}
