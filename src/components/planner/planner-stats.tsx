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
      gradient: "from-blue-500/20 to-blue-500/5",
      iconColor: "text-blue-500",
      ringColor: "ring-blue-500/20",
    },
    {
      label: "Planlanmamış",
      value: unplannedCount,
      hint: "Tarihsiz açık görevler",
      icon: ListTodo,
      gradient: "from-orange-500/20 to-orange-500/5",
      iconColor: "text-orange-500",
      ringColor: "ring-orange-500/20",
    },
    {
      label: "Planlanmış",
      value: scheduledCount,
      hint: "Başlangıç veya bitiş tarihi olan",
      icon: CalendarClock,
      gradient: "from-purple-500/20 to-purple-500/5",
      iconColor: "text-purple-500",
      ringColor: "ring-purple-500/20",
    },
    {
      label: "Tamamlanan",
      value: doneCount,
      hint: "Tamamlanmış sütundaki kartlar",
      icon: CalendarCheck,
      gradient: "from-emerald-500/20 to-emerald-500/5",
      iconColor: "text-emerald-500",
      ringColor: "ring-emerald-500/20",
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 px-4 sm:grid-cols-2 lg:px-6 xl:grid-cols-4">
      {stats.map((stat) => (
        <Card
          key={stat.label}
          className="group relative overflow-hidden bg-background/40 backdrop-blur-xl border-border/40 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg dark:bg-card/20 @container/card"
        >
          {/* Subtle gradient background blur */}
          <div className={`absolute -right-4 -top-4 size-24 rounded-full bg-linear-to-br opacity-50 blur-2xl transition-opacity group-hover:opacity-100 ${stat.gradient}`} />
          
          <CardHeader className="relative z-10 flex flex-row items-start justify-between gap-4 p-5">
            <div className="space-y-1.5">
              <CardDescription className="font-medium tracking-wide">{stat.label}</CardDescription>
              <CardTitle className="text-3xl font-bold tabular-nums tracking-tight">
                {stat.value}
              </CardTitle>
              <p className="text-xs font-medium text-muted-foreground/80">{stat.hint}</p>
            </div>
            <div className={`flex size-12 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br ring-1 shadow-sm transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3 ${stat.gradient} ${stat.iconColor} ${stat.ringColor}`}>
              <stat.icon className="size-5" />
            </div>
          </CardHeader>
        </Card>
      ))}
    </div>
  )
}
