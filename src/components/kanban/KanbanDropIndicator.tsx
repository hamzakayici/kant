"use client"

import { memo } from "react"
import { KANBAN_CARD_ESTIMATE_HEIGHT } from "@/lib/kanban-utils"

function KanbanDropIndicatorComponent() {
  return (
    <div
      aria-hidden
      className="shrink-0 rounded-xl border-2 border-dashed border-primary/60 bg-primary/10"
      style={{ height: KANBAN_CARD_ESTIMATE_HEIGHT }}
    />
  )
}

export const KanbanDropIndicator = memo(KanbanDropIndicatorComponent)
