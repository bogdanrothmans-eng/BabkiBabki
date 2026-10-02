"use client"

import { CameraIcon, FileTextIcon, Trash2Icon } from "lucide-react"
import { useRef, useState, useTransition } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { deleteAttachment, uploadPhotos } from "@/lib/actions/transactions"
import { compressImage } from "@/lib/compress-image"
import type { Attachment } from "@/lib/queries"

export function PhotoGallery({ transactionId, attachments }: { transactionId: string; attachments: Attachment[] }) {
  const input = useRef<HTMLInputElement>(null)
  const [pending, startTransition] = useTransition()
  const [viewing, setViewing] = useState<Attachment | null>(null)

  function upload(files: FileList | null) {
    if (!files?.length) return
    startTransition(async () => {
      const form = new FormData()
      for (const f of Array.from(files)) form.append("photos", await compressImage(f))
      const result = await uploadPhotos(transactionId, form)
      if (result.error) toast.error(result.error)
      else toast.success("Фото добавлено")
    })
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {attachments.map((a) => (
          <button
            key={a.id}
            type="button"
            onClick={() => (a.mime === "application/pdf" ? window.open(`/files/${a.id}`, "_blank") : setViewing(a))}
            className="aspect-square overflow-hidden rounded-lg border bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
            aria-label={`Открыть ${a.file_name}`}
          >
            {a.mime.startsWith("image/") ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={`/files/${a.id}`} alt={a.file_name} loading="lazy" className="size-full object-cover" />
            ) : (
              <span className="flex size-full flex-col items-center justify-center gap-1 text-xs text-muted-foreground">
                <FileTextIcon className="size-6" />
                PDF
              </span>
            )}
          </button>
        ))}
        <Button
          type="button"
          variant="outline"
          disabled={pending}
          onClick={() => input.current?.click()}
          className="aspect-square h-auto flex-col gap-1 text-xs"
        >
          <CameraIcon className="size-5" />
          {pending ? "Загружаем…" : "Добавить"}
        </Button>
      </div>
      <input
        ref={input}
        type="file"
        accept="image/*,application/pdf"
        multiple
        hidden
        onChange={(e) => {
          upload(e.target.files)
          e.target.value = ""
        }}
      />
      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className="max-h-[95dvh] p-2 sm:max-w-3xl">
          <DialogTitle className="sr-only">{viewing?.file_name}</DialogTitle>
          <DialogDescription className="sr-only">Добавил(а) {viewing?.user_name}</DialogDescription>
          {viewing && (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/files/${viewing.id}`}
                alt={viewing.file_name}
                className="max-h-[80dvh] w-full rounded-md object-contain"
              />
              <div className="flex items-center justify-between px-2 pb-1 text-xs text-muted-foreground">
                <span>Добавил(а) {viewing.user_name ?? "—"}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    startTransition(async () => {
                      await deleteAttachment(viewing.id)
                      setViewing(null)
                      toast.success("Фото удалено")
                    })
                  }
                >
                  <Trash2Icon />
                  Удалить
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
