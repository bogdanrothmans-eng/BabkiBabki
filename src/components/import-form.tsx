"use client"

import { AlertTriangleIcon, CheckCircle2Icon, UploadIcon } from "lucide-react"
import { useActionState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { importSheetAction, type ImportState } from "@/lib/actions/budget"
import { formatMoney } from "@/lib/money"
import { MONTHS } from "@/lib/period"
import { plural } from "@/lib/plural"

export function ImportForm() {
  const [state, action, pending] = useActionState<ImportState, FormData>(importSheetAction, undefined)

  return (
    <div className="flex flex-col gap-4">
      <ol className="list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
        <li>Откройте таблицу и перейдите на лист со статистикой по месяцам.</li>
        <li>Файл → Скачать → «Значения, разделённые запятыми (.csv)».</li>
        <li>Выберите файл и год. Каждая заполненная ячейка станет записью на 1-е число месяца.</li>
      </ol>
      <form action={action} className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="grid flex-1 gap-2">
          <Label htmlFor="import-file">CSV-файл</Label>
          <Input id="import-file" name="file" type="file" accept=".csv,text/csv" required />
        </div>
        <div className="grid gap-2 sm:w-28">
          <Label htmlFor="import-year">Год</Label>
          <Input id="import-year" name="year" type="number" inputMode="numeric" defaultValue={new Date().getFullYear()} min={2000} max={2100} required />
        </div>
        <Button type="submit" disabled={pending}>
          <UploadIcon />
          {pending ? "Импортируем…" : "Импортировать"}
        </Button>
      </form>

      {state && !state.ok && <p className="text-sm text-destructive">{state.error}</p>}
      {state?.ok && (
        <div className="flex flex-col gap-3 rounded-lg border p-4 text-sm">
          <p className="flex items-start gap-2">
            <CheckCircle2Icon className="mt-0.5 size-4 shrink-0 text-income" />
            <span>
              Перенесли {state.result.imported} {plural(state.result.imported, ["сумму", "суммы", "сумм"])} на{" "}
              <b>{formatMoney(state.result.total)}</b> за {state.result.months.map((m) => MONTHS[m - 1]).join(", ")}{" "}
              {state.year}. Повторный импорт этого года заменит эти записи, а не задвоит их.
            </span>
          </p>
          {state.result.createdCategories.length > 0 && (
            <p className="text-muted-foreground">Новые категории: {state.result.createdCategories.join(", ")}.</p>
          )}
          {state.result.issues.map((issue, i) => (
            <p key={i} className="flex items-start gap-2">
              <AlertTriangleIcon className="mt-0.5 size-4 shrink-0 text-amber-600" />
              <span>
                {issue.type === "text-number" &&
                  `«${issue.category}», ${MONTHS[issue.month - 1]}: «${issue.raw}» записано с пробелом — Google Таблица считает это текстом и не включает в итог. Мы учли эту сумму.`}
                {issue.type === "total-mismatch" &&
                  `${MONTHS[issue.month - 1][0].toUpperCase()}${MONTHS[issue.month - 1].slice(1)}: в таблице итог ${formatMoney(issue.reported)}, а по ячейкам выходит ${formatMoney(issue.computed)}.`}
                {issue.type === "unparsed" && `«${issue.category}», ${MONTHS[issue.month - 1]}: не поняли значение «${issue.raw}», пропустили.`}
              </span>
            </p>
          ))}
        </div>
      )}
    </div>
  )
}
