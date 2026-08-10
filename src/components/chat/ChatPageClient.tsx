"use client"

import { useMemo, useState, useEffect, useRef } from "react"
import Link from "next/link"
import {
  MessageSquare,
  Plus,
  Hash,
  X,
  Search,
  Send as TelegramIcon,
  Users,
  Bell,
  BellOff,
  ArrowLeft,
} from "lucide-react"
import {
  sendChatMessage,
  getChatMessages,
  createChatGroup,
  editChatMessage,
  deleteChatMessage,
} from "@/app/actions"
import { getUserChatGroups } from "@/app/actions/chatActions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { getUserDisplayName, getUserInitial } from "@/lib/user"
import { recoverFromStaleServerAction } from "@/lib/server-action-error"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  CHAT_LIVE_POLL_MS,
  getVisibilityAwarePollMs,
  shouldReplaceChatMessages,
} from "@/lib/chat-live"
import { ChatMessageBubble } from "@/components/chat/ChatMessageBubble"
import { ChatReplyBar } from "@/components/chat/ChatReplyBar"
import { useChat } from "@/components/providers/ChatProvider"
import { formatChatMessagePreview } from "@/lib/chat-preview"
import { ChatTelegramSenderBanner } from "@/components/chat/ChatTelegramSenderBanner"
import { getMessageGroupFlags } from "@/lib/chat-message-grouping"
import {
  areChatNotificationsEnabled,
  enableChatNotifications,
  disableChatNotifications,
  getChatNotificationPermission,
} from "@/lib/chat-notifications"
import { formatChatActionError } from "@/lib/chat-action-error"
import { useChatMediaUpload } from "@/hooks/useChatMediaUpload"
import { useVoiceRecorder } from "@/hooks/useVoiceRecorder"
import { ChatComposer } from "@/components/chat/ChatComposer"
import { ChatDropOverlay } from "@/components/chat/ChatDropOverlay"
import { ChatUnreadBadge } from "@/components/chat/ChatUnreadBadge"
import { getLastChatMessage } from "@/lib/chat-unread"
import {
  useChatGroupsLive,
  useMarkChatGroupRead,
} from "@/hooks/useChatGroupsLive"
import { useConnectionStatus } from "@/hooks/useConnectionStatus"
import { useChatScrollToMessage } from "@/hooks/useChatScrollToMessage"
import { ConnectionStatusBanner } from "@/components/layout/ConnectionStatusBanner"
import { ChatScrollToBottomButton } from "@/components/chat/ChatScrollToBottomButton"
import { ChatMessageSearchBar } from "@/components/chat/ChatMessageSearchBar"
import { filterChatMessages } from "@/lib/chat-message-search"
import type { MentionMember } from "@/lib/chat-mentions"
import { normalizeMentionsInContent } from "@/lib/chat-mentions"

type ChatPageClientProps = {
  chatGroups: any[]
  boards: { id: string; name: string; identifier: string }[]
  currentUserId: string
  allUsers: {
    id: string
    email: string
    firstName?: string | null
    lastName?: string | null
    role?: string
  }[]
  telegramLinked: boolean
  telegramEnabled: boolean
  mtprotoConfigured?: boolean
  mtprotoLinked?: boolean
  initialGroupId?: string | null
  initialMessageId?: string | null
}

export default function ChatPageClient({
  chatGroups: initialGroups,
  boards,
  currentUserId,
  allUsers,
  telegramLinked,
  telegramEnabled,
  mtprotoConfigured = false,
  mtprotoLinked = false,
  initialGroupId,
  initialMessageId,
}: ChatPageClientProps) {
  const { setFullPageChatGroupId } = useChat()
  const { chatGroups, setChatGroups } = useChatGroupsLive(initialGroups)
  const initialActiveGroup =
    initialGroups?.find((group: any) => group.id === initialGroupId) ??
    initialGroups?.[0] ??
    null
  const [activeGroup, setActiveGroup] = useState<any | null>(initialActiveGroup)
  const [messages, setMessages] = useState<any[]>([])
  const [message, setMessage] = useState("")
  const [sendError, setSendError] = useState<string | null>(null)
  const [isSending, setIsSending] = useState(false)
  const [showEmojis, setShowEmojis] = useState(false)
  const [isCreatingGroup, setIsCreatingGroup] = useState(false)
  const [newGroupName, setNewGroupName] = useState("")
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([])
  const [selectedBoardId, setSelectedBoardId] = useState(boards[0]?.id || "")
  const [replyTo, setReplyTo] = useState<any | null>(null)
  const [notificationsEnabled, setNotificationsEnabled] = useState(false)
  const [showMobileSidebar, setShowMobileSidebar] = useState(!initialGroupId)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchMatchIndex, setSearchMatchIndex] = useState(0)
  const initialMessageScrolledRef = useRef(false)
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
  const emojis = ["👍", "❤️", "😂", "🚀", "🔥", "✨", "👀", "🙌", "🎉", "💯"]

  const searchMatches = useMemo(
    () => filterChatMessages(messages, searchQuery),
    [messages, searchQuery],
  )

  const handleCopyMessageLink = async (messageId: string) => {
    if (!activeGroup) return
    const url = `${window.location.origin}/chat?group=${encodeURIComponent(activeGroup.id)}&message=${encodeURIComponent(messageId)}`
    try {
      await navigator.clipboard.writeText(url)
    } catch {
      window.prompt("Mesaj bağlantısı:", url)
    }
  }

  useMarkChatGroupRead(activeGroup?.id, Boolean(activeGroup), messages.length)

  const selectGroup = (group: any) => {
    resetInitialScroll(group.id)
    prevMessageCountRef.current = 0
    initialMessageScrolledRef.current = false
    setSearchOpen(false)
    setSearchQuery("")
    setSearchMatchIndex(0)
    setChatGroups((prev) =>
      prev.map((item) =>
        item.id === group.id ? { ...item, unreadCount: 0 } : item,
      ),
    )
    setActiveGroup(group)
    setShowMobileSidebar(false)
  }

  useEffect(() => {
    setNotificationsEnabled(areChatNotificationsEnabled())
  }, [])

  useEffect(() => {
    const groupId = activeGroup?.id ?? null
    const frameId = requestAnimationFrame(() => {
      setFullPageChatGroupId(groupId)
    })
    return () => {
      cancelAnimationFrame(frameId)
      setFullPageChatGroupId(null)
    }
  }, [activeGroup?.id, setFullPageChatGroupId])

  useEffect(() => {
    resetInitialScroll(activeGroup?.id ?? null)
    prevMessageCountRef.current = 0
  }, [activeGroup?.id, resetInitialScroll])

  useEffect(() => {
    if (!activeGroup || messages.length === 0) return

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
    messages,
    currentUserId,
    handleInitialGroupScroll,
  ])

  useEffect(() => {
    if (!activeGroup || messages.length === 0) return
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
    messages,
    currentUserId,
    autoScrollOnNewMessage,
    isNearBottom,
  ])

  useEffect(() => {
    if (!activeGroup) return

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
  }, [activeGroup])

  useEffect(() => {
    setReplyTo(null)
    clearAttachments()
    setUploadError(null)
    setSearchOpen(false)
    setSearchQuery("")
    setSearchMatchIndex(0)
  }, [activeGroup?.id, clearAttachments, setUploadError])

  useEffect(() => {
    setSearchMatchIndex(0)
  }, [searchQuery, activeGroup?.id])

  useEffect(() => {
    if (!searchOpen || searchMatches.length === 0) return
    const messageId = searchMatches[searchMatchIndex]
    if (messageId) scrollToMessage(messageId)
  }, [searchOpen, searchMatchIndex, searchMatches, scrollToMessage])

  useEffect(() => {
    if (!initialMessageId || messages.length === 0) return
    if (initialMessageScrolledRef.current) return
    if (scrollToMessage(initialMessageId)) {
      initialMessageScrolledRef.current = true
    }
  }, [initialMessageId, messages.length, scrollToMessage])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!activeGroup) return
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "f") {
        event.preventDefault()
        setSearchOpen(true)
      }
    }
    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [activeGroup])

  const goToNextSearchMatch = () => {
    if (searchMatches.length === 0) return
    setSearchMatchIndex((index) => (index + 1) % searchMatches.length)
  }

  const goToPreviousSearchMatch = () => {
    if (searchMatches.length === 0) return
    setSearchMatchIndex((index) =>
      index - 1 < 0 ? searchMatches.length - 1 : index - 1,
    )
  }

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
      setActiveGroup(updated[0])
      setMessages(updated[0].messages || [])
    }
  }

  const groupLabel = (group: any) => group.name

  const handleToggleNotifications = async () => {
    if (notificationsEnabled) {
      disableChatNotifications()
      setNotificationsEnabled(false)
      return
    }

    const enabled = await enableChatNotifications()
    setNotificationsEnabled(enabled)
    if (!enabled && getChatNotificationPermission() === "denied") {
      alert(
        "Bildirim izni reddedildi. Tarayıcı ayarlarından Zubee için bildirimlere izin verin.",
      )
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
      <ConnectionStatusBanner />
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-4 md:px-6">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <MessageSquare className="size-5" />
          </div>
          <div>
            <h1 className="font-heading text-xl font-semibold text-foreground">
              Sohbet
            </h1>
            <p className="text-sm text-muted-foreground">
              {telegramEnabled
                ? "Telegram konularıyla senkronize"
                : "Proje ekipleriyle mesajlaşın"}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant={notificationsEnabled ? "secondary" : "outline"}
            size="sm"
            onClick={handleToggleNotifications}
            title={
              notificationsEnabled
                ? "Sohbet bildirimleri açık"
                : "Sohbet bildirimlerini aç"
            }
          >
            {notificationsEnabled ? (
              <Bell className="size-3.5" />
            ) : (
              <BellOff className="size-3.5" />
            )}
            Bildirimler
          </Button>
          {telegramEnabled ? (
            !telegramLinked ? (
              <Button variant="outline" size="sm" render={<Link href="/settings/telegram" />}>
                <TelegramIcon className="size-3.5" />
                Telegram bağla
              </Button>
            ) : null
          ) : (
            <Button size="sm" onClick={() => setIsCreatingGroup(true)}>
              <Plus className="size-4" />
              Yeni Grup
            </Button>
          )}
        </div>
      </header>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <aside
          className={cn(
            "flex min-h-0 w-full max-w-xs shrink-0 flex-col border-r border-border bg-muted/20 md:w-80",
            activeGroup && !showMobileSidebar ? "max-md:hidden" : "flex",
          )}
        >
          <div className="border-b border-border px-4 py-3">
            <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              {telegramEnabled ? "Telegram Konuları" : "Sohbet Grupları"}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {chatGroups.length} {telegramEnabled ? "konu" : "grup"}
            </p>
          </div>

          <div className="custom-scrollbar flex-1 overflow-y-auto p-2">
            {chatGroups.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
                <Users className="mb-3 size-10 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">
                  {telegramEnabled
                    ? "Henüz Telegram konusu yok. Yeni konuları Telegram grubunda oluşturun; Zubee otomatik senkronize eder."
                    : "Henüz sohbet grubu yok"}
                </p>
                {!telegramEnabled ? (
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-4"
                  onClick={() => setIsCreatingGroup(true)}
                >
                  İlk grubu oluştur
                </Button>
                ) : null}
              </div>
            ) : (
              chatGroups.map((group: any) => {
                const isActive = activeGroup?.id === group.id
                const lastMsg = getLastChatMessage(group)

                return (
                  <button
                    key={group.id}
                    type="button"
                    onClick={() => selectGroup(group)}
                    className={cn(
                      "mb-1 flex w-full flex-col gap-1 rounded-xl px-3 py-3 text-left transition-colors",
                      isActive
                        ? "bg-primary/15 text-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground",
                      (group.unreadCount ?? 0) > 0 && !isActive
                        ? "bg-primary/5"
                        : null,
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <Hash className="size-3.5 shrink-0 text-primary" />
                      <span
                        className={cn(
                          "min-w-0 flex-1 truncate text-sm",
                          (group.unreadCount ?? 0) > 0
                            ? "font-semibold text-foreground"
                            : "font-medium",
                        )}
                      >
                        {group.name}
                      </span>
                      <ChatUnreadBadge count={group.unreadCount ?? 0} />
                      {group.telegramTopicId ? (
                        <span
                          className="size-1.5 shrink-0 rounded-full bg-green-500"
                          title="Telegram konusu bağlı"
                        />
                      ) : null}
                    </div>
                    {lastMsg ? (
                      <span
                        className={cn(
                          "line-clamp-1 pl-5 text-xs",
                          (group.unreadCount ?? 0) > 0
                            ? "font-medium text-foreground/80"
                            : "opacity-60",
                        )}
                      >
                        {formatChatMessagePreview(lastMsg)}
                      </span>
                    ) : null}
                  </button>
                )
              })
            )}
          </div>
        </aside>

        <main
          className={cn(
            "flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-background",
            !activeGroup ? "max-md:hidden" : "flex",
          )}
        >
          {activeGroup ? (
            <>
              <div className="shrink-0 border-b border-border px-4 py-3 md:px-6">
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="md:hidden"
                    onClick={() => setShowMobileSidebar(true)}
                    aria-label="Konu listesine dön"
                  >
                    <ArrowLeft className="size-4" />
                  </Button>
                  <Hash className="size-4 text-primary" />
                  <h2 className="min-w-0 flex-1 truncate font-semibold text-foreground">
                    {groupLabel(activeGroup)}
                  </h2>
                  <Button
                    type="button"
                    variant={searchOpen ? "secondary" : "ghost"}
                    size="icon-sm"
                    onClick={() => {
                      setSearchOpen((open) => !open)
                      if (searchOpen) {
                        setSearchQuery("")
                        setSearchMatchIndex(0)
                      }
                    }}
                    title="Mesajlarda ara (Ctrl+F)"
                  >
                    <Search className="size-4" />
                  </Button>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {activeGroup.members?.length ?? 0} üye
                </p>
              </div>

              <ChatMessageSearchBar
                open={searchOpen}
                query={searchQuery}
                matchCount={searchMatches.length}
                activeMatchIndex={searchMatchIndex}
                onQueryChange={setSearchQuery}
                onClose={() => {
                  setSearchOpen(false)
                  setSearchQuery("")
                  setSearchMatchIndex(0)
                }}
                onNext={goToNextSearchMatch}
                onPrevious={goToPreviousSearchMatch}
              />

              <div
                className="relative flex min-h-0 flex-1 flex-col"
                {...dragHandlers}
              >
              <div
                className="custom-scrollbar relative min-h-0 flex-1 overflow-y-auto px-4 py-4 md:px-6"
                ref={messagesScrollRef}
                onScroll={handleMessagesScroll}
              >
                <ChatScrollToBottomButton
                  visible={showScrollToBottom}
                  unreadCount={activeGroup?.unreadCount ?? 0}
                  onClick={() => scrollToBottom()}
                />
                <ChatDropOverlay visible={isDragging} />
                <ChatTelegramSenderBanner
                  telegramEnabled={telegramEnabled}
                  telegramLinked={telegramLinked}
                  mtprotoConfigured={mtprotoConfigured}
                  mtprotoLinked={mtprotoLinked}
                />
                <div className="flex min-h-full flex-col gap-1">
                {messages.length === 0 ? (
                  <div className="flex flex-1 flex-col items-center justify-center text-center">
                    <MessageSquare className="mb-3 size-12 text-muted-foreground/30" />
                    <p className="text-sm text-muted-foreground">
                      Bu grupta henüz mesaj yok. İlk mesajı sen gönder!
                    </p>
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
                        searchMatched={searchMatches.includes(msg.id)}
                        searchActive={
                          searchMatches[searchMatchIndex] === msg.id
                        }
                        onReply={setReplyTo}
                        onCopyLink={handleCopyMessageLink}
                      onEdit={async (id, content) => {
                        await editChatMessage(id, content)
                        const msgs = await getChatMessages(activeGroup.id)
                        setMessages(msgs)
                      }}
                      onDelete={async (id) => {
                        await deleteChatMessage(id)
                        const msgs = await getChatMessages(activeGroup.id)
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
              </div>

              <div className="shrink-0 border-t border-border bg-card/50 p-4 md:px-6">
                {sendError ? (
                  <div className="mx-auto mb-3 max-w-4xl rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
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
                  <div className="mx-auto mb-3 max-w-4xl rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
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
                  inputClassName="mx-auto max-w-4xl"
                  mentionMembers={mentionMembers}
                  currentUserId={currentUserId}
                  disabled={!isConnected}
                />
              </div>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
              <MessageSquare className="mb-4 size-16 text-muted-foreground/25" />
              <h2 className="text-lg font-semibold text-foreground">
                Bir sohbet grubu seçin
              </h2>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                {telegramEnabled
                  ? "Sol panelden bir konu seçerek mesajlaşmaya başlayın."
                  : "Sol panelden bir grup seçerek mesajlaşmaya başlayın veya yeni bir grup oluşturun."}
              </p>
            </div>
          )}
        </main>
      </div>

      {!telegramEnabled && isCreatingGroup ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-5 shadow-2xl">
            <h3 className="mb-4 flex items-center justify-between font-semibold text-foreground">
              Yeni Sohbet Grubu
              <button type="button" onClick={() => setIsCreatingGroup(false)}>
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

            <Input
              placeholder="Grup adı"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              className="mb-4"
            />

            {!telegramEnabled ? (
            <div className="mb-4">
              <label className="mb-2 block text-xs text-muted-foreground">
                Üyeleri seçin
              </label>
              <div className="custom-scrollbar flex max-h-40 flex-col gap-1 overflow-y-auto">
                {allUsers
                  .filter((u) => u.id !== currentUserId)
                  .map((user) => (
                    <label
                      key={user.id}
                      className="flex cursor-pointer items-center gap-2 rounded-lg p-2 text-sm text-muted-foreground hover:bg-accent"
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
                        className="rounded border-border"
                      />
                      {getUserDisplayName(user)}
                    </label>
                  ))}
              </div>
            </div>
            ) : null}

            <Button
              className="w-full"
              onClick={handleCreateGroup}
              disabled={!newGroupName.trim() || !selectedBoardId}
            >
              Oluştur
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
