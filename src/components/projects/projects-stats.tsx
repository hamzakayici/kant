import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { FolderKanban, Layers, ListTodo } from "lucide-react"

export function ProjectsStats({
  boardCount,
  totalCards,
  activeBoards,
}: {
  boardCount: number
  totalCards: number
  activeBoards: number
}) {
  const stats = [
    {
      label: "Toplam Proje",
      value: boardCount,
      hint: "Erişiminiz olan panolar",
      icon: FolderKanban,
    },
    {
      label: "Aktif Panolar",
      value: activeBoards,
      hint: "En az bir görev içeren",
      icon: Layers,
    },
    {
      label: "Toplam Görev",
      value: totalCards,
      hint: "Tüm projelerdeki kartlar",
      icon: ListTodo,
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-3 dark:*:data-[slot=card]:bg-card">
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
