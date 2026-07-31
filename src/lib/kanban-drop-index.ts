import { KANBAN_CARD_ESTIMATE_HEIGHT, KANBAN_CARD_ROW_GAP } from "@/lib/kanban-utils"

const rowHeight = KANBAN_CARD_ESTIMATE_HEIGHT + KANBAN_CARD_ROW_GAP

export function computeDropIndex(
  scrollEl: HTMLElement,
  clientY: number,
  cardCount: number,
  activeCardId?: string,
): number {
  if (cardCount === 0) return 0

  const cardEls = scrollEl.querySelectorAll<HTMLElement>("[data-kanban-card]")
  if (cardEls.length > 0) {
    for (const el of cardEls) {
      if (el.dataset.kanbanCard === activeCardId) continue

      const rect = el.getBoundingClientRect()
      if (clientY < rect.top + rect.height * 0.5) {
        const dataIndex = Number(el.dataset.kanbanIndex)
        return Number.isFinite(dataIndex)
          ? Math.max(0, Math.min(cardCount, dataIndex))
          : 0
      }
    }
    return cardCount
  }

  const rect = scrollEl.getBoundingClientRect()
  const yInContent = clientY - rect.top + scrollEl.scrollTop - 6
  const estimated = Math.floor(yInContent / rowHeight)
  return Math.max(0, Math.min(cardCount, estimated))
}
