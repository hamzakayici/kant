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
    <div className="rounded-lg border border-border/70 bg-card px-3 py-2 shadow-sm transition-colors hover:border-primary/30 hover:bg-accent/30">
      <div className="mb-1 flex items-center gap-2">
        <Badge variant="outline" className="font-mono text-[10px]">
          {identifier}-{card.sequenceId}
        </Badge>
        {card.column?.name ? (
          <span className="truncate text-[10px] text-muted-foreground">
            {card.column.name}
          </span>
        ) : null}
      </div>
      <p className="line-clamp-2 text-sm font-medium text-foreground">
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
    <Card className={cn("flex h-full min-h-0 flex-col", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base">Günlük Program</CardTitle>
            <CardDescription>
              {selectedDate.toLocaleDateString("tr-TR", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </CardDescription>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold tabular-nums text-primary">
              {selectedDate.getDate()}
            </p>
            <p className="text-xs text-muted-foreground capitalize">
              {selectedDate.toLocaleDateString("tr-TR", { month: "long" })}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="custom-scrollbar min-h-0 flex-1 overflow-y-auto">
        <div className="mb-4 rounded-xl border border-border/60 bg-muted/20 p-3">
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase">
            <Clock className="size-3.5" />
            Tüm gün
          </div>
          {allDayCards.length > 0 ? (
            <div className="space-y-2">
              {allDayCards.map((card) => (
                <ScheduleCard key={card.id} card={card} />
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic">
              Bu gün için tüm gün görevi yok.
            </p>
          )}
        </div>

        <div className="relative">
          {HOURS.map((hour) => {
            const hourCards = getCardsForHour(hour)
            const isCurrentHour = showNowLine && hour === currentHour

            return (
              <div key={hour} className="group relative flex min-h-16">
                <div className="w-14 shrink-0 pr-2 pt-2 text-right text-[10px] font-medium text-muted-foreground tabular-nums">
                  {formatHour(hour)}
                </div>
                <div className="relative flex-1 border-l border-t border-border/60 py-2 pl-3 transition-colors group-hover:bg-accent/20">
                  {isCurrentHour ? (
                    <div
                      className="pointer-events-none absolute right-0 left-0 z-10 border-t-2 border-destructive/60"
                      style={{ top: `${(currentMinute / 60) * 100}%` }}
                    >
                      <span className="absolute -top-2.5 -left-14 rounded bg-destructive/15 px-1.5 py-0.5 text-[9px] font-bold text-destructive tabular-nums">
                        {now.toLocaleTimeString("tr-TR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  ) : null}

                  <div className="space-y-2">
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
