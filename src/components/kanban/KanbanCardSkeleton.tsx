import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

type KanbanCardSkeletonProps = {
  className?: string
  withCover?: boolean
  withFooter?: boolean
}

export function KanbanCardSkeleton({
  className,
  withCover = false,
  withFooter = true,
}: KanbanCardSkeletonProps) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-border/80 border-l-[3px] border-l-muted bg-card shadow-sm",
        className,
      )}
      aria-hidden
    >
      {withCover ? (
        <Skeleton className="h-20 w-full rounded-none" />
      ) : null}
      <div className="space-y-2.5 p-3">
        <div className="flex items-center gap-2">
          <Skeleton className="h-3 w-14 rounded-md" />
          <Skeleton className="h-4 w-10 rounded-full" />
        </div>
        <Skeleton className="h-4 w-full rounded-md" />
        <Skeleton className="h-4 w-[82%] rounded-md" />
        {withFooter ? (
          <div className="flex items-center justify-between border-t border-border/50 pt-2">
            <div className="flex -space-x-1.5">
              <Skeleton className="size-5 rounded-full" />
              <Skeleton className="size-5 rounded-full" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-4 w-10 rounded-md" />
              <Skeleton className="h-4 w-8 rounded-md" />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
