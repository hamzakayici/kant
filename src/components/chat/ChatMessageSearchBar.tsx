"use client"

import { useEffect, useRef } from "react"
import { ChevronDown, ChevronUp, Search, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

export function ChatMessageSearchBar({
  open,
  query,
  matchCount,
  activeMatchIndex,
  onQueryChange,
  onClose,
  onNext,
  onPrevious,
}: {
  open: boolean
  query: string
  matchCount: number
  activeMatchIndex: number
  onQueryChange: (value: string) => void
  onClose: () => void
  onNext: () => void
  onPrevious: () => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    inputRef.current?.focus()
  }, [open])

  useEffect(() => {
    if (!open) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault()
        onClose()
        return
      }

      if (event.key === "Enter") {
        event.preventDefault()
        if (event.shiftKey) {
          onPrevious()
        } else {
          onNext()
        }
      }
    }

    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [open, onClose, onNext, onPrevious])

  if (!open) return null

  return (
    <div className="border-b border-border bg-card/80 px-4 py-2 backdrop-blur md:px-6">
      <div className="flex items-center gap-2">
        <Search className="size-4 shrink-0 text-muted-foreground" />
        <Input
          ref={inputRef}
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Bu konuda mesaj ara..."
          className="h-8 border-0 bg-transparent shadow-none focus-visible:ring-0"
        />
        <span
          className={cn(
            "shrink-0 text-xs tabular-nums",
            matchCount > 0 ? "text-foreground" : "text-muted-foreground",
          )}
        >
          {matchCount > 0 ? `${activeMatchIndex + 1}/${matchCount}` : "0/0"}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={onPrevious}
          disabled={matchCount === 0}
          title="Önceki (Shift+Enter)"
        >
          <ChevronUp className="size-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={onNext}
          disabled={matchCount === 0}
          title="Sonraki (Enter)"
        >
          <ChevronDown className="size-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={onClose}
          title="Kapat (Esc)"
        >
          <X className="size-4" />
        </Button>
      </div>
    </div>
  )
}
