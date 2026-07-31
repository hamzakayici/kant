import { getUserDisplayName } from "@/lib/user"
import { formatChatMessagePreview } from "@/lib/chat-preview"

const STORAGE_KEY = "kant-chat-notifications-enabled"

export type NotifiableChatMessage = {
  id: string
  content: string
  source?: string | null
  authorId: string
  mentionedUserIds?: string[]
  author?: {
    firstName?: string | null
    lastName?: string | null
    email?: string | null
  } | null
  attachments?: Array<{ filename: string }>
}

export type NotifiableChatGroup = {
  id: string
  name: string
  messages?: NotifiableChatMessage[]
}

export function areChatNotificationsEnabled(): boolean {
  if (typeof window === "undefined") return false
  return localStorage.getItem(STORAGE_KEY) === "true"
}

export function setChatNotificationsEnabled(enabled: boolean) {
  localStorage.setItem(STORAGE_KEY, enabled ? "true" : "false")
}

export function getChatNotificationPermission(): NotificationPermission | "unsupported" {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "unsupported"
  }
  return Notification.permission
}

export async function requestChatNotificationPermission(): Promise<NotificationPermission | "unsupported"> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "unsupported"
  }
  if (Notification.permission === "granted") return "granted"
  if (Notification.permission === "denied") return "denied"
  return Notification.requestPermission()
}

export async function enableChatNotifications(): Promise<boolean> {
  const permission = await requestChatNotificationPermission()
  if (permission !== "granted") {
    setChatNotificationsEnabled(false)
    return false
  }
  setChatNotificationsEnabled(true)
  return true
}

export function disableChatNotifications() {
  setChatNotificationsEnabled(false)
}

function messagePreview(message: NotifiableChatMessage): string {
  const text = formatChatMessagePreview(message)
  return text.length > 140 ? `${text.slice(0, 137)}...` : text
}

export function showChatNotification(params: {
  groupId: string
  groupName: string
  message: NotifiableChatMessage
  currentUserId?: string
  onNavigate?: (groupId: string) => void
}) {
  if (!areChatNotificationsEnabled()) return
  if (getChatNotificationPermission() !== "granted") return

  const author = getUserDisplayName(params.message.author)
  const body = messagePreview(params.message)
  const mentioned =
    params.currentUserId &&
    params.message.mentionedUserIds?.includes(params.currentUserId)
  const title = mentioned
    ? `${params.groupName} · ${author} sizi etiketledi`
    : `${params.groupName} · ${author}`

  const notification = new Notification(title, {
    body,
    tag: `kant-chat-${params.groupId}-${params.message.id}`,
    icon: "/favicon.ico",
  })

  notification.onclick = () => {
    window.focus()
    notification.close()
    if (params.onNavigate) {
      params.onNavigate(params.groupId)
      return
    }
    window.location.href = `/chat?group=${encodeURIComponent(params.groupId)}`
  }
}

export function collectNewChatMessages(params: {
  groups: NotifiableChatGroup[]
  seenIds: Map<string, Set<string>>
  currentUserId: string
  bootstrap: boolean
}): Array<NotifiableChatMessage & { groupId: string; groupName: string }> {
  const incoming: Array<NotifiableChatMessage & { groupId: string; groupName: string }> = []

  for (const group of params.groups) {
    const known = params.seenIds.get(group.id) ?? new Set<string>()
    const nextKnown = new Set(known)

    for (const message of group.messages ?? []) {
      nextKnown.add(message.id)

      if (params.bootstrap) continue
      if (known.has(message.id)) continue
      if (message.authorId === params.currentUserId) continue

      incoming.push({
        ...message,
        groupId: group.id,
        groupName: group.name,
      })
    }

    params.seenIds.set(group.id, nextKnown)
  }

  return incoming
}

/** @deprecated Use collectNewChatMessages */
export const collectNewTelegramMessages = collectNewChatMessages

/** @deprecated Use showChatNotification */
export const showTelegramChatNotification = showChatNotification
