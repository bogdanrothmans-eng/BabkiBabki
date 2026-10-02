export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center gap-8 px-4 py-10">
      <div className="text-center">
        <div className="text-4xl">💸</div>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Бабки</h1>
        <p className="text-sm text-muted-foreground">Общий бюджет на двоих</p>
      </div>
      {children}
    </main>
  )
}
