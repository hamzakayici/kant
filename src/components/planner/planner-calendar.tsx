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
    <Card className={cn("flex h-full flex-col", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-base font-semibold capitalize">
          {selectedDate.toLocaleString("tr-TR", {
            month: "long",
            year: "numeric",
          })}
        </CardTitle>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
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
            variant="ghost"
            size="icon-sm"
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
      <CardContent>
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
                  "relative flex aspect-square flex-col items-center justify-center rounded-xl text-sm transition-all",
                  isSelected
                    ? "bg-primary font-semibold text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground",
                  isToday && !isSelected && "ring-1 ring-primary/40",
                )}
              >
                <span>{date.getDate()}</span>
                {taskCount > 0 ? (
                  <span
                    className={cn(
                      "mt-0.5 text-[9px] font-semibold tabular-nums",
                      isSelected ? "text-primary-foreground/80" : "text-primary",
                    )}
                  >
                    {taskCount}
                  </span>
                ) : null}
              </button>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
