import { FileText, Mic, Paperclip, X } from "lucide-react"
import { cn } from "@/lib/utils"
import type { PendingChatAttachment } from "@/lib/chat-upload"

function isVoiceAttachment(file: PendingChatAttachment) {
  return (
    file.filename.startsWith("voice.") ||
    file.mimeType === "audio/ogg" ||
    file.mimeType.includes("ogg")
  )
}

export function ChatPendingAttachments({
  attachments,
  onRemove,
  className,
}: {
  attachments: PendingChatAttachment[]
  onRemove: (id: string) => void
  className?: string
}) {
  if (attachments.length === 0) return null

  return (
    <div className={cn("space-y-2", className)}>
      {attachments.map((file) => (
        <div
          key={file.id}
          className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm"
        >
          {isVoiceAttachment(file) ? (
            <Mic className="size-4 shrink-0 text-primary" />
          ) : file.mimeType.startsWith("image/") ? (
            <Paperclip className="size-4 shrink-0 text-muted-foreground" />
          ) : (
            <FileText className="size-4 shrink-0 text-muted-foreground" />
          )}
          <span className="truncate">{file.filename}</span>
          <button
            type="button"
            onClick={() => onRemove(file.id)}
            className="ml-auto text-muted-foreground hover:text-foreground"
            aria-label="Kaldır"
          >
            <X className="size-4" />
          </button>
        </div>
      ))}
    </div>
  )
}
