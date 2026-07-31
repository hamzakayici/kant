"use client"

import { useMemo, useState } from "react"
import { PlannerCalendar } from "@/components/planner/planner-calendar"
import { PlannerDaySchedule } from "@/components/planner/planner-day-schedule"
import { PlannerHeader } from "@/components/planner/planner-header"
import { PlannerStats } from "@/components/planner/planner-stats"
import { PlannerTaskList } from "@/components/planner/planner-task-list"
import {
  getCardsForDate,
  groupPlannerCards,
  type PlannerCard,
  type ViewFilter,
} from "@/lib/planner-utils"

export default function PlannerClient({
  initialCards,
}: {
  initialCards: PlannerCard[]
}) {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [viewFilter, setViewFilter] = useState<ViewFilter>("tumu")

  const groupedCards = useMemo(
    () => groupPlannerCards(initialCards),
    [initialCards],
  )

  const todayCards = useMemo(
    () => getCardsForDate(initialCards, selectedDate),
    [initialCards, selectedDate],
  )

  return (
    <div className="flex h-full min-h-0 flex-col overflow-y-auto lg:overflow-hidden">
      <div className="shrink-0 space-y-4 py-4 md:space-y-6 md:py-6">
        <PlannerHeader
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
        />
        <PlannerStats
          todayCount={todayCards.length}
          unplannedCount={groupedCards.unplanned.length}
          scheduledCount={groupedCards.scheduled.length}
          doneCount={groupedCards.done.length}
        />
      </div>

      <div className="grid gap-4 px-4 pb-4 lg:min-h-0 lg:flex-1 lg:grid-cols-12 lg:px-6 xl:gap-6">
        <div className="flex min-h-[280px] lg:col-span-3 lg:min-h-0 lg:h-full">
          <PlannerCalendar
            className="h-full w-full"
            selectedDate={selectedDate}
            cards={initialCards}
            onSelectDate={setSelectedDate}
            onMonthChange={setSelectedDate}
          />
        </div>

        <div className="flex min-h-[360px] lg:col-span-5 lg:min-h-0 lg:h-full">
          <PlannerTaskList
            className="h-full w-full"
            viewFilter={viewFilter}
            onViewFilterChange={setViewFilter}
            unplanned={groupedCards.unplanned}
            scheduled={groupedCards.scheduled}
            done={groupedCards.done}
          />
        </div>

        <div className="flex min-h-[360px] lg:col-span-4 lg:min-h-0 lg:h-full">
          <PlannerDaySchedule
            className="h-full w-full"
            selectedDate={selectedDate}
            cards={todayCards}
          />
        </div>
      </div>
    </div>
  )
}
