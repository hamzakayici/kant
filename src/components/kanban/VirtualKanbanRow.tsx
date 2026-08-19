"use client"

import { memo } from "react"
import { KanbanCard } from "@/components/kanban/KanbanCard"

type VirtualKanbanRowProps = {
  card: any
  index: number
  virtualIndex: number
  top: number
  isDragging: boolean
  measureRef?: (element: HTMLElement | null) => void
  canDelete: boolean
  boardIdentifier: string
  onDeleteCard: (cardId: string) => void
  onShareCard: (card: any) => void
  onOpenCard: (card: any) => void
}

function VirtualKanbanRowComponent({
  card,
  index,
  virtualIndex,
  top,
  isDragging,
  measureRef,
  canDelete,
  boardIdentifier,
  onDeleteCard,
  onShareCard,
  onOpenCard,
}: VirtualKanbanRowProps) {
  return (
    <div
      data-index={virtualIndex}
      ref={measureRef}
      className="absolute top-0 left-0 w-full shrink-0 [backface-visibility:hidden]"
      style={{
        transform: `translate3d(0, ${top}px, 0)`,
        willChange: isDragging ? "transform" : undefined,
      }}
    >
      <KanbanCard
        card={card}
        index={index}
        canDelete={canDelete}
        boardIdentifier={boardIdentifier}
        onDeleteCard={onDeleteCard}
        onShareCard={onShareCard}
        onOpenCard={onOpenCard}
      />
    </div>
  )
}

export const VirtualKanbanRow = memo(
  VirtualKanbanRowComponent,
  (prev, next) =>
    prev.card === next.card &&
    prev.index === next.index &&
    prev.virtualIndex === next.virtualIndex &&
    prev.top === next.top &&
    prev.isDragging === next.isDragging &&
    prev.measureRef === next.measureRef &&
    prev.canDelete === next.canDelete &&
    prev.boardIdentifier === next.boardIdentifier &&
    prev.onDeleteCard === next.onDeleteCard &&
    prev.onShareCard === next.onShareCard &&
    prev.onOpenCard === next.onOpenCard,
)
