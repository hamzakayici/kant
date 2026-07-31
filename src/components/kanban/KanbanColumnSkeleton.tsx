import { Skeleton } from "@/components/ui/skeleton"
import { KanbanCardSkeleton } from "@/components/kanban/KanbanCardSkeleton"
import { cn } from "@/lib/utils"

type KanbanColumnSkeletonProps = {
  cardCount?: number
  className?: string
}

export function KanbanColumnSkeleton({
  cardCount = 4,
  className,
}: KanbanColumnSkeletonProps) {
  return (
    <div
      className={cn(
        "flex h-full w-[min(320px,85vw)] shrink-0 flex-col rounded-2xl border border-border/60 bg-card/40",
        className,
      )}
      style={{ boxShadow: "inset 0 3px 0 0 hsl(var(--muted-foreground) / 0.25)" }}
    >
      <div className="flex items-center gap-2 px-3 py-3">
        <Skeleton className="size-2.5 rounded-full" />
        <Skeleton className="h-4 w-24 rounded-md" />
        <Skeleton className="ml-auto h-5 w-6 rounded-full" />
      </div>
      <div className="mx-2 mb-2 flex min-h-[160px] flex-1 flex-col gap-2 rounded-xl bg-muted/20 p-1.5">
        {Array.from({ length: cardCount }).map((_, index) => (
          <KanbanCardSkeleton
            key={index}
            withFooter={index % 3 !== 1}
            withCover={index === 0}
          />
        ))}
      </div>
      <div className="border-t border-border/50 p-2">
        <Skeleton className="h-9 w-full rounded-xl" />
      </div>
    </div>
  )
}
