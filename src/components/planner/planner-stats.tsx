import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { CalendarCheck, CalendarClock, CalendarDays, ListTodo } from "lucide-react"

export function PlannerStats({
  todayCount,
  unplannedCount,
  scheduledCount,
  doneCount,
}: {
  todayCount: number
  unplannedCount: number
  scheduledCount: number
  doneCount: number
}) {
  const stats = [
    {
      label: "Bugün",
      value: todayCount,
      hint: "Seçili gündeki görevler",
      icon: CalendarDays,
    },
    {
      label: "Planlanmamış",
      value: unplannedCount,
      hint: "Tarihsiz açık görevler",
      icon: ListTodo,
    },
    {
      label: "Planlanmış",
      value: scheduledCount,
      hint: "Başlangıç veya bitiş tarihi olan",
      icon: CalendarClock,
    },
    {
      label: "Tamamlanan",
      value: doneCount,
      hint: "Tamamlanmış sütundaki kartlar",
      icon: CalendarCheck,
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs sm:grid-cols-2 lg:px-6 xl:grid-cols-4 dark:*:data-[slot=card]:bg-card">
      {stats.map((stat) => (
        <Card key={stat.label} className="@container/card">
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div className="space-y-1">
              <CardDescription>{stat.label}</CardDescription>
              <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                {stat.value}
              </CardTitle>
              <p className="text-xs text-muted-foreground">{stat.hint}</p>
            </div>
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <stat.icon className="size-5" />
            </div>
          </CardHeader>
        </Card>
      ))}
    </div>
  )
}
