import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export function BoardCardSkeleton() {
  return (
    <Card className="min-h-[220px] overflow-hidden">
      <Skeleton className="h-28 w-full rounded-none" />
      <CardHeader className="pt-4">
        <div className="flex items-start justify-between gap-3">
          <Skeleton className="size-11 rounded-xl" />
          <Skeleton className="size-8 rounded-lg" />
        </div>
        <Skeleton className="mt-3 h-6 w-3/4 rounded-lg" />
        <Skeleton className="h-4 w-full rounded-md" />
        <Skeleton className="h-4 w-2/3 rounded-md" />
      </CardHeader>
      <CardContent className="flex items-center justify-between gap-3 pt-0">
        <div className="flex gap-2">
          <Skeleton className="h-5 w-14 rounded-full" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        <Skeleton className="h-4 w-20 rounded-md" />
      </CardContent>
    </Card>
  )
}
