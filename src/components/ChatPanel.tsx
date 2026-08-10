"use client"

import { useMemo, useState, useEffect, useRef, useCallback } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  MessageSquare,
  Plus,
  Hash,
  X,
  Minus,
  ChevronLeft,
  Send as TelegramIcon,
} from "lucide-react"
import {
  sendChatMessage,
  getChatMessages,
  createChatGroup,
  editChatMessage,
  deleteChatMessage,
} from "@/app/actions"
import { getUserChatGroups } from "@/app/actions/chatActions"
import { getUserDisplayName } from "@/lib/user"
import { recoverFromStaleServerAction } from "@/lib/server-action-error"
import { formatChatActionError } from "@/lib/chat-action-error"
import { useChatMediaUpload } from "@/hooks/useChatMediaUpload"
import { useVoiceRecorder } from "@/hooks/useVoiceRecorder"
import { ChatComposer } from "@/components/chat/ChatComposer"
import { ChatDropOverlay } from "@/components/chat/ChatDropOverlay"
import {
  CHAT_LIVE_POLL_MS,
  getVisibilityAwarePollMs,
  KANT_OPEN_MINI_CHAT_EVENT,
  KANT_OPEN_MINI_CHAT_KEY,
  shouldReplaceChatMessages,
} from "@/lib/chat-live"
import { ChatMessageBubble } from "@/components/chat/ChatMessageBubble"
import { ChatReplyBar } from "@/components/chat/ChatReplyBar"
import { useChat } from "@/components/providers/ChatProvider"
import { formatChatMessagePreview } from "@/lib/chat-preview"
import { cn } from "@/lib/utils"
import { getMessageGroupFlags } from "@/lib/chat-message-grouping"
import { ChatUnreadBadge } from "@/components/chat/ChatUnreadBadge"
import { getLastChatMessage, getTotalUnreadCount } from "@/lib/chat-unread"
import {
  useChatGroupsLive,
  useMarkChatGroupRead,
} from "@/hooks/useChatGroupsLive"
import { useConnectionStatus } from "@/hooks/useConnectionStatus"
import { useChatScrollToMessage } from "@/hooks/useChatScrollToMessage"
import { ChatScrollToBottomButton } from "@/components/chat/ChatScrollToBottomButton"
import type { MentionMember } from "@/lib/chat-mentions"
import { normalizeMentionsInContent } from "@/lib/chat-mentions"

type ChatPanelProps = {
  chatGroups: any[]
  boards: { id: string; name: string; identifier: string }[]
  currentUserId: string
  allUsers?: any[]
  isOpen: boolean
  onOpen: () => void
  onClose: () => void
  telegramLinked: boolean
  telegramEnabled: boolean
}

export default function ChatPanel({
  chatGroups: initialGroups,
  boards,
  currentUserId,
  allUsers = [],
  isOpen,
  onOpen,
  onClose,
  telegramLinked,
  telegramEnabled,
}: ChatPanelProps) {
  const pathname = usePathname()
  const { setMiniChatView } = useChat()
  const boardIdFromPath = pathname.match(/^\/b\/([^/]+)/)?.[1] ?? null

  const { chatGroups, setChatGroups } = useChatGroupsLive(initialGroups)
  const [activeGroup, setActiveGroup] = useState<any | null>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [miniView, setMiniView] = useState<"list" | "conversation">("list")
  const [message, setMessage] = useState("")
  const [sendError, setSendError] = useState<string | null>(null)
  const [isSending, setIsSending] = useState(false)
  const [showEmojis, setShowEmojis] = useState(false)

  const [isCreatingGroup, setIsCreatingGroup] = useState(false)
  const [newGroupName, setNewGroupName] = useState("")
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([])
  const [selectedBoardId, setSelectedBoardId] = useState(
    boardIdFromPath || boards[0]?.id || "",
  )
  const [replyTo, setReplyTo] = useState<any | null>(null)
  const { isConnected } = useConnectionStatus()
  const mentionMembers = useMemo<MentionMember[]>(
    () =>
      activeGroup?.members?.map((member: any) => ({
        id: member.user?.id ?? member.userId,
        firstName: member.user?.firstName,
        lastName: member.user?.lastName,
        email: member.user?.email,
      })) ?? [],
    [activeGroup],
  )

  const {
    pendingAttachments,
    setPendingAttachments,
    removeAttachment,
    clearAttachments,
    uploadFiles,
    isUploading,
    uploadError,
    setUploadError,
    isDragging,
    dragHandlers,
    onPaste,
  } = useChatMediaUpload(activeGroup?.id ?? null)

  const {
    isRecording,
    durationLabel,
    error: recordingError,
    toggleRecording,
  } = useVoiceRecorder((file) => {
    void uploadFiles([file])
  })

  const {
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
  } = useChatScrollToMessage()
  const prevMessageCountRef = useRef(0)
  const wasMiniChatOpenRef = useRef(false)
  const emojis = ["👍", "❤️", "😂", "🚀", "🔥", "✨", "👀", "🙌", "🎉", "💯"]
  const totalUnread = getTotalUnreadCount(chatGroups)
  const inConversation = miniView === "conversation" && activeGroup

  useMarkChatGroupRead(
    activeGroup?.id,
    Boolean(isOpen && inConversation && activeGroup),
    messages.length,
  )

  const openConversation = useCallback(
    (group: any) => {
      resetInitialScroll(group.id)
      prevMessageCountRef.current = 0
      setChatGroups((prev) =>
        prev.map((item) =>
          item.id === group.id ? { ...item, unreadCount: 0 } : item,
        ),
      )
      setActiveGroup(group)
      setReplyTo(null)
      setMiniView("conversation")
    },
    [resetInitialScroll, setChatGroups],
  )

  useEffect(() => {
    if (!isOpen) {
      wasMiniChatOpenRef.current = false
      return
    }

    const pendingGroupId = sessionStorage.getItem(KANT_OPEN_MINI_CHAT_KEY)
    if (pendingGroupId) {
      const group = chatGroups.find((item) => item.id === pendingGroupId)
      if (group) {
        sessionStorage.removeItem(KANT_OPEN_MINI_CHAT_KEY)
        openConversation(group)
        wasMiniChatOpenRef.current = true
        return
      }
      return
    }

    const justOpened = !wasMiniChatOpenRef.current
    wasMiniChatOpenRef.current = true
    if (justOpened) {
      setMiniView("list")
    }
  }, [isOpen, chatGroups, openConversation])

  useEffect(() => {
    const openGroupFromNotification = (groupId: string) => {
      const group = chatGroups.find((item) => item.id === groupId)
      if (group) openConversation(group)
    }

    const onOpenMiniChat = (event: Event) => {
      const detail = (event as CustomEvent<{ groupId: string }>).detail
      if (detail?.groupId) openGroupFromNotification(detail.groupId)
    }

    window.addEventListener(KANT_OPEN_MINI_CHAT_EVENT, onOpenMiniChat)
    return () => window.removeEventListener(KANT_OPEN_MINI_CHAT_EVENT, onOpenMiniChat)
  }, [chatGroups, openConversation])

  useEffect(() => {
    const open = isOpen && miniView === "conversation"
    const groupId = open ? activeGroup?.id ?? null : null
    const frameId = requestAnimationFrame(() => {
      setMiniChatView(open, groupId)
    })
    return () => cancelAnimationFrame(frameId)
  }, [isOpen, miniView, activeGroup?.id, setMiniChatView])

  useEffect(() => {
    return () => setMiniChatView(false, null)
  }, [setMiniChatView])

  useEffect(() => {
    if (boardIdFromPath) {
      setSelectedBoardId(boardIdFromPath)
    }
  }, [boardIdFromPath])

  useEffect(() => {
    resetInitialScroll(activeGroup?.id ?? null)
    prevMessageCountRef.current = 0
  }, [activeGroup?.id, resetInitialScroll])

  useEffect(() => {
    if (!activeGroup || !isOpen || messages.length === 0) return

    const member = activeGroup.members?.find(
      (item: { userId: string }) => item.userId === currentUserId,
    )

    handleInitialGroupScroll({
      groupId: activeGroup.id,
      messages,
      unreadCount: activeGroup.unreadCount ?? 0,
      lastReadAt: member?.lastReadAt,
      currentUserId,
    })
  }, [
    activeGroup,
    isOpen,
    messages,
    currentUserId,
    handleInitialGroupScroll,
  ])

  useEffect(() => {
    if (!activeGroup || !isOpen || messages.length === 0) return
    if (messages.length <= prevMessageCountRef.current) {
      prevMessageCountRef.current = messages.length
      return
    }

    const lastMessage = messages[messages.length - 1]
    autoScrollOnNewMessage(
      isNearBottom(),
      lastMessage?.authorId === currentUserId,
    )
    prevMessageCountRef.current = messages.length
  }, [
    activeGroup,
    isOpen,
    messages,
    currentUserId,
    autoScrollOnNewMessage,
    isNearBottom,
  ])

  useEffect(() => {
    if (!activeGroup || !isOpen) return

    const fetchMsgs = async () => {
      try {
        const msgs = await getChatMessages(activeGroup.id)
        setMessages((prev) =>
          shouldReplaceChatMessages(prev, msgs) ? msgs : prev,
        )
      } catch (err) {
        if (recoverFromStaleServerAction(err)) return
        console.error(err)
      }
    }

    fetchMsgs()

    let intervalId: ReturnType<typeof setInterval> | undefined
    const schedulePolling = () => {
      if (intervalId) clearInterval(intervalId)
      intervalId = setInterval(fetchMsgs, getVisibilityAwarePollMs(CHAT_LIVE_POLL_MS))
    }
    schedulePolling()

    const onVisible = () => {
      schedulePolling()
      if (document.visibilityState === "visible") void fetchMsgs()
    }
    document.addEventListener("visibilitychange", onVisible)

    return () => {
      if (intervalId) clearInterval(intervalId)
      document.removeEventListener("visibilitychange", onVisible)
    }
  }, [activeGroup, isOpen])

  const groupLabel = (group: any) => group.name

  const groupPreview = (group: any) => {
    const lastMsg = getLastChatMessage(group)
    if (!lastMsg) return "Henüz mesaj yok"
    const prefix = lastMsg.authorId === currentUserId ? "Sen: " : ""
    return `${prefix}${formatChatMessagePreview(lastMsg)}`
  }

  useEffect(() => {
    setReplyTo(null)
    clearAttachments()
    setUploadError(null)
  }, [activeGroup?.id, clearAttachments, setUploadError])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (
      (!message.trim() && pendingAttachments.length === 0) ||
      !activeGroup ||
      isRecording
    ) {
      return
    }
    setIsSending(true)
    setSendError(null)
    setUploadError(null)
    const msgText = message.trim()
    const attachmentsToSend = [...pendingAttachments]
    const replyToSend = replyTo
    const attachmentIds = attachmentsToSend.map((item) => item.id)
    const { content: normalizedText } = normalizeMentionsInContent(
      msgText,
      mentionMembers,
    )
    try {
      setMessage("")
      clearAttachments()
      setReplyTo(null)
      setMessages([
        ...messages,
        {
          id: "temp-" + Date.now(),
          content: normalizedText,
          authorId: currentUserId,
          author: { id: currentUserId, email: "Ben" },
          attachments: attachmentsToSend,
          replyTo: replyToSend,
          createdAt: new Date().toISOString(),
        },
      ])

      await sendChatMessage(
        activeGroup.id,
        msgText,
        attachmentIds,
        replyToSend?.id ?? null,
      )
      const msgs = await getChatMessages(activeGroup.id)
      setMessages(msgs)
    } catch (err) {
      if (recoverFromStaleServerAction(err)) return
      setSendError(formatChatActionError(err))
      setMessage(msgText)
      setPendingAttachments(attachmentsToSend)
      setReplyTo(replyToSend)
      try {
        const msgs = await getChatMessages(activeGroup.id)
        setMessages(msgs)
      } catch {
        setMessages((prev) => prev.filter((msg) => !msg.id.startsWith("temp-")))
      }
    } finally {
      setIsSending(false)
    }
  }

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) return
    if (!telegramEnabled && !selectedBoardId) return
    await createChatGroup(newGroupName, selectedBoardId, selectedUserIds)
    setIsCreatingGroup(false)
    setNewGroupName("")
    setSelectedUserIds([])

    const updated = await getUserChatGroups()
    setChatGroups(updated)
    if (updated.length > 0) {
      openConversation(updated[0])
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={onOpen}
        className="fixed bottom-6 right-6 z-50 flex size-12 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-lg transition-all hover:scale-105 hover:bg-accent animate-in fade-in zoom-in duration-200"
        title="Mini sohbet"
        aria-label="Mini sohbeti aç"
      >
        <MessageSquare className="size-5" />
        <ChatUnreadBadge
          count={totalUnread}
          className="absolute -top-1 -right-1 min-w-[1.125rem] px-1"
        />
        {telegramEnabled && !telegramLinked ? (
          <span className="absolute top-0.5 right-0.5 size-2 rounded-full border-2 border-card bg-amber-500" />
        ) : null}
      </button>
    )
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex h-[min(480px,calc(100dvh-6rem))] w-[min(360px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl animate-in slide-in-from-bottom-4 fade-in duration-200">
      <div className="flex shrink-0 flex-col border-b border-border bg-card">
        <div className="flex items-center justify-between gap-2 px-3 py-3">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            {inConversation ? (
              <button
                type="button"
                onClick={() => setMiniView("list")}
                className="shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                title="Sohbetlere dön"
                aria-label="Sohbetlere dön"
              >
                <ChevronLeft className="size-5" />
              </button>
            ) : (
              <MessageSquare className="size-5 shrink-0 text-primary" />
            )}
            <div className="min-w-0">
              <h2 className="truncate font-semibold text-foreground">
                {inConversation ? groupLabel(activeGroup) : "Mini Sohbet"}
              </h2>
              {inConversation ? (
                <p className="truncate text-[10px] text-muted-foreground">
                  {activeGroup.members?.length ?? 0} üye
                </p>
              ) : (
                <p className="text-[10px] text-muted-foreground">
                  {chatGroups.length}{" "}
                  {telegramEnabled ? "konu" : "sohbet"}
                </p>
              )}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <Link
              href={
                inConversation && activeGroup?.id
                  ? `/chat?group=${encodeURIComponent(activeGroup.id)}`
                  : "/chat"
              }
              className="rounded-md bg-muted px-2 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
              title="Tam sayfa sohbet"
            >
              Genişlet
            </Link>
            {!telegramEnabled ? (
            <button
              onClick={() => setIsCreatingGroup(true)}
              className="rounded-md bg-muted p-1.5 text-muted-foreground transition-colors hover:text-foreground"
              title="Yeni Grup"
            >
              <Plus className="size-4" />
            </button>
            ) : null}
            <button
              onClick={onClose}
              className="rounded-md bg-muted p-1.5 text-muted-foreground transition-colors hover:text-foreground"
              title="Küçült"
            >
              <Minus className="size-4" />
            </button>
          </div>
        </div>

        {telegramEnabled && !telegramLinked ? (
          <div className="border-t border-border px-4 py-2">
            <Link
              href="/settings/telegram"
              className="flex items-center gap-2 text-xs text-amber-500 hover:underline"
            >
              <TelegramIcon className="size-3.5" />
              Telegram hesabını bağla →
            </Link>
          </div>
        ) : null}
      </div>

      {!inConversation ? (
        <div className="custom-scrollbar flex flex-1 flex-col overflow-y-auto p-2">
          {chatGroups.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center px-4 py-10 text-center">
              <MessageSquare className="mb-3 size-10 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">
                {telegramEnabled
                  ? "Henüz Telegram konusu yok. Yeni konuları Telegram'da oluşturun."
                  : "Henüz sohbet grubu yok"}
              </p>
              {!telegramEnabled ? (
              <button
                type="button"
                onClick={() => setIsCreatingGroup(true)}
                className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                İlk grubu oluştur
              </button>
              ) : null}
            </div>
          ) : (
            chatGroups.map((group: any) => {
              const lastMsg = getLastChatMessage(group)
              return (
              <button
                key={group.id}
                type="button"
                onClick={() => openConversation(group)}
                className={cn(
                  "mb-1 flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-accent",
                  (group.unreadCount ?? 0) > 0 ? "bg-primary/5" : null,
                )}
              >
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                  <Hash className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={cn(
                        "truncate text-sm",
                        (group.unreadCount ?? 0) > 0
                          ? "font-semibold text-foreground"
                          : "font-medium text-foreground",
                      )}
                    >
                      {group.name}
                    </span>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <ChatUnreadBadge count={group.unreadCount ?? 0} />
                      {lastMsg?.createdAt ? (
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(lastMsg.createdAt).toLocaleTimeString(
                            "tr-TR",
                            {
                              hour: "2-digit",
                              minute: "2-digit",
                            },
                          )}
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <p
                    className={cn(
                      "truncate text-xs",
                      (group.unreadCount ?? 0) > 0
                        ? "font-medium text-foreground/80"
                        : "text-muted-foreground",
                    )}
                  >
                    {groupPreview(group)}
                  </p>
                </div>
                {group.telegramTopicId ? (
                  <span
                    className="mt-2 size-2 shrink-0 rounded-full bg-green-500"
                    title="Telegram konusu bağlı"
                  />
                ) : null}
              </button>
            )})
          )}
        </div>
      ) : (
        <>
          <div
            className="relative flex min-h-0 flex-1 flex-col"
            {...dragHandlers}
          >
          <div
            className="custom-scrollbar relative flex flex-1 flex-col gap-4 overflow-y-auto p-4"
            ref={messagesScrollRef}
            onScroll={handleMessagesScroll}
          >
            <ChatScrollToBottomButton
              visible={showScrollToBottom}
              unreadCount={activeGroup?.unreadCount ?? 0}
              onClick={() => scrollToBottom()}
            />
            <ChatDropOverlay visible={isDragging} />
            {messages.length === 0 ? (
              <div className="mt-10 text-center text-sm text-muted-foreground/70">
                Bu grupta henüz mesaj yok. İlk mesajı sen gönder!
              </div>
            ) : (
              messages.map((msg: any, index: number) => {
                const { isGroupStart, isGroupEnd } = getMessageGroupFlags(
                  messages,
                  index,
                )
                return (
                <ChatMessageBubble
                  key={msg.id}
                  msg={msg}
                  currentUserId={currentUserId}
                  isGroupStart={isGroupStart}
                  isGroupEnd={isGroupEnd}
                  highlighted={highlightedMessageId === msg.id}
                  onReply={setReplyTo}
                  onCopyLink={
                    activeGroup
                      ? async (messageId) => {
                          const url = `${window.location.origin}/chat?group=${encodeURIComponent(activeGroup.id)}&message=${encodeURIComponent(messageId)}`
                          try {
                            await navigator.clipboard.writeText(url)
                          } catch {
                            window.prompt("Mesaj bağlantısı:", url)
                          }
                        }
                      : undefined
                  }
                  onEdit={async (id, content) => {
                    await editChatMessage(id, content)
                    const msgs = await getChatMessages(activeGroup!.id)
                    setMessages(msgs)
                  }}
                  onDelete={async (id) => {
                    await deleteChatMessage(id)
                    const msgs = await getChatMessages(activeGroup!.id)
                    setMessages(msgs)
                  }}
                  onQuoteClick={scrollToMessage}
                />
                )
              })
            )}
            <div ref={messagesEndRef} />
          </div>
          </div>

          <div className="shrink-0 border-t border-border bg-card p-3">
            {sendError ? (
              <div className="mb-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                <p>{sendError}</p>
                {sendError.includes("Kendi adımla göndermeyi") ? (
                  <Link
                    href="/settings/telegram"
                    className="mt-1 inline-block text-xs underline"
                  >
                    Ayarlar → Telegram
                  </Link>
                ) : null}
              </div>
            ) : null}
            {replyTo ? (
              <ChatReplyBar
                replyTo={replyTo}
                onCancel={() => setReplyTo(null)}
                onQuoteClick={scrollToMessage}
              />
            ) : null}
            {uploadError ? (
              <div className="mb-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {uploadError}
              </div>
            ) : null}
            <ChatComposer
              message={message}
              onMessageChange={setMessage}
              onSubmit={handleSendMessage}
              onPaste={onPaste}
              pendingAttachments={pendingAttachments}
              onRemoveAttachment={removeAttachment}
              onFilesSelected={uploadFiles}
              isSending={isSending}
              isUploading={isUploading}
              showEmojis={showEmojis}
              onToggleEmojis={() => setShowEmojis((value) => !value)}
              emojis={emojis}
              onEmojiSelect={(emoji) => {
                setMessage((current) => current + emoji)
                setShowEmojis(false)
              }}
              isRecording={isRecording}
              recordingLabel={durationLabel}
              recordingError={recordingError}
              onToggleRecording={() => void toggleRecording()}
              compact
              mentionMembers={mentionMembers}
              currentUserId={currentUserId}
              disabled={!isConnected}
            />
          </div>
        </>
      )}

      {!telegramEnabled && isCreatingGroup ? (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-sm rounded-xl border border-border bg-card p-5">
            <h3 className="mb-4 flex items-center justify-between font-semibold text-foreground">
              Yeni Sohbet Grubu
              <button onClick={() => setIsCreatingGroup(false)}>
                <X className="size-4 text-muted-foreground" />
              </button>
            </h3>

            {!telegramEnabled && boards.length > 1 ? (
              <div className="mb-3">
                <label className="mb-1 block text-xs text-muted-foreground">
                  Proje
                </label>
                <select
                  value={selectedBoardId}
                  onChange={(e) => setSelectedBoardId(e.target.value)}
                  className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground outline-none"
                >
                  {boards.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.identifier})
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

            <input
              type="text"
              placeholder="Grup adı"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              className="mb-4 w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground outline-none"
            />
            {!telegramEnabled ? (
            <div className="mb-4">
              <label className="mb-2 block text-xs text-muted-foreground">
                Üyeleri seçin
              </label>
              <div className="custom-scrollbar flex max-h-32 flex-col gap-1 overflow-y-auto">
                {allUsers
                  .filter((u: any) => u.id !== currentUserId)
                  .map((user: any) => (
                    <label
                      key={user.id}
                      className="flex cursor-pointer items-center gap-2 rounded p-1 text-sm text-muted-foreground hover:bg-accent"
                    >
                      <input
                        type="checkbox"
                        checked={selectedUserIds.includes(user.id)}
                        onChange={(e) => {
                          if (e.target.checked)
                            setSelectedUserIds([...selectedUserIds, user.id])
                          else
                            setSelectedUserIds(
                              selectedUserIds.filter((id) => id !== user.id),
                            )
                        }}
                        className="rounded border-border bg-muted"
                      />
                      {getUserDisplayName(user)}
                    </label>
                  ))}
              </div>
            </div>
            ) : null}
            <button
              onClick={handleCreateGroup}
              disabled={!newGroupName.trim() || !selectedBoardId}
              className="w-full rounded-lg bg-primary py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              Oluştur
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
