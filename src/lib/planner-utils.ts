export type PlannerCard = {
  id: string
  title: string
  sequenceId: number
  priority?: string
  startDate?: string | Date | null
  dueDate?: string | Date | null
  column?: {
    name?: string
    category?: string | null
    board?: { id: string; identifier: string; name: string }
  }
  creator?: { id: string; email: string }
  assignees?: { id: string; email: string }[]
}

export type ViewFilter = "tumu" | "planlanmamis" | "planlanmis" | "tamamlanan"

export const VIEW_LABELS: Record<ViewFilter, string> = {
  tumu: "Tümü",
  planlanmamis: "Planlanmamış",
  planlanmis: "Planlanmış",
  tamamlanan: "Tamamlanan",
}

export function isDoneCategory(category?: string | null) {
  return category?.startsWith("DONE") ?? false
}

export function isSameDay(a: Date, b: Date) {
  return (
    a.getDate() === b.getDate() &&
    a.getMonth() === b.getMonth() &&
    a.getFullYear() === b.getFullYear()
  )
}

export function toDate(value?: string | Date | null) {
  if (!value) return null
  return value instanceof Date ? value : new Date(value)
}

export function cardMatchesDate(card: PlannerCard, date: Date) {
  const start = toDate(card.startDate)
  const due = toDate(card.dueDate)
  return (start && isSameDay(start, date)) || (due && isSameDay(due, date))
}

export function groupPlannerCards(cards: PlannerCard[]) {
  const unplanned: PlannerCard[] = []
  const scheduled: PlannerCard[] = []
  const done: PlannerCard[] = []

  cards.forEach((card) => {
    if (isDoneCategory(card.column?.category)) {
      done.push(card)
    } else if (card.startDate || card.dueDate) {
      scheduled.push(card)
    } else {
      unplanned.push(card)
    }
  })

  return { unplanned, scheduled, done }
}

export function getCardsForDate(cards: PlannerCard[], date: Date) {
  return cards.filter(
    (card) => !isDoneCategory(card.column?.category) && cardMatchesDate(card, date),
  )
}

export function generateCalendarDays(date: Date) {
  const year = date.getFullYear()
  const month = date.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const offset = firstDay === 0 ? 6 : firstDay - 1

  const days: (Date | null)[] = []
  for (let i = 0; i < offset; i++) days.push(null)
  for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i))
  return days
}

export function getDueDiffDays(dueDate?: string | Date | null) {
  const due = toDate(dueDate)
  if (!due) return null
  return Math.ceil((due.getTime() - Date.now()) / (1000 * 3600 * 24))
}
