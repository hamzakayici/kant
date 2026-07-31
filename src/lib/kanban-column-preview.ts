import { arrayMove } from "@dnd-kit/sortable"
import type { ColumnDragUiSnapshot } from "@/lib/kanban-drag-ui-store"

function hasSameOrder<T extends { id: string }>(left: T[], right: T[]) {
  if (left.length !== right.length) return false
  for (let i = 0; i < left.length; i += 1) {
    if (left[i]?.id !== right[i]?.id) return false
  }
  return true
}

export function buildColumnPreviewCards<T extends { id: string }>(
  cards: T[],
  columnId: string,
  dragUi: ColumnDragUiSnapshot | null,
): T[] {
  if (!dragUi) return cards

  const { activeCardId, sourceColumnId, activeCard, dropHint } = dragUi
  const isSource = sourceColumnId === columnId
  const isTarget = dropHint.columnId === columnId

  if (!isSource && !isTarget) return cards

  if (isSource && isTarget) {
    const activeIndex = cards.findIndex((card) => card.id === activeCardId)
    if (activeIndex === -1) return cards
    const insertIndex = Math.max(0, Math.min(dropHint.index, cards.length))
    if (activeIndex === insertIndex) return cards
    const next = arrayMove(
      cards,
      activeIndex,
      insertIndex >= cards.length ? cards.length - 1 : insertIndex,
    )
    return hasSameOrder(cards, next) ? cards : next
  }

  if (isSource) {
    const next = cards.filter((card) => card.id !== activeCardId)
    return hasSameOrder(cards, next) ? cards : next
  }

  const next = [...cards]
  const insertIndex = Math.max(0, Math.min(dropHint.index, next.length))
  if (next.some((card) => card.id === activeCardId)) return cards
  next.splice(insertIndex, 0, activeCard as T)
  return hasSameOrder(cards, next) ? cards : next
}
