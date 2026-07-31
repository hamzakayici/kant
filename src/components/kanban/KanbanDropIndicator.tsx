"use client"

import { memo } from "react"
import { cn } from "@/lib/utils"
import { KANBAN_CARD_ESTIMATE_HEIGHT } from "@/lib/kanban-utils"

type KanbanDropSlotProps = {
  variant?: "target" | "source"
  className?: string
}

function KanbanDropSlotComponent({
  variant = "target",
  className,
}: KanbanDropSlotProps) {
  return (
    <div
      aria-hidden
      data-kanban-drop-slot=""
      className={cn(
        "kanban-drop-slot box-border shrink-0 rounded-xl border-2 border-dashed",
        "flex items-center justify-center",
        variant === "target"
          ? "border-primary bg-primary/15 shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--primary)_30%,transparent)] ring-2 ring-primary/30"
          : "border-primary/45 bg-primary/8",
        className,
      )}
      style={{ height: KANBAN_CARD_ESTIMATE_HEIGHT }}
    >
      {variant === "target" ? (
        <span className="pointer-events-none text-[11px] font-semibold tracking-wide text-primary uppercase">
          Buraya bırak
        </span>
      ) : null}
    </div>
  )
}

export const KanbanDropSlot = memo(KanbanDropSlotComponent)

/** @deprecated Use KanbanDropSlot */
export const KanbanDropIndicator = KanbanDropSlot
