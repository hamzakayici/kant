"use client"
import { memo, useEffect, useMemo, useRef } from "react"
import { KanbanCardSkeleton } from "@/components/kanban/KanbanCardSkeleton"
import { KanbanDropSlot } from "@/components/kanban/KanbanDropIndicator"
import { KanbanCard } from "@/components/kanban/KanbanCard"
import { useKanbanBoardDndOptional } from "@/components/kanban/KanbanBoardDndContext"
import { useColumnDragUi } from "@/components/kanban/useColumnDragUi"
import {
  buildColumnDragCards,
} from "@/lib/kanban-column-preview"

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
  const dnd = useKanbanBoardDndOptional()
  const columnDragUi = useColumnDragUi(columnId)
  const isDraggingCurrentColumn = columnDragUi?.dropHint.columnId === columnId

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

  const cardsWithSlot = useMemo(() => {
    if (!columnDragUi || !isDraggingCurrentColumn) {
      return orderedCards
    }
    const result = [...orderedCards]
    result.splice(columnDragUi.dropHint.index, 0, { isDropSlot: true } as any)
    return result
  }, [orderedCards, columnDragUi, isDraggingCurrentColumn])

  const hasCards = orderedCards.length > 0

  return (
    <>
      {isCreatingCard ? <KanbanCardSkeleton /> : null}

      {hasCards || isCreatingCard || isDraggingCurrentColumn ? (
        <div className="flex flex-col gap-2 relative w-full pb-10">
          {cardsWithSlot.map((item, index) => {
            if (item.isDropSlot) {
              return (
                <KanbanDropSlot 
                  key={`drop-${columnId}-${index}`} 
                  variant="target"
                />
              )
            }

            const card = item
            return (
              <KanbanCard
                key={card.id}
                card={card}
                index={index}
                canDelete={canDeleteCard}
                boardIdentifier={boardIdentifier}
                onDeleteCard={onDeleteCard}
                onShareCard={onShareCard}
                onOpenCard={onOpenCard}
              />
            )
          })}
        </div>
      ) : null}
    </>
  )
}
export const ColumnCardList = memo(ColumnCardListComponent)
