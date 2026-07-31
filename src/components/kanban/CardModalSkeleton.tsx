import { Skeleton } from "@/components/ui/skeleton"

export function CardModalSkeleton() {
  return (
    <div className="flex h-[min(90vh,880px)] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
      <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
        <div className="min-w-0 flex-1 space-y-3">
          <Skeleton className="h-4 w-28 rounded-md" />
          <Skeleton className="h-8 w-full max-w-lg rounded-lg" />
        </div>
        <Skeleton className="size-9 rounded-xl" />
      </div>
      <div className="grid min-h-0 flex-1 gap-0 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4 border-b border-border p-5 lg:border-r lg:border-b-0">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-16 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-40 w-full rounded-xl" />
          <Skeleton className="h-28 w-full rounded-xl" />
        </div>
        <div className="space-y-3 p-5">
          <Skeleton className="h-5 w-24 rounded-md" />
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-14 w-full rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  )
}
