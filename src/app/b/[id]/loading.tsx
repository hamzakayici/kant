import { KanbanBoardSkeleton } from "@/components/kanban/KanbanBoardSkeleton"
import { Skeleton } from "@/components/ui/skeleton"

export default function BoardLoading() {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="flex flex-col gap-4 border-b border-border/60 px-4 py-4 lg:px-6">
        <Skeleton className="h-4 w-24 rounded-md" />
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48 rounded-lg" />
            <Skeleton className="h-4 w-64 rounded-md" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-9 w-28 rounded-xl" />
            <Skeleton className="h-9 w-36 rounded-xl" />
          </div>
        </div>
      </div>
      <main className="relative z-10 flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="custom-scrollbar kanban-scroll flex min-h-0 flex-1 flex-col overflow-hidden px-4 py-4 md:px-6">
          <KanbanBoardSkeleton />
        </div>
      </main>
    </div>
  )
}
