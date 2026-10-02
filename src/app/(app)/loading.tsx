import { Skeleton } from "@/components/ui/skeleton"

// Shown instantly on navigation while the server renders the page; mirrors the
// overview/list layout so nothing jumps when the data arrives.
export default function Loading() {
  return (
    <div className="flex flex-col gap-4 md:gap-6" role="status" aria-label="Загрузка">
      <Skeleton className="mx-auto h-11 w-56 md:mx-0 md:h-9" />
      <div className="rounded-2xl border bg-card px-5 py-6 md:px-8 md:py-8">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="mt-3 h-12 w-56 md:h-14" />
        <Skeleton className="mt-3 h-4 w-64" />
      </div>
      <div className="flex flex-col gap-2">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="flex min-h-16 items-center gap-3 rounded-xl border bg-card px-3">
            <Skeleton className="size-10 rounded-xl" />
            <div className="flex-1">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="mt-2 h-3 w-24" />
            </div>
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>
      <span className="sr-only">Загружаем…</span>
    </div>
  )
}
