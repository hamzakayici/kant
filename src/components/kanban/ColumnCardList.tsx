"use client"

import { memo, useEffect, useMemo } from "react"
import { useVirtualizer } from "@tanstack/react-virtual"
import { KanbanCardSkeleton } from "@/components/kanban/KanbanCardSkeleton"
import { VirtualKanbanRow } from "@/components/kanban/VirtualKanbanRow"
import { useColumnScrollRoot } from "@/components/Column"
import { useKanbanBoardDndOptional } from "@/components/kanban/KanbanBoardDndContext"
import { useColumnDragUi } from "@/components/kanban/useColumnDragUi"
import { buildColumnPreviewCards } from "@/lib/kanban-column-preview"
import {
  KANBAN_CARD_ESTIMATE_HEIGHT,
  KANBAN_CARD_ROW_GAP,
} from "@/lib/kanban-utils"

type ColumnCardListProps = {
  columnId: string
  cards: any[]
  displayCards: any[]
  hasActiveFilters: boolean
  userRole: string
  boardIdentifier: string
  isCreatingCard?: boolean
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
  onDeleteCard,
  onShareCard,
  onOpenCard,
}: ColumnCardListProps) {
  const scrollRoot = useColumnScrollRoot()
  const dnd = useKanbanBoardDndOptional()
  const columnDragUi = useColumnDragUi(columnId)
  const isPreviewActive = columnDragUi !== null
  const canDelete = userRole === "ADMIN"

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
    () => buildColumnPreviewCards(baseOrderedCards, columnId, columnDragUi),
    [baseOrderedCards, columnDragUi, columnId],
  )

  const virtualizer = useVirtualizer({
    count: orderedCards.length,
    getScrollElement: () => scrollRoot,
    estimateSize: () => KANBAN_CARD_ESTIMATE_HEIGHT,
    gap: KANBAN_CARD_ROW_GAP,
    overscan: isPreviewActive ? 2 : 4,
    getItemKey: (index) => orderedCards[index]?.id ?? index,
  })

  const measureElement = isPreviewActive ? undefined : virtualizer.measureElement
  const virtualItems = virtualizer.getVirtualItems()

  return (
    <>
      {isCreatingCard ? <KanbanCardSkeleton /> : null}
      {orderedCards.length === 0 ? null : (
        <div
          className="relative w-full"
          style={{ height: virtualizer.getTotalSize() }}
        >
          {virtualItems.map((virtualRow) => {
            const card = orderedCards[virtualRow.index]
            if (!card) return null

            return (
              <VirtualKanbanRow
                key={card.id}
                card={card}
                index={virtualRow.index}
                top={virtualRow.start}
                isAnimating={isPreviewActive}
                measureRef={measureElement}
                canDelete={canDelete}
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

export const ColumnCardList = memo(ColumnCardListComponent)
