import type { Metadata, Viewport } from "next"
import { ThemeProvider } from "next-themes"
import { IBM_Plex_Sans } from "next/font/google"
import { Suspense } from "react"

import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"

import { DemoShell, PageSkeleton } from "../demo-shell"
import "./globals.css"

const plex = IBM_Plex_Sans({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-plex",
})

export const metadata: Metadata = {
  title: "Бабки — демо",
  description: "Демо общего бюджета на двоих: траты, доходы, чеки и комментарии",
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0f0f0f",
  colorScheme: "dark",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={`${plex.variable} dark`} suppressHydrationWarning>
      <body className="min-h-dvh antialiased">
        <a
          href="#main"
          className="sr-only z-[100] rounded-md bg-primary px-4 py-3 text-primary-foreground focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
        >
          Перейти к содержимому
        </a>
        <ThemeProvider attribute="class" forcedTheme="dark" disableTransitionOnChange>
          <TooltipProvider>
            <DemoShell>
              <Suspense fallback={<PageSkeleton />}>{children}</Suspense>
            </DemoShell>
          </TooltipProvider>
          <Toaster position="top-center" />
        </ThemeProvider>
      </body>
    </html>
  )
}
