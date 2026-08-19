"use client"

import { memo, useEffect, useMemo } from "react"
import { useVirtualizer } from "@tanstack/react-virtual"
import { KanbanCardSkeleton } from "@/components/kanban/KanbanCardSkeleton"
import { KanbanDropSlot } from "@/components/kanban/KanbanDropIndicator"
import { VirtualKanbanRow } from "@/components/kanban/VirtualKanbanRow"
import { useColumnScrollRoot } from "@/components/kanban/ColumnDropScroll"
import { useKanbanBoardDndOptional } from "@/components/kanban/KanbanBoardDndContext"
import { useColumnDragUi } from "@/components/kanban/useColumnDragUi"
import {
  buildColumnDragCards,
  getColumnDropIndicatorIndex,
} from "@/lib/kanban-column-preview"
import {
  KANBAN_CARD_ESTIMATE_HEIGHT,
  KANBAN_CARD_ROW_GAP,
} from "@/lib/kanban-utils"

const DROP_INDICATOR_HEIGHT = KANBAN_CARD_ESTIMATE_HEIGHT

type ColumnCardListProps = {
  columnId: string
  cards: any[]
  displayCards: any[]
  hasActiveFilters: boolean
  userRole: string
  boardIdentifier: string
  isCreatingCard?: boolean
  canDeleteCard?: boolean
  onDeleteCard: (cardId: string) => void
  onShareCard: (card: any) => void
  onOpenCard: (card: any) => void
}

function ColumnCardListComponent({
  columnId,
  cards,
  displayCards,
  hasActiveFilters,
  userRole,
  boardIdentifier,
  isCreatingCard = false,
  canDeleteCard = false,
  onDeleteCard,
  onShareCard,
  onOpenCard,
}: ColumnCardListProps) {
  const scrollRoot = useColumnScrollRoot()
  const dnd = useKanbanBoardDndOptional()
  const columnDragUi = useColumnDragUi(columnId)
  const isPreviewActive = columnDragUi !== null

  useEffect(() => {
    if (!dnd || !scrollRoot) return
    dnd.registerColumnScroll(columnId, scrollRoot)
    return () => dnd.registerColumnScroll(columnId, null)
  }, [columnId, dnd, scrollRoot])

  const filterVisibleIds = useMemo(
    () => new Set(displayCards.map((card) => card.id)),
    [displayCards],
  )

  const baseOrderedCards = useMemo(() => {
    if (!hasActiveFilters) return cards
    return cards.filter((card) => filterVisibleIds.has(card.id))
  }, [cards, filterVisibleIds, hasActiveFilters])

  const orderedCards = useMemo(
    () => buildColumnDragCards(baseOrderedCards, columnId, columnDragUi),
    [baseOrderedCards, columnDragUi, columnId],
  )

  const dropIndicatorIndex = useMemo(() => {
    if (!columnDragUi || columnDragUi.dropHint.columnId !== columnId) {
      return null
    }
    return getColumnDropIndicatorIndex(
      orderedCards,
      columnId,
      columnDragUi,
      baseOrderedCards,
    )
  }, [orderedCards, columnId, columnDragUi, baseOrderedCards])

  const virtualCount =
    orderedCards.length + (dropIndicatorIndex !== null ? 1 : 0)

  const virtualizer = useVirtualizer({
    count: virtualCount,
    getScrollElement: () => scrollRoot,
    estimateSize: (index) =>
      dropIndicatorIndex !== null && index === dropIndicatorIndex
        ? DROP_INDICATOR_HEIGHT
        : KANBAN_CARD_ESTIMATE_HEIGHT,
    gap: KANBAN_CARD_ROW_GAP,
    overscan: isPreviewActive ? 6 : 4,
    getItemKey: (index) => {
      if (dropIndicatorIndex !== null && index === dropIndicatorIndex) {
        return `drop-${columnId}-${dropIndicatorIndex}`
      }
      const card = orderedCards[mapVirtualIndex(index, dropIndicatorIndex)]
      return card?.id ?? index
    },
  })

  const measureElement = isPreviewActive ? undefined : virtualizer.measureElement
  const virtualItems = virtualizer.getVirtualItems()

  return (
    <>
      {isCreatingCard ? <KanbanCardSkeleton /> : null}
      {orderedCards.length === 0 && dropIndicatorIndex === null ? null : (
        <div
          className="relative w-full"
          style={{ height: virtualizer.getTotalSize() }}
        >
          {virtualItems.map((virtualRow) => {
            if (
              dropIndicatorIndex !== null &&
              virtualRow.index === dropIndicatorIndex
            ) {
              return (
                <div
                  key={`drop-${columnId}-${dropIndicatorIndex}`}
                  className="absolute top-0 left-0 z-10 w-full shrink-0"
                  style={{
                    transform: `translate3d(0, ${virtualRow.start}px, 0)`,
                    contain: "layout style paint",
                  }}
                >
                  <KanbanDropSlot variant="target" />
                </div>
              )
            }

            const cardIndex = mapVirtualIndex(
              virtualRow.index,
              dropIndicatorIndex,
            )
            const card = orderedCards[cardIndex]
            if (!card) return null

            return (
              <VirtualKanbanRow
                key={card.id}
                card={card}
                index={cardIndex}
                top={virtualRow.start}
                isDragging={isPreviewActive}
                measureRef={measureElement}
                canDelete={canDeleteCard}
                boardIdentifier={boardIdentifier}
                onDeleteCard={onDeleteCard}
                onShareCard={onShareCard}
                onOpenCard={onOpenCard}
              />
            )
          })}
        </div>
      )}
    </>
  )
}

function mapVirtualIndex(
  virtualIndex: number,
  dropIndicatorIndex: number | null,
) {
  if (dropIndicatorIndex === null || virtualIndex < dropIndicatorIndex) {
    return virtualIndex
  }
  return virtualIndex - 1
}

export const ColumnCardList = memo(ColumnCardListComponent)
