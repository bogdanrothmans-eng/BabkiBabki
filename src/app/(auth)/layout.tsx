import { WalletIcon } from "lucide-react"

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main id="main" tabIndex={-1} className="mx-auto flex min-h-dvh outline-none w-full max-w-sm flex-col justify-center gap-8 px-4 py-10">
      <div className="flex flex-col items-center text-center">
        <span aria-hidden className="flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
          <WalletIcon className="size-6" />
        </span>
        <p className="mt-3 text-2xl font-semibold tracking-tight">Бабки</p>
        <p className="text-muted-foreground">Общий бюджет на двоих</p>
      </div>
      {children}
    </main>
  )
}
