"use client"

import { Share2Icon, UsersIcon } from "lucide-react"
import { useTransition } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { createInvite } from "@/lib/actions/budget"

export async function shareInvite(token: string) {
  const url = `${window.location.origin}/invite/${token}`
  if (navigator.share) {
    try {
      await navigator.share({ title: "Бабки", text: "Присоединяйся к нашему бюджету", url })
      return
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return
    }
  }
  try {
    await navigator.clipboard.writeText(url)
    toast.success("Ссылка скопирована — отправьте её партнёру")
  } catch {
    // Clipboard is unavailable on plain http or without permission: show the link instead.
    toast("Отправьте эту ссылку партнёру", { description: url, duration: 30000 })
  }
}

// The product is built for two; until the partner joins this is the most
// useful next step, so the overview leads with it (Monarch, DoorDash pattern).
export function InviteBanner() {
  const [pending, startTransition] = useTransition()
  return (
    <section
      aria-labelledby="invite-title"
      className="flex flex-col gap-3 rounded-2xl border border-primary/30 bg-accent p-4 sm:flex-row sm:items-center"
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
        <UsersIcon className="size-5" aria-hidden />
      </span>
      <div className="flex-1">
        <h2 id="invite-title" className="font-semibold">
          Пригласите партнёра
        </h2>
        <p className="text-sm text-muted-foreground">
          Вдвоём вы будете вносить траты в один бюджет, комментировать их и прикладывать чеки.
        </p>
      </div>
      <Button
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const token = await createInvite()
            await shareInvite(token)
          })
        }
      >
        {pending ? <Spinner /> : <Share2Icon aria-hidden />}
        Отправить ссылку
      </Button>
    </section>
  )
}
