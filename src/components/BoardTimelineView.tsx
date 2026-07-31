"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Sun,
  AlertTriangle,
} from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  getPriorityBadgeClass,
  getPriorityLabel,
} from "@/lib/card-styles"
import { isSameDay } from "@/lib/planner-utils"

const VISIBLE_DAYS = 14
const OFFSET_DAYS = 3

type TimelineCard = {
  id: string
  title: string
  sequenceId: number
  priority?: string
  startDate?: string | Date | null
  dueDate?: string | Date | null
  columnTitle: string
  columnColor: string
  columnCategory?: string | null
}

function toDate(value?: string | Date | null) {
  if (!value) return null
  return value instanceof Date ? value : new Date(value)
}

function startOfDay(date: Date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

function dayDiff(a: Date, b: Date) {
  return Math.round(
    (startOfDay(a).getTime() - startOfDay(b).getTime()) / (1000 * 3600 * 24),
  )
}

function getBarMetrics(
  startDate: Date,
  dueDate: Date,
  windowStart: Date,
  totalDays: number,
) {
  const startDiff = dayDiff(startDate, windowStart)
  const endDiff = dayDiff(dueDate, windowStart)
  const visibleStart = Math.max(0, startDiff)
  const visibleEnd = Math.min(totalDays, endDiff + 1)
  const visibleWidth = visibleEnd - visibleStart

  if (visibleWidth <= 0) return null

  return {
    left: (visibleStart / totalDays) * 100,
    width: (visibleWidth / totalDays) * 100,
  }
}

export default function BoardTimelineView({ board }: { board: any }) {
  const [anchorDate, setAnchorDate] = useState(new Date())

  const days = useMemo(() => {
    return Array.from({ length: VISIBLE_DAYS }, (_, i) => {
      const d = new Date(anchorDate)
      d.setDate(d.getDate() + i - OFFSET_DAYS)
      d.setHours(0, 0, 0, 0)
      return d
    })
  }, [anchorDate])

  const windowStart = days[0]
  const windowEnd = days[days.length - 1]
  const today = startOfDay(new Date())

  const cardsWithDates: TimelineCard[] = useMemo(() => {
    return board.columns
      .flatMap((col: any) =>
        col.cards
          .filter((c: any) => c.dueDate || c.startDate)
          .map((c: any) => ({
            ...c,
            columnTitle: col.name,
            columnColor: col.color,
            columnCategory: col.category,
          })),
      )
      .sort((a: any, b: any) => {
        const dateA = new Date(a.startDate || a.dueDate).getTime()
        const dateB = new Date(b.startDate || b.dueDate).getTime()
        return dateA - dateB
      })
  }, [board.columns])

  const visibleCards = useMemo(() => {
    return cardsWithDates.filter((card) => {
      const start = toDate(card.startDate) ?? toDate(card.dueDate)!
      const due = toDate(card.dueDate) ?? toDate(card.startDate)!
      const startDiff = dayDiff(start, windowStart)
      const endDiff = dayDiff(due, windowStart)
      return endDiff >= 0 && startDiff < VISIBLE_DAYS
    })
  }, [cardsWithDates, windowStart])

  const overdueCount = useMemo(() => {
    return cardsWithDates.filter((card) => {
      const due = toDate(card.dueDate)
      return due && due < today && !card.columnCategory?.startsWith("DONE")
    }).length
  }, [cardsWithDates, today])

  const handlePrev = () => {
    const next = new Date(anchorDate)
    next.setDate(next.getDate() - 7)
    setAnchorDate(next)
  }

  const handleNext = () => {
    const next = new Date(anchorDate)
    next.setDate(next.getDate() + 7)
    setAnchorDate(next)
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3 px-1">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="gap-1.5 px-2.5 py-1">
            <CalendarDays className="size-3.5" />
            {visibleCards.length} görev görünürde
          </Badge>
          {overdueCount > 0 ? (
            <Badge variant="destructive" className="gap-1.5 px-2.5 py-1">
              <AlertTriangle className="size-3.5" />
              {overdueCount} gecikmiş
            </Badge>
          ) : null}
        </div>

        <div className="flex items-center gap-2 rounded-xl border border-border bg-card p-1">
          <Button type="button" variant="ghost" size="icon-sm" onClick={handlePrev}>
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="gap-2"
            onClick={() => setAnchorDate(new Date())}
          >
            <Sun className="size-4 text-primary" />
            Bugün
          </Button>
          <span className="hidden px-2 text-sm font-medium text-muted-foreground sm:inline">
            {windowStart.toLocaleDateString("tr-TR", {
              day: "numeric",
              month: "short",
            })}{" "}
            –{" "}
            {windowEnd.toLocaleDateString("tr-TR", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </span>
          <Button type="button" variant="ghost" size="icon-sm" onClick={handleNext}>
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      <Card className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <CardHeader className="border-b border-border/60 pb-4">
          <CardTitle className="text-base">Zaman Çizelgesi</CardTitle>
          <CardDescription>
            Tarih atanmış görevleri Gantt görünümünde inceleyin
          </CardDescription>
        </CardHeader>

        <CardContent className="min-h-0 flex-1 overflow-hidden p-0">
          {cardsWithDates.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 px-6 py-20 text-center">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-muted">
                <CalendarDays className="size-7 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium text-foreground">
                  Zamanlanmış görev yok
                </p>
                <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                  Kartlara başlangıç veya bitiş tarihi eklediğinizde burada
                  görünecekler.
                </p>
              </div>
            </div>
          ) : (
            <div className="custom-scrollbar h-full overflow-auto">
              <div className="min-w-[960px]">
                {/* Header */}
                <div className="sticky top-0 z-20 flex border-b border-border bg-card/95 backdrop-blur-sm">
                  <div className="sticky left-0 z-30 w-64 shrink-0 border-r border-border bg-card/95 px-4 py-3 backdrop-blur-sm">
                    <span className="text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
                      Görev
                    </span>
                  </div>
                  <div className="flex flex-1">
                    {days.map((day) => {
                      const isToday = isSameDay(day, today)
                      const isWeekend =
                        day.getDay() === 0 || day.getDay() === 6

                      return (
                        <div
                          key={day.toISOString()}
                          className={cn(
                            "flex min-w-[64px] flex-1 flex-col items-center justify-center border-r border-border/60 px-1 py-2",
                            isToday && "bg-primary/10",
                            isWeekend && !isToday && "bg-muted/20",
                          )}
                        >
                          <span
                            className={cn(
                              "text-[10px] font-medium uppercase",
                              isToday
                                ? "text-primary"
                                : "text-muted-foreground",
                            )}
                          >
                            {day.toLocaleDateString("tr-TR", {
                              weekday: "short",
                            })}
                          </span>
                          <span
                            className={cn(
                              "text-sm font-semibold tabular-nums",
                              isToday
                                ? "text-primary"
                                : "text-foreground",
                            )}
                          >
                            {day.getDate()}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Rows */}
                {visibleCards.length === 0 ? (
                  <div className="px-6 py-16 text-center text-sm text-muted-foreground">
                    Bu tarih aralığında görev bulunmuyor. Ok tuşlarıyla
                    kaydırabilirsiniz.
                  </div>
                ) : (
                  visibleCards.map((card) => {
                    const start =
                      toDate(card.startDate) ?? toDate(card.dueDate)!
                    const due = toDate(card.dueDate) ?? toDate(card.startDate)!
                    const metrics = getBarMetrics(
                      start,
                      due,
                      windowStart,
                      VISIBLE_DAYS,
                    )

                    return (
                      <div
                        key={card.id}
                        className="group flex border-b border-border/50 transition-colors hover:bg-accent/20"
                      >
                        <div className="sticky left-0 z-10 w-64 shrink-0 border-r border-border bg-card/95 px-4 py-3 backdrop-blur-sm group-hover:bg-accent/30">
                          <Link
                            href={`/b/${board.id}?card=${card.id}`}
                            className="block min-w-0"
                          >
                            <div className="mb-1 flex flex-wrap items-center gap-1.5">
                              <Badge
                                variant="outline"
                                className="font-mono text-[10px]"
                              >
                                {board.identifier}-{card.sequenceId}
                              </Badge>
                              {card.priority && card.priority !== "NONE" ? (
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    "text-[9px]",
                                    getPriorityBadgeClass(card.priority),
                                  )}
                                >
                                  {getPriorityLabel(card.priority)}
                                </Badge>
                              ) : null}
                            </div>
                            <p className="line-clamp-2 text-sm font-medium text-foreground">
                              {card.title}
                            </p>
                            <div className="mt-1.5 flex items-center gap-2 text-[10px] text-muted-foreground">
                              <span
                                className="size-2 shrink-0 rounded-full"
                                style={{
                                  backgroundColor:
                                    card.columnColor || "#579dff",
                                }}
                              />
                              <span className="truncate">{card.columnTitle}</span>
                            </div>
                          </Link>
                        </div>

                        <div className="relative flex min-h-[56px] flex-1 items-center py-2">
                          {days.map((day, i) => {
                            const isToday = isSameDay(day, today)
                            const isWeekend =
                              day.getDay() === 0 || day.getDay() === 6
                            return (
                              <div
                                key={day.toISOString()}
                                className={cn(
                                  "absolute top-0 h-full border-r border-border/40",
                                  isToday && "bg-primary/5",
                                  isWeekend && !isToday && "bg-muted/10",
                                )}
                                style={{
                                  left: `${(i / VISIBLE_DAYS) * 100}%`,
                                  width: `${(1 / VISIBLE_DAYS) * 100}%`,
                                }}
                              />
                            )
                          })}

                          {isSameDay(today, windowStart) ||
                          days.some((d) => isSameDay(d, today)) ? (
                            (() => {
                              const todayIndex = days.findIndex((d) =>
                                isSameDay(d, today),
                              )
                              if (todayIndex < 0) return null
                              return (
                                <div
                                  className="pointer-events-none absolute top-0 bottom-0 z-[1] w-px bg-primary/40"
                                  style={{
                                    left: `${((todayIndex + 0.5) / VISIBLE_DAYS) * 100}%`,
                                  }}
                                />
                              )
                            })()
                          ) : null}

                          {metrics ? (
                            <Link
                              href={`/b/${board.id}?card=${card.id}`}
                              className="absolute z-10 flex h-9 items-center overflow-hidden rounded-lg px-3 text-xs font-medium text-foreground shadow-md transition-all hover:brightness-110 hover:shadow-lg"
                              style={{
                                left: `${metrics.left}%`,
                                width: `${metrics.width}%`,
                                backgroundColor: card.columnColor || "#579dff",
                                minWidth: "48px",
                              }}
                              title={`${card.title} (${start.toLocaleDateString("tr-TR")} – ${due.toLocaleDateString("tr-TR")})`}
                            >
                              <span className="truncate">{card.title}</span>
                            </Link>
                          ) : null}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
