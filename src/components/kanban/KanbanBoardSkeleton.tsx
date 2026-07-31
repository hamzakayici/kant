import { KanbanColumnSkeleton } from "@/components/kanban/KanbanColumnSkeleton"
import { Skeleton } from "@/components/ui/skeleton"

type KanbanBoardSkeletonProps = {
  columnCount?: number
}

export function KanbanBoardSkeleton({
  columnCount = 4,
}: KanbanBoardSkeletonProps) {
  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <div className="flex shrink-0 flex-wrap items-center gap-2 px-1">
        <Skeleton className="h-7 w-24 rounded-full" />
        <Skeleton className="h-7 w-20 rounded-full" />
      </div>
      <div className="kanban-scroll custom-scrollbar min-h-0 flex-1 overflow-x-auto overflow-y-hidden">
        <div className="flex h-full min-h-0 items-stretch gap-4 px-1 pb-1">
          {Array.from({ length: columnCount }).map((_, index) => (
            <KanbanColumnSkeleton
              key={index}
              cardCount={index === 1 ? 5 : index === 2 ? 3 : 4}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
