"use client"

import { useCallback, useRef, useState } from "react"

type ScrollableMessage = {
  id: string
  authorId: string
  createdAt: string | Date
}

export function useChatScrollToMessage() {
  const messagesScrollRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const initialScrollGroupRef = useRef<string | null>(null)
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(
    null,
  )
  const [showScrollToBottom, setShowScrollToBottom] = useState(false)

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    const container = messagesScrollRef.current
    if (container) {
      container.scrollTo({ top: container.scrollHeight, behavior })
    } else {
      messagesEndRef.current?.scrollIntoView({ behavior })
    }
    setShowScrollToBottom(false)
  }, [])

  const handleMessagesScroll = useCallback(() => {
    const container = messagesScrollRef.current
    if (!container) return
    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight
    setShowScrollToBottom(distanceFromBottom > 120)
  }, [])

  const scrollToMessage = useCallback((messageId: string) => {
    const element = document.getElementById(`chat-msg-${messageId}`)
    if (!element) return false

    const container = messagesScrollRef.current
    if (container) {
      const containerRect = container.getBoundingClientRect()
      const elementRect = element.getBoundingClientRect()
      const targetTop =
        elementRect.top -
        containerRect.top +
        container.scrollTop -
        container.clientHeight / 2 +
        elementRect.height / 2

      container.scrollTo({
        top: Math.max(0, targetTop),
        behavior: "smooth",
      })
    } else {
      element.scrollIntoView({ behavior: "smooth", block: "center" })
    }

    setHighlightedMessageId(messageId)
    window.setTimeout(() => setHighlightedMessageId(null), 2000)
    return true
  }, [])

  const scrollToFirstUnread = useCallback(
    (
      messages: ScrollableMessage[],
      lastReadAt: Date | string | null | undefined,
      currentUserId: string,
    ) => {
      const readAt = lastReadAt ? new Date(lastReadAt).getTime() : null
      const firstUnread = messages.find((message) => {
        if (message.authorId === currentUserId) return false
        if (readAt == null) return true
        return new Date(message.createdAt).getTime() > readAt
      })

      if (!firstUnread) return false
      return scrollToMessage(firstUnread.id)
    },
    [scrollToMessage],
  )

  const handleInitialGroupScroll = useCallback(
    (params: {
      groupId: string
      messages: ScrollableMessage[]
      unreadCount: number
      lastReadAt?: Date | string | null
      currentUserId: string
    }) => {
      if (params.messages.length === 0) return
      if (initialScrollGroupRef.current === params.groupId) return

      initialScrollGroupRef.current = params.groupId

      if (params.unreadCount > 0) {
        const scrolled = scrollToFirstUnread(
          params.messages,
          params.lastReadAt,
          params.currentUserId,
        )
        if (scrolled) return
      }

      scrollToBottom("auto")
    },
    [scrollToBottom, scrollToFirstUnread],
  )

  const resetInitialScroll = useCallback((groupId: string | null) => {
    if (!groupId) {
      initialScrollGroupRef.current = null
      return
    }
    if (initialScrollGroupRef.current !== groupId) {
      initialScrollGroupRef.current = null
    }
  }, [])

  const autoScrollOnNewMessage = useCallback(
    (isNearBottom: boolean, isOwnMessage: boolean) => {
      if (isNearBottom || isOwnMessage) {
        scrollToBottom("smooth")
      }
    },
    [scrollToBottom],
  )

  const isNearBottom = useCallback(() => {
    const container = messagesScrollRef.current
    if (!container) return true
    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight
    return distanceFromBottom <= 120
  }, [])

  return {
    messagesScrollRef,
    messagesEndRef,
    highlightedMessageId,
    showScrollToBottom,
    scrollToMessage,
    scrollToBottom,
    handleMessagesScroll,
    handleInitialGroupScroll,
    resetInitialScroll,
    autoScrollOnNewMessage,
    isNearBottom,
  }
}
