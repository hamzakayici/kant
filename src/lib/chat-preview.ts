import type { ChatMessagePreviewInput } from "@/lib/chat-types"
import { stripMentionTokens } from "@/lib/chat-mentions"

export function formatChatMessagePreview(message: ChatMessagePreviewInput): string {
  const text = message.content?.trim()
  if (text) return stripMentionTokens(text)

  if (message.card) {
    const identifier = message.card.column?.board?.identifier
      ? `${message.card.column.board.identifier}-${message.card.sequenceId}`
      : null
    return identifier
      ? `📋 ${identifier} · ${message.card.title}`
      : `📋 ${message.card.title}`
  }

  const attachment = message.attachments?.[0]
  if (!attachment) return "Henüz mesaj yok"

  if (attachment.mimeType?.startsWith("image/")) return "📷 Fotoğraf"
  if (attachment.mimeType?.startsWith("video/")) return "🎬 Video"
  if (attachment.mimeType?.startsWith("audio/")) return "🎵 Ses"

  return attachment.filename ? `📎 ${attachment.filename}` : "📎 Dosya"
}
