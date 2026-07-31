import { X } from "lucide-react"
import { ChatQuotedMessage } from "@/components/chat/ChatQuotedMessage"

export function ChatReplyBar({
  replyTo,
  onCancel,
  onQuoteClick,
}: {
  replyTo: {
    id: string
    content?: string | null
    author?: {
      firstName?: string | null
      lastName?: string | null
      email?: string | null
    } | null
    attachments?: Array<{ filename: string; mimeType?: string }>
  }
  onCancel: () => void
  onQuoteClick?: (messageId: string) => void
}) {
  return (
    <div className="mx-auto mb-2 flex max-w-4xl items-start gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2">
      <div className="min-w-0 flex-1">
        <p className="mb-1 text-xs font-medium text-primary">Yanıtlanıyor</p>
        <ChatQuotedMessage
          message={replyTo}
          compact
          onClick={
            onQuoteClick ? () => onQuoteClick(replyTo.id) : undefined
          }
        />
      </div>
      <button
        type="button"
        onClick={onCancel}
        className="shrink-0 text-muted-foreground hover:text-foreground"
        aria-label="Yanıtı iptal et"
      >
        <X className="size-4" />
      </button>
    </div>
  )
}
