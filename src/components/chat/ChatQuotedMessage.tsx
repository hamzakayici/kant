import { ChatSharedCard } from "@/components/chat/ChatSharedCard"
import { getUserDisplayName } from "@/lib/user"
import { formatChatMessagePreview } from "@/lib/chat-preview"
import type { CardShareSnapshot } from "@/lib/card-share"
import { cn } from "@/lib/utils"

type QuotedMessage = {
  id?: string
  content?: string | null
  author?: {
    firstName?: string | null
    lastName?: string | null
    email?: string | null
  } | null
  attachments?: Array<{ filename: string; mimeType?: string }>
  card?: CardShareSnapshot | null
}

export function ChatQuotedMessage({
  message,
  isMe = false,
  onClick,
  compact = false,
}: {
  message: QuotedMessage
  isMe?: boolean
  onClick?: () => void
  compact?: boolean
}) {
  const author = getUserDisplayName(message.author)
  const preview = formatChatMessagePreview(message)
  const quoteClassName = cn(
    "mb-2 w-full rounded-lg border-l-2 px-2 py-1.5 text-left text-xs transition-opacity",
    isMe
      ? "border-primary-foreground/60 bg-primary-foreground/10 hover:bg-primary-foreground/15"
      : "border-primary/60 bg-background/40 hover:bg-background/60",
    compact && "mb-0",
  )

  if (message.card) {
    const content = (
      <>
        <span
          className={cn(
            "block font-semibold",
            isMe ? "text-primary-foreground/90" : "text-primary",
          )}
        >
          {author}
        </span>
        <div className="mt-1 pointer-events-none">
          <ChatSharedCard card={message.card} variant="compact" />
        </div>
      </>
    )

    if (onClick) {
      return (
        <div
          role="button"
          tabIndex={0}
          onClick={onClick}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault()
              onClick()
            }
          }}
          className={cn(quoteClassName, "cursor-pointer")}
        >
          {content}
        </div>
      )
    }

    return <div className={quoteClassName}>{content}</div>
  }

  if (!onClick) {
    return (
      <div className={cn(quoteClassName, "cursor-default")}>
        <span
          className={cn(
            "block font-semibold",
            isMe ? "text-primary-foreground/90" : "text-primary",
          )}
        >
          {author}
        </span>
        <span
          className={cn(
            "line-clamp-2",
            isMe ? "text-primary-foreground/80" : "text-muted-foreground",
          )}
        >
          {preview}
        </span>
      </div>
    )
  }

  return (
    <button type="button" onClick={onClick} className={cn(quoteClassName, "cursor-pointer")}>
      <span
        className={cn(
          "block font-semibold",
          isMe ? "text-primary-foreground/90" : "text-primary",
        )}
      >
        {author}
      </span>
      <span
        className={cn(
          "line-clamp-2",
          isMe ? "text-primary-foreground/80" : "text-muted-foreground",
        )}
      >
        {preview}
      </span>
    </button>
  )
}
