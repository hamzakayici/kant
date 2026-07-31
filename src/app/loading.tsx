import { BoardCardSkeleton } from "@/components/projects/BoardCardSkeleton"
import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="@container/main flex h-full min-h-0 flex-1 flex-col overflow-y-auto">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="flex flex-col gap-4 px-4 lg:flex-row lg:items-center lg:justify-between lg:px-6">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48 rounded-lg" />
            <Skeleton className="h-4 w-72 rounded-md" />
          </div>
          <Skeleton className="h-10 w-36 rounded-xl" />
        </div>

        <div className="grid grid-cols-1 gap-4 px-4 sm:grid-cols-3 lg:px-6">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-24 rounded-2xl" />
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 px-4 @xl/main:grid-cols-2 @3xl/main:grid-cols-3 @5xl/main:grid-cols-4 lg:px-6">
          {Array.from({ length: 8 }).map((_, index) => (
            <BoardCardSkeleton key={index} />
          ))}
        </div>
      </div>
    </div>
  )
}
