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

/** Map full-array insert index to virtual row index in the visible card list. */
export function getColumnDropIndicatorIndex(
  visibleCards: { id: string }[],
  columnId: string,
  dragUi: ColumnDragUiSnapshot | null,
  fullCards: { id: string }[],
): number | null {
  if (!dragUi || dragUi.dropHint.columnId !== columnId) return null

  const activeCardId =
    dragUi.sourceColumnId === columnId ? dragUi.activeCardId : undefined

  let visibleInsert = 0
  for (let i = 0; i < dragUi.dropHint.index; i++) {
    if (fullCards[i]?.id !== activeCardId) {
      visibleInsert += 1
    }
  }

  return Math.max(0, Math.min(visibleInsert, visibleCards.length))
}

/** @deprecated Use buildColumnDragCards — kept for compatibility during migration */
export function buildColumnPreviewCards<T extends { id: string }>(
  cards: T[],
  columnId: string,
  dragUi: ColumnDragUiSnapshot | null,
): T[] {
  return buildColumnDragCards(cards, columnId, dragUi)
}
