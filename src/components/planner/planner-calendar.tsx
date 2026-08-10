"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  cardMatchesDate,
  generateCalendarDays,
  isSameDay,
  type PlannerCard,
} from "@/lib/planner-utils"

const WEEK_DAYS = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"]

type PlannerCalendarProps = {
  className?: string
  selectedDate: Date
  cards: PlannerCard[]
  onSelectDate: (date: Date) => void
  onMonthChange: (date: Date) => void
}

export function PlannerCalendar({
  className,
  selectedDate,
  cards,
  onSelectDate,
  onMonthChange,
}: PlannerCalendarProps) {
  const calendarDays = generateCalendarDays(selectedDate)
  const today = new Date()

  return (
    <Card className={cn("flex h-full flex-col overflow-hidden bg-background/40 backdrop-blur-xl border-border/40 shadow-sm dark:bg-card/20", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 border-b border-border/40 bg-muted/20">
        <CardTitle className="text-base font-semibold capitalize tracking-tight">
          {selectedDate.toLocaleString("tr-TR", {
            month: "long",
            year: "numeric",
          })}
        </CardTitle>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            className="h-7 w-7 rounded-full border-border/50 bg-background/50 backdrop-blur-md transition-all hover:bg-accent hover:text-accent-foreground"
            onClick={() =>
              onMonthChange(
                new Date(
                  selectedDate.getFullYear(),
                  selectedDate.getMonth() - 1,
                  1,
                ),
              )
            }
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            className="h-7 w-7 rounded-full border-border/50 bg-background/50 backdrop-blur-md transition-all hover:bg-accent hover:text-accent-foreground"
            onClick={() =>
              onMonthChange(
                new Date(
                  selectedDate.getFullYear(),
                  selectedDate.getMonth() + 1,
                  1,
                ),
              )
            }
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="mb-2 grid grid-cols-7 gap-1 text-center">
          {WEEK_DAYS.map((day) => (
            <div
              key={day}
              className="text-[10px] font-semibold tracking-wide text-muted-foreground uppercase"
            >
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((date, index) => {
            if (!date) {
              return <div key={`empty-${index}`} className="aspect-square" />
            }

            const isSelected = isSameDay(date, selectedDate)
            const isToday = isSameDay(date, today)
            const taskCount = cards.filter((card) =>
              cardMatchesDate(card, date),
            ).length

            return (
              <button
                key={date.toISOString()}
                type="button"
                onClick={() => onSelectDate(date)}
                className={cn(
                  "group relative flex aspect-square flex-col items-center justify-center rounded-xl text-sm transition-all duration-300",
                  isSelected
                    ? "bg-primary font-semibold text-primary-foreground shadow-md shadow-primary/25 scale-105"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground hover:scale-105",
                  isToday && !isSelected && "ring-1 ring-primary/40 bg-primary/5",
                )}
              >
                <span>{date.getDate()}</span>
                {taskCount > 0 ? (
                  <div className="absolute bottom-1.5 flex gap-0.5">
                    {/* Görev sayısına göre yan yana minik noktalar */}
                    {Array.from({ length: Math.min(taskCount, 3) }).map((_, i) => (
                      <span
                        key={i}
                        className={cn(
                          "size-1 rounded-full transition-colors",
                          isSelected ? "bg-primary-foreground/80" : "bg-primary"
                        )}
                      />
                    ))}
                    {taskCount > 3 && (
                      <span className={cn(
                        "size-1 rounded-full opacity-50",
                        isSelected ? "bg-primary-foreground/80" : "bg-primary"
                      )} />
                    )}
                  </div>
                ) : null}
              </button>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

