"use client"

import { CopyIcon, LinkIcon, Share2Icon, XIcon } from "lucide-react"
import { useState, useTransition } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createInvite, revokeInvite } from "@/lib/actions/budget"
import { formatDay } from "@/lib/period"

export function InvitePanel({ invites }: { invites: { token: string; expires_at: string }[] }) {
  const [pending, startTransition] = useTransition()
  const [fresh, setFresh] = useState<string | null>(null)
  const link = (token: string) => `${window.location.origin}/invite/${token}`

  async function copy(token: string) {
    await navigator.clipboard.writeText(link(token))
    toast.success("Ссылка скопирована")
  }

  async function share(token: string) {
    if (navigator.share) {
      await navigator.share({ title: "Бабки", text: "Присоединяйся к нашему бюджету", url: link(token) }).catch(() => {})
    } else await copy(token)
  }

  return (
    <div className="flex flex-col gap-3">
      <Button
        variant="outline"
        className="self-start"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const token = await createInvite()
            setFresh(token)
          })
        }
      >
        <LinkIcon />
        Пригласить по ссылке
      </Button>
      {invites.length > 0 && (
        <ul className="flex flex-col gap-2">
          {invites.map((i) => (
            <li key={i.token} className="flex flex-col gap-1">
              <div className="flex gap-2">
                <Input
                  readOnly
                  value={typeof window === "undefined" ? `/invite/${i.token}` : link(i.token)}
                  onFocus={(e) => e.target.select()}
                  className={fresh === i.token ? "border-primary" : undefined}
                  aria-label="Ссылка-приглашение"
                />
                <Button variant="outline" size="icon" aria-label="Скопировать" onClick={() => copy(i.token)}>
                  <CopyIcon />
                </Button>
                <Button variant="outline" size="icon" aria-label="Поделиться" onClick={() => share(i.token)}>
                  <Share2Icon />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Отозвать ссылку"
                  onClick={() => startTransition(() => revokeInvite(i.token))}
                >
                  <XIcon />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Одноразовая, действует до {formatDay(i.expires_at.slice(0, 10))}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
