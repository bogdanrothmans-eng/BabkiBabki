"use client"

import { CameraIcon, FileTextIcon, Trash2Icon } from "lucide-react"
import { useRef, useState, useTransition } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { deleteAttachment, uploadPhotos } from "@/lib/actions/transactions"
import { compressImage } from "@/lib/compress-image"
import type { Attachment } from "@/lib/queries"
import { fileUrl } from "@/lib/routes"

export function PhotoGallery({ transactionId, attachments }: { transactionId: string; attachments: Attachment[] }) {
  const input = useRef<HTMLInputElement>(null)
  const [pending, startTransition] = useTransition()
  const [viewing, setViewing] = useState<Attachment | null>(null)
  const [confirming, setConfirming] = useState(false)

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
            onClick={() => (a.mime === "application/pdf" ? window.open(fileUrl(a.id), "_blank") : setViewing(a))}
            className="aspect-square overflow-hidden rounded-lg border bg-muted transition-opacity duration-150 hover:opacity-90 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
            aria-label={`Открыть ${a.file_name}`}
          >
            {a.mime.startsWith("image/") ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={fileUrl(a.id)} alt={a.file_name} loading="lazy" width={160} height={160} className="size-full object-cover" />
            ) : (
              <span className="flex size-full flex-col items-center justify-center gap-1 text-xs text-muted-foreground">
                <FileTextIcon className="size-6" aria-hidden />
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
          {pending ? <Spinner className="size-5" /> : <CameraIcon className="size-5" aria-hidden />}
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
      <Dialog
        open={!!viewing}
        onOpenChange={(o) => {
          if (o) return
          setViewing(null)
          setConfirming(false)
        }}
      >
        <DialogContent className="max-h-[95dvh] p-2 sm:max-w-3xl">
          <DialogTitle className="sr-only">{viewing?.file_name}</DialogTitle>
          <DialogDescription className="sr-only">Добавил(а) {viewing?.user_name}</DialogDescription>
          {viewing && (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={fileUrl(viewing.id)}
                alt={viewing.file_name}
                className="max-h-[80dvh] w-full rounded-md object-contain"
              />
              <div className="flex flex-wrap items-center justify-between gap-2 px-2 pb-1 text-sm text-muted-foreground">
                <span>Добавил(а) {viewing.user_name ?? "—"}</span>
                {confirming ? (
                  <span className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setConfirming(false)}>
                      Отмена
                    </Button>
                    <Button
                      size="sm"
                      disabled={pending}
                      className="bg-destructive text-white hover:bg-destructive/90"
                      onClick={() =>
                        startTransition(async () => {
                          await deleteAttachment(viewing.id)
                          setViewing(null)
                          setConfirming(false)
                          toast.success("Фото удалено")
                        })
                      }
                    >
                      Удалить фото
                    </Button>
                  </span>
                ) : (
                  <Button variant="ghost" size="sm" onClick={() => setConfirming(true)}>
                    <Trash2Icon aria-hidden />
                    Удалить
                  </Button>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
