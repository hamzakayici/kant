import type { ColumnDragUiSnapshot } from "@/lib/kanban-drag-ui-store"

function hasSameOrder<T extends { id: string }>(left: T[], right: T[]) {
  if (left.length !== right.length) return false
  for (let i = 0; i < left.length; i += 1) {
    if (left[i]?.id !== right[i]?.id) return false
  }
  return true
}

/** During drag: only hide the active card in its source column — no full array reorder. */
export function buildColumnDragCards<T extends { id: string }>(
  cards: T[],
  columnId: string,
  dragUi: ColumnDragUiSnapshot | null,
): T[] {
  if (!dragUi || dragUi.sourceColumnId !== columnId) return cards

  const next = cards.filter((card) => card.id !== dragUi.activeCardId)
  return hasSameOrder(cards, next) ? cards : next
}

/** Virtual row index for a drop-gap indicator (avoids arrayMove on large columns). */
export function getColumnDropIndicatorIndex(
  visibleCards: { id: string }[],
  columnId: string,
  dragUi: ColumnDragUiSnapshot | null,
  sourceCards: { id: string }[],
): number | null {
  if (!dragUi || dragUi.dropHint.columnId !== columnId) return null

  let index = dragUi.dropHint.index

  if (dragUi.sourceColumnId === columnId) {
    const activeIndex = sourceCards.findIndex(
      (card) => card.id === dragUi.activeCardId,
    )
    if (activeIndex !== -1 && index > activeIndex) {
      index -= 1
    }
  }

  return Math.max(0, Math.min(index, visibleCards.length))
}

/** @deprecated Use buildColumnDragCards — kept for compatibility during migration */
export function buildColumnPreviewCards<T extends { id: string }>(
  cards: T[],
  columnId: string,
  dragUi: ColumnDragUiSnapshot | null,
): T[] {
  return buildColumnDragCards(cards, columnId, dragUi)
}
