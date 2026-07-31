"use client"

import { memo } from "react"
import Column from "@/components/Column"
import { KanbanCard } from "@/components/kanban/KanbanCard"
import { useKanbanDragUi } from "@/components/kanban/useColumnDragUi"

type KanbanDragOverlayProps = {
  activeColumn: any | null
  boardIdentifier: string
}

function KanbanDragOverlayComponent({
  activeColumn,
  boardIdentifier,
}: KanbanDragOverlayProps) {
  const dragUi = useKanbanDragUi()

  if (activeColumn) {
    return (
      <div className="w-[min(320px,85vw)] rotate-1 opacity-95">
        <Column
          column={activeColumn}
          canReorderColumn={false}
          cardCount={activeColumn.cards?.length ?? 0}
          totalCardCount={activeColumn.cards?.length ?? 0}
        >
          <div className="pointer-events-none space-y-2 p-1">
            {(activeColumn.cards ?? []).slice(0, 2).map((card: any) => (
              <div
                key={card.id}
                className="h-16 rounded-xl border border-border/80 bg-card"
              />
            ))}
          </div>
        </Column>
      </div>
    )
  }

  if (!dragUi) return null

  return (
    <div className="w-[min(320px,85vw)] cursor-grabbing [will-change:transform]">
      <KanbanCard
        card={dragUi.activeCard}
        index={0}
        isOverlay
        canDelete={false}
        boardIdentifier={boardIdentifier}
        onDeleteCard={() => {}}
        onOpenCard={() => {}}
      />
    </div>
  )
}

export const KanbanDragOverlay = memo(KanbanDragOverlayComponent)
