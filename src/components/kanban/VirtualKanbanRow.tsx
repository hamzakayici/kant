"use client"

import { memo } from "react"
import { KanbanCard } from "@/components/kanban/KanbanCard"

type VirtualKanbanRowProps = {
  card: any
  index: number
  top: number
  isAnimating: boolean
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
  top,
  isAnimating,
  measureRef,
  canDelete,
  boardIdentifier,
  onDeleteCard,
  onShareCard,
  onOpenCard,
}: VirtualKanbanRowProps) {
  return (
    <div
      data-index={index}
      ref={measureRef}
      className="absolute top-0 left-0 w-full shrink-0 [backface-visibility:hidden]"
      style={{
        transform: `translate3d(0, ${top}px, 0)`,
        transition: isAnimating
          ? "transform 120ms cubic-bezier(0.25, 1, 0.5, 1)"
          : undefined,
        contain: "layout style paint",
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
    prev.top === next.top &&
    prev.isAnimating === next.isAnimating &&
    prev.measureRef === next.measureRef &&
    prev.canDelete === next.canDelete &&
    prev.boardIdentifier === next.boardIdentifier &&
    prev.onDeleteCard === next.onDeleteCard &&
    prev.onShareCard === next.onShareCard &&
    prev.onOpenCard === next.onOpenCard,
)
