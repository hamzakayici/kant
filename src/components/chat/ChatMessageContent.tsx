"use client"

import { cn } from "@/lib/utils"
import { parseMentionParts } from "@/lib/chat-mentions"

export function ChatMessageContent({
  content,
  className,
  isMe = false,
}: {
  content: string
  className?: string
  isMe?: boolean
}) {
  const parts = parseMentionParts(content)

  return (
    <p className={cn("whitespace-pre-wrap break-words", className)}>
      {parts.map((part, index) => {
        if (part.type === "mention") {
          return (
            <span
              key={`${part.userId}-${index}`}
              className={cn(
                "rounded px-0.5 font-semibold",
                isMe
                  ? "bg-primary-foreground/15 text-primary-foreground"
                  : "bg-primary/15 text-primary",
              )}
              title={`@${part.label}`}
            >
              @{part.label}
            </span>
          )
        }
        return <span key={`text-${index}`}>{part.value}</span>
      })}
    </p>
  )
}
