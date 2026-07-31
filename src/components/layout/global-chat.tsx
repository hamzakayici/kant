"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"
import ChatPanel from "@/components/ChatPanel"
import { useChat } from "@/components/providers/ChatProvider"

type GlobalChatProps = {
  currentUserId: string
  chatGroups: any[]
  boards: { id: string; name: string; identifier: string }[]
  allUsers: { id: string; email: string; role?: string }[]
  telegramLinked: boolean
  telegramEnabled: boolean
}

export function GlobalChat({
  currentUserId,
  chatGroups,
  boards,
  allUsers,
  telegramLinked,
  telegramEnabled,
}: GlobalChatProps) {
  const pathname = usePathname()
  const { miniOpen, openMiniChat, closeMiniChat } = useChat()
  const hideOnChatPage =
    pathname === "/chat" || pathname.startsWith("/chat/")

  useEffect(() => {
    if (hideOnChatPage) closeMiniChat()
  }, [hideOnChatPage, closeMiniChat])

  if (hideOnChatPage) return null

  return (
    <ChatPanel
      isOpen={miniOpen}
      onOpen={openMiniChat}
      onClose={closeMiniChat}
      chatGroups={chatGroups}
      boards={boards}
      currentUserId={currentUserId}
      allUsers={allUsers}
      telegramLinked={telegramLinked}
      telegramEnabled={telegramEnabled}
    />
  )
}
