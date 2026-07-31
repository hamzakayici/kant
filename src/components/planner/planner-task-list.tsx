"use client"

import Link from "next/link"
import { ArrowUpRight, Calendar, CheckCircle2, Circle } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import {
  getDueDiffDays,
  type PlannerCard,
  type ViewFilter,
  VIEW_LABELS,
} from "@/lib/planner-utils"
import {
  getDueDateClass,
  getPriorityBadgeClass,
  getPriorityLabel,
} from "@/lib/card-styles"
import { getUserDisplayName, getUserInitial } from "@/lib/user"

function TaskRow({
  card,
  done = false,
}: {
  card: PlannerCard
  done?: boolean
}) {
  const boardId = card.column?.board?.id
  const identifier = card.column?.board?.identifier ?? "?"
  const diffDays = getDueDiffDays(card.dueDate)
  const assignees = card.assignees?.length
    ? card.assignees
    : card.creator
      ? [card.creator]
      : []

  const content = (
    <div
      className={cn(
        "group flex items-start gap-3 rounded-xl border border-border/60 bg-card/50 p-3 transition-all hover:border-border hover:bg-accent/40",
        done && "opacity-60",
      )}
    >
      <div className="mt-0.5 shrink-0">
        {done ? (
          <CheckCircle2 className="size-4 text-primary" />
        ) : (
          <Circle className="size-4 text-muted-foreground/50" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="mb-1 flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="font-mono text-[10px]">
            {identifier}-{card.sequenceId}
          </Badge>
          {card.priority && card.priority !== "NONE" ? (
            <Badge
              variant="outline"
              className={cn(
                "text-[10px]",
                getPriorityBadgeClass(card.priority),
              )}
            >
              {getPriorityLabel(card.priority)}
            </Badge>
          ) : null}
          {card.column?.board?.name ? (
            <span className="truncate text-[10px] text-muted-foreground">
              {card.column.board.name}
            </span>
          ) : null}
        </div>

        <p
          className={cn(
            "line-clamp-2 text-sm font-medium text-foreground",
            done && "line-through",
          )}
        >
          {card.title}
        </p>

        <div className="mt-2 flex items-center justify-between gap-2">
          <div className="flex -space-x-1.5">
            {assignees.slice(0, 3).map((user) => (
              <Avatar
                key={user.id}
                className="size-5 border-2 border-card"
                title={getUserDisplayName(user)}
              >
                <AvatarFallback className="bg-primary/20 text-[8px] font-bold text-primary">
                  {getUserInitial(user)}
                </AvatarFallback>
              </Avatar>
            ))}
          </div>

          {card.dueDate && !done ? (
            <span
              className={cn(
                "flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px]",
                diffDays !== null ? getDueDateClass(diffDays) : "bg-muted",
              )}
            >
              <Calendar className="size-3" />
              {new Date(card.dueDate).toLocaleDateString("tr-TR", {
                day: "numeric",
                month: "short",
              })}
            </span>
          ) : null}
        </div>
      </div>

      {boardId ? (
        <ArrowUpRight className="size-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
      ) : null}
    </div>
  )

  if (boardId) {
    return (
      <Link href={`/b/${boardId}?card=${card.id}`} className="block">
        {content}
      </Link>
    )
  }

  return content
}

function TaskSection({
  title,
  cards,
  emptyText,
  done = false,
}: {
  title: string
  cards: PlannerCard[]
  emptyText: string
  done?: boolean
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 px-1">
        <h4 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          {title}
        </h4>
        <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
          {cards.length}
        </Badge>
      </div>
      {cards.length > 0 ? (
        <div className="space-y-2">
          {cards.map((card) => (
            <TaskRow key={card.id} card={card} done={done} />
          ))}
        </div>
      ) : (
        <p className="px-1 text-xs text-muted-foreground italic">{emptyText}</p>
      )}
    </div>
  )
}

type PlannerTaskListProps = {
  className?: string
  viewFilter: ViewFilter
  onViewFilterChange: (filter: ViewFilter) => void
  unplanned: PlannerCard[]
  scheduled: PlannerCard[]
  done: PlannerCard[]
}

export function PlannerTaskList({
  className,
  viewFilter,
  onViewFilterChange,
  unplanned,
  scheduled,
  done,
}: PlannerTaskListProps) {
  return (
    <Card className={cn("flex h-full min-h-0 flex-col", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Görevler</CardTitle>
        <CardDescription>
          Projelerinizdeki kartları duruma göre filtreleyin
        </CardDescription>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col">
        <Tabs
          value={viewFilter}
          onValueChange={(v) => onViewFilterChange(v as ViewFilter)}
          className="flex min-h-0 flex-1 flex-col"
        >
          <TabsList className="mb-4 grid w-full grid-cols-4">
            {(Object.keys(VIEW_LABELS) as ViewFilter[]).map((key) => (
              <TabsTrigger key={key} value={key} className="text-xs">
                {VIEW_LABELS[key]}
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto pr-1">
            <TabsContent value="tumu" className="mt-0 space-y-6">
              <TaskSection
                title="Planlanmamış"
                cards={unplanned}
                emptyText="Planlanmamış görev yok."
              />
              <TaskSection
                title="Planlanmış"
                cards={scheduled}
                emptyText="Planlanmış görev yok."
              />
              <TaskSection
                title="Tamamlanan"
                cards={done}
                emptyText="Tamamlanmış görev yok."
                done
              />
            </TabsContent>

            <TabsContent value="planlanmamis" className="mt-0">
              <TaskSection
                title="Planlanmamış"
                cards={unplanned}
                emptyText="Planlanmamış görev yok."
              />
            </TabsContent>

            <TabsContent value="planlanmis" className="mt-0">
              <TaskSection
                title="Planlanmış"
                cards={scheduled}
                emptyText="Planlanmış görev yok."
              />
            </TabsContent>

            <TabsContent value="tamamlanan" className="mt-0">
              <TaskSection
                title="Tamamlanan"
                cards={done}
                emptyText="Tamamlanmış görev yok."
                done
              />
            </TabsContent>
          </div>
        </Tabs>
      </CardContent>
    </Card>
  )
}
