"use client"

import {
  ChevronRight,
  Image as ImageIcon,
  X,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type CardModalHeaderProps = {
  boardName: string
  columnName: string
  boardIdentifier: string
  sequenceId: number
  hasCover: boolean
  coverMode?: string | null
  onToggleCoverMode: () => void
  onClose: () => void
}

export function CardModalHeader({
  boardName,
  columnName,
  boardIdentifier,
  sequenceId,
  hasCover,
  coverMode,
  onToggleCoverMode,
  onClose,
}: CardModalHeaderProps) {
  return (
    <header className="flex shrink-0 items-center justify-between gap-3 border-b border-border/80 bg-card/80 px-4 py-3 backdrop-blur-sm sm:px-6">
      <nav className="flex min-w-0 flex-1 items-center gap-1.5 text-xs text-muted-foreground">
        <Badge variant="outline" className="max-w-[120px] truncate font-normal">
          {boardName}
        </Badge>
        <ChevronRight className="size-3.5 shrink-0 opacity-50" />
        <Badge variant="secondary" className="max-w-[120px] truncate font-normal">
          {columnName}
        </Badge>
        <ChevronRight className="size-3.5 shrink-0 opacity-50" />
        <span className="truncate font-mono text-[11px] text-muted-foreground">
          {boardIdentifier}-{sequenceId}
        </span>
      </nav>

      {hasCover ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="hidden h-8 shrink-0 gap-1.5 text-xs sm:flex"
          onClick={onToggleCoverMode}
        >
          <ImageIcon className="size-3.5" />
          {coverMode === "CONTAIN" ? "Tam sığdır" : "Kırpılarak doldur"}
        </Button>
      ) : null}

      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="shrink-0"
        onClick={onClose}
        aria-label="Kapat"
      >
        <X className="size-4" />
      </Button>
    </header>
  )
}
