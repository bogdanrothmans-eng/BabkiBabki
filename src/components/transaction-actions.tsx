"use client"

import { PencilIcon, Trash2Icon } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { toast } from "sonner"

import { ResponsiveDialog } from "@/components/responsive-dialog"
import { type CategoryOption, type MemberOption, type TransactionDraft, TransactionForm } from "@/components/transaction-form"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { deleteTransaction } from "@/lib/actions/transactions"

export function TransactionActions({
  draft,
  categories,
  members,
  currentUserId,
}: {
  draft: TransactionDraft & { id: string }
  categories: CategoryOption[]
  members: MemberOption[]
  currentUserId: string
}) {
  const [editing, setEditing] = useState(false)
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  return (
    <div className="flex gap-2">
      <Button variant="outline" onClick={() => setEditing(true)}>
        <PencilIcon aria-hidden />
        Изменить
      </Button>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="ghost" className="text-destructive hover:text-destructive">
            <Trash2Icon aria-hidden />
            Удалить
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить запись?</AlertDialogTitle>
            <AlertDialogDescription>Вместе с ней удалятся комментарии и фото. Это нельзя отменить.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              disabled={pending}
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() =>
                startTransition(async () => {
                  await deleteTransaction(draft.id)
                  toast.success("Запись удалена")
                  router.push(`/transactions?p=${draft.date?.slice(0, 7) ?? ""}`)
                })
              }
            >
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <ResponsiveDialog open={editing} onOpenChange={setEditing} title="Изменить запись">
        <TransactionForm
          categories={categories}
          members={members}
          currentUserId={currentUserId}
          initial={draft}
          onSaved={() => setEditing(false)}
        />
      </ResponsiveDialog>
    </div>
  )
}
