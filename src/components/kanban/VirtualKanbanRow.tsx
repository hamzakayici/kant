"use client"

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

export function VirtualKanbanRow({
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
