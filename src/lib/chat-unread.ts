import type { ChatMessagePreviewInput } from "@/lib/chat-types"

export function getLastChatMessage(group: {
  lastMessage?: ChatMessagePreviewInput | null
  messages?: ChatMessagePreviewInput[]
}): ChatMessagePreviewInput | null {
  if (group.lastMessage) return group.lastMessage
  const messages = group.messages
  if (!messages?.length) return null
  return messages[messages.length - 1] ?? null
}

export function getTotalUnreadCount(
  groups: Array<{ unreadCount?: number | null }>,
) {
  return groups.reduce((sum, group) => sum + (group.unreadCount ?? 0), 0)
}

export function sortChatGroupsByActivity<
  T extends {
    lastMessage?: { createdAt?: string | Date } | null
    updatedAt?: string | Date
  },
>(groups: T[]) {
  return [...groups].sort((a, b) => {
    const aTime = new Date(a.lastMessage?.createdAt ?? a.updatedAt ?? 0).getTime()
    const bTime = new Date(b.lastMessage?.createdAt ?? b.updatedAt ?? 0).getTime()
    return bTime - aTime
  })
}

export function formatUnreadCount(count: number) {
  if (count <= 0) return null
  return count > 99 ? "99+" : String(count)
}
