export const COLUMN_CATEGORY_LABELS: Record<string, string> = {
  BACKLOG: "Bekleme",
  UNSTARTED: "Başlanmadı",
  ACTIVE: "Aktif",
  "DONE STATUS / WON": "Tamamlandı",
  "DONE STATUS / LOST": "Kaybedildi",
}

export function getColumnCategoryLabel(category?: string | null) {
  if (!category) return null
  return COLUMN_CATEGORY_LABELS[category] ?? category
}

export function hexToRgba(hex: string, alpha: number) {
  const normalized = hex.replace("#", "")
  if (normalized.length !== 6) return `rgba(87, 157, 255, ${alpha})`
  const r = parseInt(normalized.slice(0, 2), 16)
  const g = parseInt(normalized.slice(2, 4), 16)
  const b = parseInt(normalized.slice(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

export function buildBoardColumnsSignature(
  boardId: string,
  columns: { id: string; cards: { id: string }[] }[],
) {
  let signature = boardId
  for (const column of columns) {
    signature += `|${column.id}:${column.cards.length}`
    for (const card of column.cards) {
      signature += `,${card.id}`
    }
  }
  return signature
}

export const COLUMN_CARDS_INITIAL_LIMIT = 24
export const COLUMN_CARDS_LOAD_STEP = 24

/** Virtual row height estimate (card + gap) for drop index fallback */
export const KANBAN_CARD_ESTIMATE_HEIGHT = 76
export const KANBAN_CARD_ROW_GAP = 8
