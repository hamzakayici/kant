import { stripMentionTokens } from "@/lib/chat-mentions"
import { getUserDisplayName } from "@/lib/user"

export type SearchableChatMessage = {
  id: string
  content?: string | null
  author?: {
    firstName?: string | null
    lastName?: string | null
    email?: string | null
  } | null
  attachments?: Array<{ filename: string }>
}

export function filterChatMessages(
  messages: SearchableChatMessage[],
  query: string,
): string[] {
  const normalized = query.trim().toLowerCase()
  if (!normalized) return []

  return messages
    .filter((message) => {
      const text = stripMentionTokens(message.content ?? "").toLowerCase()
      const author = getUserDisplayName(message.author).toLowerCase()
      const hasAttachment = message.attachments?.some((file) =>
        file.filename.toLowerCase().includes(normalized),
      )

      return (
        text.includes(normalized) ||
        author.includes(normalized) ||
        Boolean(hasAttachment)
      )
    })
    .map((message) => message.id)
}
