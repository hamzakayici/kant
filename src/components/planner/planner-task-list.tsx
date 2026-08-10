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
        "group relative flex items-start gap-3 rounded-xl border border-border/40 bg-card/40 p-3 shadow-sm backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-border/80 hover:bg-card/80 hover:shadow-md dark:bg-card/20",
        done && "opacity-50 hover:opacity-80",
      )}
    >
      {/* Subtle left accent border based on priority or default */}
      <div className={cn(
        "absolute inset-y-2 left-0 w-1 rounded-r-md transition-colors",
        card.priority === "URGENT" ? "bg-red-500/70" :
        card.priority === "HIGH" ? "bg-orange-500/70" :
        card.priority === "MEDIUM" ? "bg-yellow-500/70" :
        card.priority === "LOW" ? "bg-blue-500/70" : "bg-primary/40",
        done && "bg-emerald-500/50"
      )} />

      <div className="ml-1 mt-0.5 shrink-0 transition-transform duration-300 group-hover:scale-110">
        {done ? (
          <CheckCircle2 className="size-4 text-emerald-500" />
        ) : (
          <Circle className="size-4 text-muted-foreground/40 group-hover:text-primary/70" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="mb-1.5 flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="font-mono text-[10px] bg-background/50">
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
            <span className="truncate text-[10px] font-medium text-muted-foreground/80">
              {card.column.board.name}
            </span>
          ) : null}
        </div>

        <p
          className={cn(
            "line-clamp-2 text-sm font-medium leading-relaxed tracking-wide text-foreground",
            done && "line-through text-muted-foreground",
          )}
        >
          {card.title}
        </p>

        <div className="mt-3 flex items-center justify-between gap-2">
          <div className="flex -space-x-1.5">
            {assignees.slice(0, 3).map((user) => (
              <Avatar
                key={user.id}
                className="size-6 border-2 border-background shadow-sm transition-transform hover:scale-110 hover:z-10"
                title={getUserDisplayName(user)}
              >
                <AvatarFallback className="bg-primary/10 text-[9px] font-bold text-primary">
                  {getUserInitial(user)}
                </AvatarFallback>
              </Avatar>
            ))}
          </div>

          {card.dueDate && !done ? (
            <span
              className={cn(
                "flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-medium shadow-sm",
                diffDays !== null ? getDueDateClass(diffDays) : "bg-muted text-muted-foreground",
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
        <ArrowUpRight className="size-4 shrink-0 text-muted-foreground/50 opacity-0 transition-all duration-300 group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-primary group-hover:opacity-100" />
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
    <div className="space-y-3">
      <div className="flex items-center gap-2 px-1">
        <h4 className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
          {title}
        </h4>
        <Badge variant="secondary" className="h-5 px-1.5 text-[10px] bg-muted/50 text-muted-foreground">
          {cards.length}
        </Badge>
      </div>
      {cards.length > 0 ? (
        <div className="space-y-2.5">
          {cards.map((card) => (
            <TaskRow key={card.id} card={card} done={done} />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border/50 bg-muted/10 p-6 text-center">
          <p className="text-xs font-medium text-muted-foreground">{emptyText}</p>
        </div>
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
    <Card className={cn("flex h-full min-h-0 flex-col overflow-hidden bg-background/40 backdrop-blur-xl border-border/40 shadow-sm dark:bg-card/20", className)}>
      <CardHeader className="pb-3 border-b border-border/40 bg-muted/20">
        <CardTitle className="text-base tracking-tight">Görevler</CardTitle>
        <CardDescription>
          Projelerinizdeki kartları duruma göre filtreleyin
        </CardDescription>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col pt-4">
        <Tabs
          value={viewFilter}
          onValueChange={(v) => onViewFilterChange(v as ViewFilter)}
          className="flex min-h-0 flex-1 flex-col"
        >
          <TabsList className="mb-4 grid w-full grid-cols-4 bg-muted/50 p-1 rounded-xl">
            {(Object.keys(VIEW_LABELS) as ViewFilter[]).map((key) => (
              <TabsTrigger key={key} value={key} className="text-xs rounded-lg transition-all data-[state=active]:bg-background data-[state=active]:shadow-sm">
                {VIEW_LABELS[key]}
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto pr-2">
            <TabsContent value="tumu" className="mt-0 space-y-8 pb-4">
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

            <TabsContent value="planlanmamis" className="mt-0 pb-4">
              <TaskSection
                title="Planlanmamış"
                cards={unplanned}
                emptyText="Planlanmamış görev yok."
              />
            </TabsContent>

            <TabsContent value="planlanmis" className="mt-0 pb-4">
              <TaskSection
                title="Planlanmış"
                cards={scheduled}
                emptyText="Planlanmış görev yok."
              />
            </TabsContent>

            <TabsContent value="tamamlanan" className="mt-0 pb-4">
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
