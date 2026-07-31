import { arrayMove } from "@dnd-kit/sortable"
import type { UniqueIdentifier } from "@dnd-kit/core"

export type CardDropHint = {
  columnId: string
  index: number
}

type BoardColumn = {
  id: string
  cards: { id: string; columnId?: string }[]
}

export function getColumnDropId(columnId: string) {
  return `column-drop-${columnId}`
}

export function resolveColumnIndex(
  id: UniqueIdentifier,
  columns: BoardColumn[],
) {
  if (typeof id === "string" && id.startsWith("column-drop-")) {
    const columnId = id.slice("column-drop-".length)
    return columns.findIndex((col) => col.id === columnId)
  }
  const byColumnId = columns.findIndex((col) => col.id === id)
  if (byColumnId !== -1) return byColumnId
  return columns.findIndex((col) => col.cards.some((card) => card.id === id))
}

export function isColumnContainerId(id: UniqueIdentifier, column: BoardColumn) {
  return column.id === id || getColumnDropId(column.id) === id
}

export function applyColumnReorder(
  columns: BoardColumn[],
  activeId: UniqueIdentifier,
  overId: UniqueIdentifier,
): BoardColumn[] | null {
  const activeIndex = columns.findIndex((col) => col.id === activeId)
  const overIndex = columns.findIndex(
    (col) => col.id === overId || getColumnDropId(col.id) === overId,
  )
  if (activeIndex === -1 || overIndex === -1 || activeIndex === overIndex) {
    return null
  }
  return arrayMove(columns, activeIndex, overIndex)
}

export function applyCardDragOver(
  columns: BoardColumn[],
  activeId: UniqueIdentifier,
  overId: UniqueIdentifier,
): { columns: BoardColumn[] | null; columnIds: string[] } {
  const activeColumnIndex = columns.findIndex((col) =>
    col.cards.some((card) => card.id === activeId),
  )
  if (activeColumnIndex === -1) {
    return { columns: null, columnIds: [] }
  }

  const overColumnIndex = resolveColumnIndex(overId, columns)
  if (overColumnIndex === -1) {
    return { columns: null, columnIds: [] }
  }

  const overColumn = columns[overColumnIndex]
  const isOverColumn = isColumnContainerId(overId, overColumn)
  const touched = [columns[activeColumnIndex].id, overColumn.id]

  if (activeColumnIndex === overColumnIndex) {
    const activeIndex = columns[activeColumnIndex].cards.findIndex(
      (card) => card.id === activeId,
    )
    const overIndex = isOverColumn
      ? columns[overColumnIndex].cards.length - 1
      : columns[overColumnIndex].cards.findIndex((card) => card.id === overId)

    if (activeIndex === -1 || overIndex === -1 || activeIndex === overIndex) {
      return { columns: null, columnIds: touched }
    }

    const nextCards = arrayMove(
      columns[activeColumnIndex].cards,
      activeIndex,
      overIndex,
    )
    const nextColumns = [...columns]
    nextColumns[activeColumnIndex] = {
      ...columns[activeColumnIndex],
      cards: nextCards,
    }
    return { columns: nextColumns, columnIds: touched }
  }

  const activeItems = [...columns[activeColumnIndex].cards]
  const overItems = [...columns[overColumnIndex].cards]
  const activeIndex = activeItems.findIndex((card) => card.id === activeId)
  if (activeIndex === -1) {
    return { columns: null, columnIds: touched }
  }

  const overIndex = isOverColumn
    ? overItems.length
    : overItems.findIndex((card) => card.id === overId)

  const [item] = activeItems.splice(activeIndex, 1)
  item.columnId = overColumn.id
  overItems.splice(overIndex >= 0 ? overIndex : overItems.length, 0, item)

  const nextColumns = [...columns]
  nextColumns[activeColumnIndex] = {
    ...columns[activeColumnIndex],
    cards: activeItems,
  }
  nextColumns[overColumnIndex] = {
    ...columns[overColumnIndex],
    cards: overItems,
  }

  return { columns: nextColumns, columnIds: touched }
}

export function applyCardMoveAtIndex(
  columns: BoardColumn[],
  activeId: UniqueIdentifier,
  targetColumnId: string,
  targetIndex: number,
): BoardColumn[] | null {
  const activeColumnIndex = columns.findIndex((col) =>
    col.cards.some((card) => card.id === activeId),
  )
  if (activeColumnIndex === -1) return null

  const overColumnIndex = columns.findIndex((col) => col.id === targetColumnId)
  if (overColumnIndex === -1) return null

  const activeItems = [...columns[activeColumnIndex].cards]
  const overItems = [...columns[overColumnIndex].cards]
  const activeIndex = activeItems.findIndex((card) => card.id === activeId)
  if (activeIndex === -1) return null

  let insertIndex = Math.max(0, Math.min(targetIndex, overItems.length))

  if (activeColumnIndex === overColumnIndex) {
    if (activeIndex === insertIndex) {
      return null
    }
    const nextCards = arrayMove(activeItems, activeIndex, insertIndex)
    const nextColumns = [...columns]
    nextColumns[activeColumnIndex] = {
      ...columns[activeColumnIndex],
      cards: nextCards,
    }
    return nextColumns
  }

  const [item] = activeItems.splice(activeIndex, 1)
  item.columnId = targetColumnId
  if (insertIndex > overItems.length) {
    insertIndex = overItems.length
  }
  overItems.splice(insertIndex, 0, item)

  const nextColumns = [...columns]
  nextColumns[activeColumnIndex] = {
    ...columns[activeColumnIndex],
    cards: activeItems,
  }
  nextColumns[overColumnIndex] = {
    ...columns[overColumnIndex],
    cards: overItems,
  }

  return nextColumns
}
