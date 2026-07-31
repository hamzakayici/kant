"use client"

import { memo, useCallback } from "react"
import Column from "@/components/Column"
import { ColumnCardList } from "@/components/kanban/ColumnCardList"

type KanbanColumnSlotProps = {
  column: any
  displayCards: any[]
  hasActiveFilters: boolean
  userRole: string
  boardIdentifier: string
  allRoles: any[]
  canReorderColumn: boolean
  canAddCard: boolean
  isAdding: boolean
  isCreating: boolean
  newCardTitle: string
  onStartAdd: (columnId: string) => void
  onCancelAdd: () => void
  onCardTitleChange: (value: string) => void
  onSubmitAdd: (e?: React.FormEvent) => void
  onDeleteCard: (cardId: string) => void
  onShareCard: (card: any) => void
  onOpenCard: (card: any) => void
}

function KanbanColumnSlotComponent({
  column,
  displayCards,
  hasActiveFilters,
  userRole,
  boardIdentifier,
  allRoles,
  canReorderColumn,
  canAddCard,
  isAdding,
  isCreating,
  newCardTitle,
  onStartAdd,
  onCancelAdd,
  onCardTitleChange,
  onSubmitAdd,
  onDeleteCard,
  onShareCard,
  onOpenCard,
}: KanbanColumnSlotProps) {
  const handleStartAdd = useCallback(() => {
    onStartAdd(column.id)
  }, [column.id, onStartAdd])

  return (
    <Column
      column={column}
      allRoles={allRoles}
      userRole={userRole}
      canReorderColumn={canReorderColumn}
      cardCount={hasActiveFilters ? displayCards.length : column.cards.length}
      totalCardCount={column.cards.length}
      canAddCard={canAddCard}
      isAdding={isAdding}
      newCardTitle={newCardTitle}
      onStartAdd={handleStartAdd}
      onCancelAdd={onCancelAdd}
      onCardTitleChange={onCardTitleChange}
      onSubmitAdd={onSubmitAdd}
    >
      <ColumnCardList
        columnId={column.id}
        cards={column.cards}
        displayCards={displayCards}
        hasActiveFilters={hasActiveFilters}
        userRole={userRole}
        boardIdentifier={boardIdentifier}
        isCreatingCard={isCreating}
        onDeleteCard={onDeleteCard}
        onShareCard={onShareCard}
        onOpenCard={onOpenCard}
      />
    </Column>
  )
}

export const KanbanColumnSlot = memo(
  KanbanColumnSlotComponent,
  (prev, next) =>
    prev.column === next.column &&
    prev.displayCards === next.displayCards &&
    prev.hasActiveFilters === next.hasActiveFilters &&
    prev.userRole === next.userRole &&
    prev.boardIdentifier === next.boardIdentifier &&
    prev.allRoles === next.allRoles &&
    prev.canReorderColumn === next.canReorderColumn &&
    prev.canAddCard === next.canAddCard &&
    prev.isAdding === next.isAdding &&
    prev.isCreating === next.isCreating &&
    prev.newCardTitle === next.newCardTitle &&
    prev.onStartAdd === next.onStartAdd &&
    prev.onCancelAdd === next.onCancelAdd &&
    prev.onCardTitleChange === next.onCardTitleChange &&
    prev.onSubmitAdd === next.onSubmitAdd &&
    prev.onDeleteCard === next.onDeleteCard &&
    prev.onShareCard === next.onShareCard &&
    prev.onOpenCard === next.onOpenCard,
)
