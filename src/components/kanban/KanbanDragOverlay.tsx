"use client"

import { memo } from "react"
import Card from "@/components/Card"
import Column from "@/components/Column"

type KanbanDragOverlayProps = {
  activeCard: any | null
  activeColumn: any | null
  userRole: string
  boardIdentifier: string
}

function KanbanDragOverlayComponent({
  activeCard,
  activeColumn,
  userRole,
  boardIdentifier,
}: KanbanDragOverlayProps) {
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

  if (!activeCard) return null

  return (
    <div className="w-[min(320px,85vw)] cursor-grabbing [will-change:transform]">
      <Card
        card={activeCard}
        isOverlay
        canDelete={false}
        userRole={userRole}
        boardIdentifier={boardIdentifier}
        onDelete={() => {}}
        onClick={() => {}}
      />
    </div>
  )
}

export const KanbanDragOverlay = memo(KanbanDragOverlayComponent)
