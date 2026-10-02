"use client"

import { SendIcon, XIcon } from "lucide-react"
import { useRef, useState, useTransition } from "react"

import { MemberAvatar } from "@/components/member-avatars"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { addComment, deleteComment } from "@/lib/actions/transactions"
import type { Comment } from "@/lib/queries"

function when(sqlite: string) {
  const d = new Date(`${sqlite.replace(" ", "T")}Z`)
  return d.toLocaleString("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
}

export function CommentThread({
  transactionId,
  comments,
  currentUserId,
}: {
  transactionId: string
  comments: Comment[]
  currentUserId: string
}) {
  const [body, setBody] = useState("")
  const [pending, startTransition] = useTransition()
  const form = useRef<HTMLFormElement>(null)

  function send() {
    const text = body.trim()
    if (!text) return
    startTransition(async () => {
      await addComment(transactionId, text)
      setBody("")
    })
  }

  return (
    <div className="flex flex-col gap-4">
      {comments.length > 0 && (
        <ul className="flex flex-col gap-3">
          {comments.map((c) => (
            <li key={c.id} className="group flex gap-2">
              <MemberAvatar name={c.user_name} className="size-8 border-0" />
              <div className="min-w-0 flex-1 rounded-xl bg-muted px-3 py-2">
                <div className="flex items-baseline justify-between gap-2 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">{c.user_name ?? "Удалённый участник"}</span>
                  <span suppressHydrationWarning>{when(c.created_at)}</span>
                </div>
                <p className="mt-0.5 text-sm break-words whitespace-pre-wrap">{c.body}</p>
              </div>
              {c.user_id === currentUserId && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Удалить комментарий"
                  className="self-center opacity-60 hover:opacity-100"
                  onClick={() => startTransition(() => deleteComment(c.id))}
                >
                  <XIcon />
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
      <form
        ref={form}
        className="flex items-end gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          send()
        }}
      >
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) form.current?.requestSubmit()
          }}
          placeholder="Написать комментарий…"
          rows={1}
          className="min-h-10 resize-none"
          aria-label="Комментарий"
        />
        <Button type="submit" size="icon" disabled={pending || !body.trim()} aria-label="Отправить">
          <SendIcon />
        </Button>
      </form>
    </div>
  )
}
