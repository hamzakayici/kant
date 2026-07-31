"use client"

import { ArrowDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function ChatScrollToBottomButton({
  visible,
  unreadCount = 0,
  onClick,
  className,
}: {
  visible: boolean
  unreadCount?: number
  onClick: () => void
  className?: string
}) {
  if (!visible) return null

  return (
    <Button
      type="button"
      size="icon-sm"
      variant="secondary"
      onClick={onClick}
      className={cn(
        "absolute bottom-4 left-1/2 z-20 -translate-x-1/2 rounded-full border border-border bg-card shadow-lg",
        className,
      )}
      title="En alta in"
    >
      <ArrowDown className="size-4" />
      {unreadCount > 0 ? (
        <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      ) : null}
    </Button>
  )
}
