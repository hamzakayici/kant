"use client"

import { createContext, memo, useContext, useState, type ReactNode } from "react"
import { useDroppable } from "@dnd-kit/core"
import { KanbanDropSlot } from "@/components/kanban/KanbanDropIndicator"
import { cn } from "@/lib/utils"
import { hexToRgba } from "@/lib/kanban-utils"
import {
  useColumnIsDragTarget,
  useKanbanCardDragActive,
} from "@/components/kanban/useColumnDragUi"

const ColumnScrollContext = createContext<HTMLDivElement | null>(null)

export function useColumnScrollRoot() {
  return useContext(ColumnScrollContext)
}

type ColumnDropScrollProps = {
  columnId: string
  dotColor: string
  hasCards: boolean
  isAdding: boolean
  children: ReactNode
}

function ColumnDropScrollComponent({
  columnId,
  dotColor,
  hasCards,
  isAdding,
  children,
}: ColumnDropScrollProps) {
  const { setNodeRef: setDropRef } = useDroppable({
    id: `column-drop-${columnId}`,
    data: { type: "ColumnDrop", columnId },
  })

  const [scrollRootNode, setScrollRootNode] = useState<HTMLDivElement | null>(
    null,
  )
  const isDragTarget = useColumnIsDragTarget(columnId)
  const isCardDragActive = useKanbanCardDragActive()

  return (
    <ColumnScrollContext.Provider value={scrollRootNode}>
      <div
        ref={(node) => {
          setScrollRootNode(node)
          setDropRef(node)
          if (node) {
            node.dataset.kanbanColumnScroll = ""
          }
        }}
        className={cn(
          "custom-scrollbar mx-2 mb-2 flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-y-contain rounded-xl border border-transparent p-1.5",
          isCardDragActive ? "transition-none" : "transition-colors",
          isDragTarget && "border-primary/20 bg-primary/5",
          isDragTarget && !hasCards && "min-h-[160px]",
        )}
        style={{
          backgroundColor: isDragTarget
            ? undefined
            : hexToRgba(dotColor, 0.04),
        }}
      >
        {hasCards || isAdding ? (
          <div className="flex flex-col gap-2">{children}</div>
        ) : isDragTarget ? (
          <KanbanDropSlot variant="target" className="w-full" />
        ) : (
          <div className="flex min-h-[120px] flex-col items-center justify-center rounded-xl border border-dashed border-border/60 px-4 py-8 text-center">
            <p className="text-xs text-muted-foreground">Bu sütunda kart yok</p>
          </div>
        )}
      </div>
    </ColumnScrollContext.Provider>
  )
}

export const ColumnDropScroll = memo(ColumnDropScrollComponent)
