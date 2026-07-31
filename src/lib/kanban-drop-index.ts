import { KANBAN_CARD_ESTIMATE_HEIGHT, KANBAN_CARD_ROW_GAP } from "@/lib/kanban-utils"

const rowHeight = KANBAN_CARD_ESTIMATE_HEIGHT + KANBAN_CARD_ROW_GAP
const SCROLL_PADDING_TOP = 6

function clampIndex(index: number, max: number) {
  return Math.max(0, Math.min(index, max))
}

function computeVisibleInsertIndex(
  scrollEl: HTMLElement,
  clientY: number,
  visibleCount: number,
  dropIndicatorIndex: number | null = null,
): number {
  if (visibleCount === 0) return 0

  const rect = scrollEl.getBoundingClientRect()
  const yInContent =
    clientY - rect.top + scrollEl.scrollTop - SCROLL_PADDING_TOP
  let rawIndex = Math.floor(yInContent / rowHeight)

  // The dashed drop slot shifts cards below it down by one row in the virtual list.
  if (dropIndicatorIndex !== null && rawIndex > dropIndicatorIndex) {
    rawIndex -= 1
  }

  return clampIndex(rawIndex, visibleCount)
}

/**
 * Map a visible-list insert position to the drop index used by arrayMove / moveCard.
 * Cross-column: splice index (insert before target card).
 * Same-column: final position after removal (arrayMove `to`).
 */
export function mapVisibleInsertToDropIndex<T extends { id: string }>(
  visibleInsertIndex: number,
  fullCards: T[],
  visibleCards: T[],
  activeCardId?: string,
): number {
  if (visibleInsertIndex >= visibleCards.length) {
    return fullCards.length
  }

  const targetId = visibleCards[visibleInsertIndex]?.id
  if (!targetId) return fullCards.length

  const targetFullIndex = fullCards.findIndex((card) => card.id === targetId)
  if (targetFullIndex === -1) return fullCards.length

  if (!activeCardId) {
    return targetFullIndex
  }

  const activeIndex = fullCards.findIndex((card) => card.id === activeCardId)
  if (activeIndex === -1) {
    return targetFullIndex
  }

  if (activeIndex < targetFullIndex) {
    return targetFullIndex - 1
  }

  return targetFullIndex
}

function countRenderedVisibleCards(
  cardEls: NodeListOf<HTMLElement>,
  activeCardId?: string,
) {
  let count = 0
  for (const el of cardEls) {
    if (el.dataset.dragging === "true") continue
    if (activeCardId && el.dataset.kanbanCard === activeCardId) continue
    count += 1
  }
  return count
}

function computeFromDom<T extends { id: string }>(
  scrollEl: HTMLElement,
  clientY: number,
  fullCards: T[],
  visibleCards: T[],
  activeCardId?: string,
): number | null {
  const cardEls = scrollEl.querySelectorAll<HTMLElement>("[data-kanban-card]")
  if (cardEls.length === 0) return null

  // Virtual lists only mount a subset of cards — DOM hit-testing is unreliable then.
  if (countRenderedVisibleCards(cardEls, activeCardId) < visibleCards.length) {
    return null
  }

  for (const el of cardEls) {
    if (el.dataset.dragging === "true") continue
    if (activeCardId && el.dataset.kanbanCard === activeCardId) continue

    const rect = el.getBoundingClientRect()
    if (clientY < rect.top + rect.height * 0.5) {
      const visibleIndex = Number(el.dataset.kanbanIndex)
      if (!Number.isFinite(visibleIndex)) return 0
      return mapVisibleInsertToDropIndex(
        clampIndex(visibleIndex, visibleCards.length),
        fullCards,
        visibleCards,
        activeCardId,
      )
    }
  }

  return fullCards.length
}

/** Resolve drop index from pointer position in the visible card list. */
export function computeDropIndex<T extends { id: string }>(
  scrollEl: HTMLElement,
  clientY: number,
  fullCards: T[],
  visibleCards: T[],
  activeCardId?: string,
  dropIndicatorIndex: number | null = null,
): number {
  if (fullCards.length === 0) return 0

  const domIndex = computeFromDom(
    scrollEl,
    clientY,
    fullCards,
    visibleCards,
    activeCardId,
  )
  if (domIndex !== null) {
    return domIndex
  }

  const visibleInsert = computeVisibleInsertIndex(
    scrollEl,
    clientY,
    visibleCards.length,
    dropIndicatorIndex,
  )
  return mapVisibleInsertToDropIndex(
    visibleInsert,
    fullCards,
    visibleCards,
    activeCardId,
  )
}
