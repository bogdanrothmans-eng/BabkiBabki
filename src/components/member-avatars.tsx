import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

export function initials(name: string | null | undefined) {
  return (name ?? "?").trim().slice(0, 1).toUpperCase()
}

export function MemberAvatar({ name, className }: { name: string | null | undefined; className?: string }) {
  return (
    <Avatar className={cn("size-7 border-2 border-background", className)}>
      <AvatarFallback className="text-xs font-medium">{initials(name)}</AvatarFallback>
    </Avatar>
  )
}

export function MemberAvatars({ members }: { members: { id: string; name: string }[] }) {
  return (
    <div className="flex -space-x-2">
      {members.slice(0, 3).map((m) => (
        <MemberAvatar key={m.id} name={m.name} />
      ))}
    </div>
  )
}
