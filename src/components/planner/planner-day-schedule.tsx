"use client"

import Link from "next/link"
import { Clock } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { isSameDay, toDate, type PlannerCard } from "@/lib/planner-utils"

const HOURS = Array.from({ length: 13 }, (_, i) => i + 7)

function formatHour(hour: number) {
  return `${hour.toString().padStart(2, "0")}:00`
}

function ScheduleCard({ card }: { card: PlannerCard }) {
  const boardId = card.column?.board?.id
  const identifier = card.column?.board?.identifier ?? "?"

  const inner = (
    <div className="group relative rounded-xl border border-border/40 bg-card/50 px-3 py-2.5 shadow-sm backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-border/80 hover:bg-card/80 hover:shadow-md dark:bg-card/20">
      <div className="absolute inset-y-2 left-0 w-0.5 rounded-r-md bg-primary/40 transition-colors group-hover:bg-primary/70" />
      <div className="mb-1 flex items-center gap-2 pl-1.5">
        <Badge variant="outline" className="font-mono text-[10px] bg-background/50">
          {identifier}-{card.sequenceId}
        </Badge>
        {card.column?.name ? (
          <span className="truncate text-[10px] font-medium text-muted-foreground/80">
            {card.column.name}
          </span>
        ) : null}
      </div>
      <p className="line-clamp-2 text-sm font-medium leading-relaxed tracking-wide text-foreground pl-1.5">
        {card.title}
      </p>
    </div>
  )

  if (boardId) {
    return (
      <Link href={`/b/${boardId}?card=${card.id}`} className="block">
        {inner}
      </Link>
    )
  }

  return inner
}

type PlannerDayScheduleProps = {
  className?: string
  selectedDate: Date
  cards: PlannerCard[]
}

export function PlannerDaySchedule({
  className,
  selectedDate,
  cards,
}: PlannerDayScheduleProps) {
  const now = new Date()
  const showNowLine = isSameDay(selectedDate, now)
  const currentHour = now.getHours()
  const currentMinute = now.getMinutes()

  const allDayCards = cards.filter((card) => {
    const start = toDate(card.startDate)
    const due = toDate(card.dueDate)
    const hasTime =
      (start &&
        (start.getHours() !== 0 || start.getMinutes() !== 0)) ||
      (due && (due.getHours() !== 0 || due.getMinutes() !== 0))
    return !hasTime
  })

  const getCardsForHour = (hour: number) =>
    cards.filter((card) => {
      const start = toDate(card.startDate)
      const due = toDate(card.dueDate)
      const ref = start ?? due
      if (!ref) return false
      return ref.getHours() === hour
    })

  return (
    <Card className={cn("flex h-full min-h-0 flex-col overflow-hidden bg-background/40 backdrop-blur-xl border-border/40 shadow-sm dark:bg-card/20", className)}>
      <CardHeader className="pb-3 border-b border-border/40 bg-muted/20">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base tracking-tight">Günlük Program</CardTitle>
            <CardDescription className="capitalize mt-0.5">
              {selectedDate.toLocaleDateString("tr-TR", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </CardDescription>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold tabular-nums text-primary tracking-tighter">
              {selectedDate.getDate()}
            </p>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mt-0.5">
              {selectedDate.toLocaleDateString("tr-TR", { month: "short" })}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="custom-scrollbar min-h-0 flex-1 overflow-y-auto pt-4 pl-2 pr-4">
        <div className="mb-6 rounded-xl border border-border/40 bg-muted/20 p-4 shadow-sm backdrop-blur-sm">
          <div className="mb-3 flex items-center gap-2 text-xs font-bold tracking-wider text-muted-foreground uppercase">
            <Clock className="size-3.5" />
            Tüm gün
          </div>
          {allDayCards.length > 0 ? (
            <div className="space-y-2.5">
              {allDayCards.map((card) => (
                <ScheduleCard key={card.id} card={card} />
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-border/50 bg-background/30 p-4 text-center">
              <p className="text-xs font-medium text-muted-foreground">
                Bu gün için tüm gün görevi yok.
              </p>
            </div>
          )}
        </div>

        <div className="relative">
          {HOURS.map((hour) => {
            const hourCards = getCardsForHour(hour)
            const isCurrentHour = showNowLine && hour === currentHour

            return (
              <div key={hour} className="group relative flex min-h-20">
                <div className="w-14 shrink-0 pr-3 pt-2 text-right text-[11px] font-semibold tracking-wider text-muted-foreground tabular-nums">
                  {formatHour(hour)}
                </div>
                <div className="relative flex-1 border-l border-border/40 pb-4 pl-4 transition-colors group-hover:border-primary/30">
                  {/* Subtle top border instead of solid line for each hour */}
                  <div className="absolute top-0 left-0 right-0 border-t border-border/20 transition-colors group-hover:border-primary/20" />
                  
                  {isCurrentHour ? (
                    <div
                      className="pointer-events-none absolute right-0 left-0 z-10 border-t-2 border-red-500/70"
                      style={{ top: `${(currentMinute / 60) * 100}%` }}
                    >
                      <span className="absolute -top-3 -left-16 flex items-center rounded-md bg-red-500/10 px-2 py-1 text-[10px] font-bold text-red-500 tabular-nums shadow-sm backdrop-blur-md">
                        <span className="mr-1.5 size-1.5 rounded-full bg-red-500 animate-pulse" />
                        {now.toLocaleTimeString("tr-TR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  ) : null}

                  <div className="space-y-2.5 pt-2">
                    {hourCards.map((card) => (
                      <ScheduleCard key={card.id} card={card} />
                    ))}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
