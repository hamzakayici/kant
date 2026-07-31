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
): number {
  if (visibleCount === 0) return 0

  const rect = scrollEl.getBoundingClientRect()
  const yInContent =
    clientY - rect.top + scrollEl.scrollTop - SCROLL_PADDING_TOP
  const rawIndex = Math.floor((yInContent + rowHeight * 0.5) / rowHeight)

  return clampIndex(rawIndex, visibleCount)
}

function mapVisibleInsertToFullIndex<T extends { id: string }>(
  visibleInsertIndex: number,
  fullCards: T[],
  visibleCards: T[],
): number {
  if (visibleInsertIndex >= visibleCards.length) {
    return fullCards.length
  }
  const targetId = visibleCards[visibleInsertIndex]?.id
  if (!targetId) return fullCards.length
  const fullIndex = fullCards.findIndex((card) => card.id === targetId)
  return fullIndex === -1 ? fullCards.length : fullIndex
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

  for (const el of cardEls) {
    if (el.dataset.dragging === "true") continue
    if (activeCardId && el.dataset.kanbanCard === activeCardId) continue

    const rect = el.getBoundingClientRect()
    if (clientY < rect.top + rect.height * 0.5) {
      const visibleIndex = Number(el.dataset.kanbanIndex)
      if (!Number.isFinite(visibleIndex)) return 0
      return mapVisibleInsertToFullIndex(
        clampIndex(visibleIndex, visibleCards.length),
        fullCards,
        visibleCards,
      )
    }
  }

  return fullCards.length
}

/** Resolve full-array insert index from pointer position in the visible card list. */
export function computeDropIndex<T extends { id: string }>(
  scrollEl: HTMLElement,
  clientY: number,
  fullCards: T[],
  visibleCards: T[],
  activeCardId?: string,
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
  )
  return mapVisibleInsertToFullIndex(visibleInsert, fullCards, visibleCards)
}
