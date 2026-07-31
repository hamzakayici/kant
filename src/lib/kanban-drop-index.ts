import { KANBAN_CARD_ESTIMATE_HEIGHT, KANBAN_CARD_ROW_GAP } from "@/lib/kanban-utils"

const rowHeight = KANBAN_CARD_ESTIMATE_HEIGHT + KANBAN_CARD_ROW_GAP
const SCROLL_PADDING_TOP = 6

/** O(1) drop index from pointer + scroll — no DOM walks during drag. */
export function computeDropIndex(
  scrollEl: HTMLElement,
  clientY: number,
  cardCount: number,
): number {
  if (cardCount === 0) return 0

  const rect = scrollEl.getBoundingClientRect()
  const yInContent =
    clientY - rect.top + scrollEl.scrollTop - SCROLL_PADDING_TOP
  const rawIndex = Math.floor((yInContent + rowHeight * 0.5) / rowHeight)

  if (rawIndex < 0) return 0
  if (rawIndex >= cardCount) return cardCount
  return rawIndex
}
