"use client"

import { useEffect, useRef } from "react"
import { usePathname } from "next/navigation"
import { CHAT_GROUPS_POLL_MS, getVisibilityAwarePollMs, KANT_OPEN_MINI_CHAT_EVENT, KANT_OPEN_MINI_CHAT_KEY } from "@/lib/chat-live"
import { fetchChatGroups } from "@/lib/chat-groups-api"
import { recoverFromStaleServerAction } from "@/lib/server-action-error"
import type { EnrichedChatGroup } from "@/lib/chat-types"
import type { NotifiableChatGroup } from "@/lib/chat-notifications"
import {
  areChatNotificationsEnabled,
  collectNewChatMessages,
  showChatNotification,
} from "@/lib/chat-notifications"
import { useChat } from "@/components/providers/ChatProvider"

type ChatNotificationsProps = {
  currentUserId: string
}

export function ChatNotifications({ currentUserId }: ChatNotificationsProps) {
  const pathname = usePathname()
  const { fullPageChatGroupId, miniChatOpen, miniChatGroupId, openMiniChat } =
    useChat()
  const seenIdsRef = useRef<Map<string, Set<string>>>(new Map())
  const bootstrappedRef = useRef(false)

  useEffect(() => {
    const shouldNotifyForGroup = (groupId: string) => {
      if (!areChatNotificationsEnabled()) return false
      if (typeof window === "undefined" || !("Notification" in window)) return false
      if (Notification.permission !== "granted") return false
      if (document.hidden) return true
      if (pathname === "/chat" && fullPageChatGroupId === groupId) return false
      if (miniChatOpen && miniChatGroupId === groupId) return false
      return true
    }

    let intervalId: ReturnType<typeof setInterval> | undefined

    const poll = async () => {
      try {
        const groups = (await fetchChatGroups()) as EnrichedChatGroup[]
        const bootstrap = !bootstrappedRef.current
        const newMessages = collectNewChatMessages({
          groups: groups as NotifiableChatGroup[],
          seenIds: seenIdsRef.current,
          currentUserId,
          bootstrap,
        })

        bootstrappedRef.current = true

        for (const message of newMessages) {
          if (!shouldNotifyForGroup(message.groupId)) continue

          showChatNotification({
            groupId: message.groupId,
            groupName: message.groupName,
            message,
            currentUserId,
            onNavigate: (groupId) => {
              if (pathname === "/chat" || pathname.startsWith("/chat/")) {
                window.location.href = `/chat?group=${encodeURIComponent(groupId)}`
                return
              }
              sessionStorage.setItem(KANT_OPEN_MINI_CHAT_KEY, groupId)
              openMiniChat()
              window.dispatchEvent(
                new CustomEvent(KANT_OPEN_MINI_CHAT_EVENT, {
                  detail: { groupId },
                }),
              )
            },
          })
        }
      } catch (error) {
        if (recoverFromStaleServerAction(error)) return
        console.error("Sohbet bildirimleri güncellenemedi:", error)
      }
    }

    const schedulePolling = () => {
      if (intervalId) clearInterval(intervalId)
      const intervalMs = getVisibilityAwarePollMs(CHAT_GROUPS_POLL_MS)
      intervalId = setInterval(poll, intervalMs)
    }

    void poll()
    schedulePolling()

    const onVisible = () => {
      schedulePolling()
      if (document.visibilityState === "visible") void poll()
    }
    document.addEventListener("visibilitychange", onVisible)

    return () => {
      if (intervalId) clearInterval(intervalId)
      document.removeEventListener("visibilitychange", onVisible)
    }
  }, [currentUserId, pathname, fullPageChatGroupId, miniChatOpen, miniChatGroupId, openMiniChat])

  return null
}

/** @deprecated Use ChatNotifications */
export const TelegramChatNotifications = ChatNotifications
