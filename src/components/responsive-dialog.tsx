"use client"

import type * as React from "react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { useIsMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"

// Bottom sheet on phones, centered dialog on desktop.
export function ResponsiveDialog({
  open,
  onOpenChange,
  title,
  description,
  className,
  bare = false,
  children,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  className?: string
  // The content draws its own header and close button.
  bare?: boolean
  children: React.ReactNode
}) {
  const isMobile = useIsMobile()

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className={cn("data-[vaul-drawer-direction=bottom]:max-h-[94dvh]", className)}>
          <DrawerHeader className="sr-only">
            <DrawerTitle>{title}</DrawerTitle>
            {description && <DrawerDescription>{description}</DrawerDescription>}
          </DrawerHeader>
          <div
            className={cn(
              "px-4 pt-2 pb-[max(1rem,env(safe-area-inset-bottom))]",
              bare ? "flex min-h-0 flex-1 flex-col" : "overflow-y-auto",
            )}
          >
            {children}
          </div>
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={!bare}
        className={cn("max-h-[90dvh] overflow-y-auto sm:max-w-lg", bare && "rounded-[32px] sm:max-w-md", className)}
      >
        <DialogHeader className="sr-only">
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  )
}
