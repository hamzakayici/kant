export function getPriorityBadgeClass(priority: string) {
  switch (priority) {
    case "LOW":
      return "bg-blue-500/15 text-blue-300 border-blue-500/20"
    case "MEDIUM":
      return "bg-purple-500/15 text-purple-300 border-purple-500/20"
    case "HIGH":
      return "bg-orange-500/15 text-orange-300 border-orange-500/20"
    case "URGENT":
      return "bg-destructive/15 text-destructive border-destructive/20"
    default:
      return "bg-muted text-muted-foreground border-border"
  }
}

export function getPriorityLabel(priority: string) {
  switch (priority) {
    case "LOW":
      return "Düşük"
    case "MEDIUM":
      return "Orta"
    case "HIGH":
      return "Yüksek"
    case "URGENT":
      return "Acil"
    default:
      return priority
  }
}

export function getDueDateClass(diffDays: number) {
  if (diffDays < 0) return "bg-destructive/20 text-destructive font-bold"
  if (diffDays <= 2) return "bg-orange-500/20 text-orange-400 font-semibold"
  if (diffDays <= 7) return "bg-yellow-500/20 text-yellow-400 font-medium"
  return "bg-muted text-muted-foreground"
}
