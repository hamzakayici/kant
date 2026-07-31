"use client"

import { ChevronLeft, ChevronRight, Sun } from "lucide-react"
import GlobalSearch from "@/components/GlobalSearch"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"
import { isSameDay } from "@/lib/planner-utils"

type PlannerHeaderProps = {
  selectedDate: Date
  onDateChange: (date: Date) => void
}

export function PlannerHeader({
  selectedDate,
  onDateChange,
}: PlannerHeaderProps) {
  const today = new Date()
  const isToday = isSameDay(selectedDate, today)

  return (
    <div className="flex flex-col gap-4 px-4 lg:px-6">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="-ml-1 hidden md:flex" />
        <Separator
          orientation="vertical"
          className="hidden h-4 md:block data-vertical:self-auto"
        />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage>Planlayıcı</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
            Planlayıcı
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Görevlerinizi takvimde görüntüleyin ve günlük programınızı planlayın
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <GlobalSearch />
          <div className="flex items-center rounded-xl border border-border bg-card p-1">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() =>
                onDateChange(
                  new Date(
                    selectedDate.getFullYear(),
                    selectedDate.getMonth(),
                    selectedDate.getDate() - 1,
                  ),
                )
              }
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              type="button"
              variant={isToday ? "secondary" : "ghost"}
              size="sm"
              className="gap-2 px-3"
              onClick={() => onDateChange(new Date())}
            >
              <Sun className={cn("size-4", isToday && "text-primary")} />
              <span className="hidden sm:inline">
                {isToday
                  ? "Bugün"
                  : selectedDate.toLocaleDateString("tr-TR", {
                      day: "numeric",
                      month: "long",
                    })}
              </span>
              <span className="sm:hidden">
                {selectedDate.toLocaleDateString("tr-TR", {
                  day: "numeric",
                  month: "short",
                })}
              </span>
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() =>
                onDateChange(
                  new Date(
                    selectedDate.getFullYear(),
                    selectedDate.getMonth(),
                    selectedDate.getDate() + 1,
                  ),
                )
              }
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
