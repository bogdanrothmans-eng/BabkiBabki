"use client"

import { CopyIcon, LinkIcon, Share2Icon, XIcon } from "lucide-react"
import { useTransition } from "react"
import { toast } from "sonner"

import { shareInvite } from "@/components/invite-banner"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { createInvite, revokeInvite } from "@/lib/actions/budget"
import { formatDay } from "@/lib/period"

// Pending invites sit in the member list (Monarch), sharing goes through the
// system share sheet on phones and the clipboard elsewhere (DoorDash, Splitwise).
export function InvitePanel({ invites }: { invites: { token: string; expires_at: string }[] }) {
  const [pending, startTransition] = useTransition()

  async function copy(token: string) {
    await navigator.clipboard.writeText(`${window.location.origin}/invite/${token}`)
    toast.success("Ссылка скопирована")
  }

  return (
    <>
      {invites.map((i) => (
        <li key={i.token} className="flex min-h-16 items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-dashed text-muted-foreground">
            <LinkIcon className="size-4" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-base md:text-sm">Ожидает приглашённого</p>
            <p className="text-sm text-muted-foreground md:text-xs">
              Одноразовая ссылка, действует до {formatDay(i.expires_at.slice(0, 10))}
            </p>
          </div>
          <Button variant="ghost" size="icon" aria-label="Поделиться ссылкой" onClick={() => shareInvite(i.token)}>
            <Share2Icon aria-hidden />
          </Button>
          <Button variant="ghost" size="icon" aria-label="Скопировать ссылку" onClick={() => copy(i.token)}>
            <CopyIcon aria-hidden />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Отозвать приглашение"
            onClick={() =>
              startTransition(async () => {
                await revokeInvite(i.token)
                toast.success("Приглашение отозвано")
              })
            }
          >
            <XIcon aria-hidden />
          </Button>
        </li>
      ))}
      <li className="pt-1">
        <Button
          variant={invites.length ? "outline" : "default"}
          className="w-full sm:w-auto"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const token = await createInvite()
              await shareInvite(token)
            })
          }
        >
          {pending ? <Spinner /> : <Share2Icon aria-hidden />}
          {invites.length ? "Новая ссылка-приглашение" : "Пригласить по ссылке"}
        </Button>
      </li>
    </>
  )
}
