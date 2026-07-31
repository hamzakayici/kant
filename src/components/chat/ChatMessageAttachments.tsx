import { FileText, Download, Mic } from "lucide-react"
import { getAttachmentUrl } from "@/lib/attachment-url"
import { cn } from "@/lib/utils"

type ChatAttachment = {
  id: string
  filename: string
  mimeType: string
}

function isVoiceAttachment(file: ChatAttachment) {
  return (
    file.filename.startsWith("voice.") ||
    file.mimeType === "audio/ogg" ||
    file.mimeType.includes("ogg")
  )
}

function isAudioAttachment(file: ChatAttachment) {
  return (
    file.mimeType.startsWith("audio/") ||
    file.mimeType === "application/ogg"
  )
}

export function ChatMessageAttachments({
  attachments,
  isMe = false,
}: {
  attachments?: ChatAttachment[]
  isMe?: boolean
}) {
  if (!attachments?.length) return null

  return (
    <div className="flex flex-col gap-2">
      {attachments.map((file) => {
        const url = getAttachmentUrl(file)
        const isImage = file.mimeType.startsWith("image/")
        const isVideo = file.mimeType.startsWith("video/")
        const isVoice = isVoiceAttachment(file)
        const isAudio = !isVoice && isAudioAttachment(file)

        if (isImage) {
          return (
            <a
              key={file.id}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="block overflow-hidden rounded-lg"
            >
              <img
                src={url}
                alt={file.filename}
                className="max-h-72 max-w-full rounded-lg object-cover"
              />
            </a>
          )
        }

        if (isVideo) {
          return (
            <video
              key={file.id}
              src={url}
              controls
              className="max-h-72 max-w-full rounded-lg"
            />
          )
        }

        if (isVoice || isAudio) {
          return (
            <div
              key={file.id}
              className={cn(
                "flex min-w-48 items-center gap-2 rounded-lg px-2 py-1.5",
                isMe ? "bg-primary-foreground/10" : "bg-background/60",
              )}
            >
              {isVoice ? (
                <Mic className="size-4 shrink-0 opacity-80" />
              ) : null}
              <audio src={url} controls className="h-8 w-full min-w-0" />
            </div>
          )
        }

        return (
          <a
            key={file.id}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors",
              isMe
                ? "border-primary-foreground/20 bg-primary-foreground/10 hover:bg-primary-foreground/15"
                : "border-border bg-background/60 hover:bg-background",
            )}
          >
            <FileText className="size-4 shrink-0" />
            <span className="truncate">{file.filename}</span>
            <Download className="ml-auto size-4 shrink-0 opacity-70" />
          </a>
        )
      })}
    </div>
  )
}
