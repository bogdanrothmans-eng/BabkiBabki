"use client"

import { ArrowLeftIcon } from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect } from "react"

import { Button } from "@/components/ui/button"

// Pages seen in this tab. Client-side navigations don't update
// document.referrer, so the app counts them itself.
let visitedPages = 0

export function NavigationTracker() {
  const pathname = usePathname()
  useEffect(() => {
    visitedPages++
  }, [pathname])
  return null
}

// Returns to wherever the user came from inside the app (overview, a filtered
// list, the year table); falls back to `href` when the page was opened directly.
export function BackButton({ href, label }: { href: string; label: string }) {
  const router = useRouter()
  return (
    <Button asChild variant="ghost" className="-ml-2 self-start">
      <Link
        href={href}
        onClick={(e) => {
          if (visitedPages > 1) {
            e.preventDefault()
            router.back()
          }
        }}
      >
        <ArrowLeftIcon aria-hidden />
        {label}
      </Link>
    </Button>
  )
}
