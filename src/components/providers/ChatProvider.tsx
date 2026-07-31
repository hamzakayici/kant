"use client"

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react"

type ChatContextValue = {
  miniOpen: boolean
  openMiniChat: () => void
  closeMiniChat: () => void
  toggleMiniChat: () => void
  fullPageChatGroupId: string | null
  setFullPageChatGroupId: (groupId: string | null) => void
  miniChatOpen: boolean
  miniChatGroupId: string | null
  setMiniChatView: (open: boolean, groupId: string | null) => void
}

const ChatContext = createContext<ChatContextValue | null>(null)

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [miniOpen, setMiniOpen] = useState(false)
  const [fullPageChatGroupId, setFullPageChatGroupId] = useState<string | null>(
    null,
  )
  const [miniChatOpen, setMiniChatOpen] = useState(false)
  const [miniChatGroupId, setMiniChatGroupId] = useState<string | null>(null)

  const openMiniChat = useCallback(() => setMiniOpen(true), [])
  const closeMiniChat = useCallback(() => {
    setMiniOpen(false)
    setMiniChatOpen(false)
    setMiniChatGroupId(null)
  }, [])
  const toggleMiniChat = useCallback(() => setMiniOpen((v) => !v), [])

  const setMiniChatView = useCallback((open: boolean, groupId: string | null) => {
    setMiniChatOpen(open)
    setMiniChatGroupId(groupId)
  }, [])

  const value = useMemo(
    () => ({
      miniOpen,
      openMiniChat,
      closeMiniChat,
      toggleMiniChat,
      fullPageChatGroupId,
      setFullPageChatGroupId,
      miniChatOpen,
      miniChatGroupId,
      setMiniChatView,
    }),
    [
      miniOpen,
      openMiniChat,
      closeMiniChat,
      toggleMiniChat,
      fullPageChatGroupId,
      miniChatOpen,
      miniChatGroupId,
      setMiniChatView,
    ],
  )

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>
}

export function useChat() {
  const ctx = useContext(ChatContext)
  if (!ctx) {
    throw new Error("useChat must be used within ChatProvider")
  }
  return ctx
}
