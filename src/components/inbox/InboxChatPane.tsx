"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { Hash, Plus, X } from "lucide-react"
import {
  createChatGroup,
  editChatMessage,
  deleteChatMessage,
  getChatMessages,
  sendChatMessage,
} from "@/app/actions"
import { getUserChatGroups } from "@/app/actions/chatActions"
import { ChatComposer } from "@/components/chat/ChatComposer"
import { ChatDropOverlay } from "@/components/chat/ChatDropOverlay"
import { ChatMessageBubble } from "@/components/chat/ChatMessageBubble"
import { ChatReplyBar } from "@/components/chat/ChatReplyBar"
import { ChatScrollToBottomButton } from "@/components/chat/ChatScrollToBottomButton"
import { ChatUnreadBadge } from "@/components/chat/ChatUnreadBadge"
import { useChatMediaUpload } from "@/hooks/useChatMediaUpload"
import { useVoiceRecorder } from "@/hooks/useVoiceRecorder"
import {
  useChatGroupsLive,
  useMarkChatGroupRead,
} from "@/hooks/useChatGroupsLive"
import { useChatScrollToMessage } from "@/hooks/useChatScrollToMessage"
import { useConnectionStatus } from "@/hooks/useConnectionStatus"
import { formatChatActionError } from "@/lib/chat-action-error"
import { getMessageGroupFlags } from "@/lib/chat-message-grouping"
import type { MentionMember } from "@/lib/chat-mentions"
import { normalizeMentionsInContent } from "@/lib/chat-mentions"
import {
  CHAT_LIVE_POLL_MS,
  getVisibilityAwarePollMs,
  shouldReplaceChatMessages,
} from "@/lib/chat-live"
import { formatChatMessagePreview } from "@/lib/chat-preview"
import type { EnrichedChatGroup } from "@/lib/chat-types"
import { getLastChatMessage } from "@/lib/chat-unread"
import { recoverFromStaleServerAction } from "@/lib/server-action-error"
import { getUserDisplayName } from "@/lib/user"
import { cn } from "@/lib/utils"

type InboxChatPaneProps = {
  boardId: string
  currentUserId: string
  initialGroups: EnrichedChatGroup[]
  allUsers: {
    id: string
    email: string
    firstName?: string | null
    lastName?: string | null
  }[]
  telegramEnabled: boolean
}

export function InboxChatPane({
  boardId,
  currentUserId,
  initialGroups,
  allUsers,
  telegramEnabled,
}: InboxChatPaneProps) {
  const { chatGroups, setChatGroups } = useChatGroupsLive(initialGroups)
  const [activeGroup, setActiveGroup] = useState<EnrichedChatGroup | null>(
    () => initialGroups[0] ?? null,
  )
  const [messages, setMessages] = useState<any[]>([])
  const [message, setMessage] = useState("")
  const [sendError, setSendError] = useState<string | null>(null)
  const [isSending, setIsSending] = useState(false)
  const [showEmojis, setShowEmojis] = useState(false)
  const [replyTo, setReplyTo] = useState<any | null>(null)
  const [isCreatingGroup, setIsCreatingGroup] = useState(false)
  const [newGroupName, setNewGroupName] = useState("")
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([])

  const { isConnected } = useConnectionStatus()
  const prevMessageCountRef = useRef(0)
  const emojis = ["👍", "❤️", "😂", "🚀", "🔥", "✨"]

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

  const { isRecording, durationLabel, error: recordingError, toggleRecording } =
    useVoiceRecorder((file) => {
      void uploadFiles([file])
    })

  const mentionMembers = useMemo<MentionMember[]>(
    () =>
      activeGroup?.members?.map((member) => ({
        id: member.user?.id ?? member.userId,
        firstName: member.user?.firstName,
        lastName: member.user?.lastName,
        email: member.user?.email,
      })) ?? [],
    [activeGroup],
  )

  useMarkChatGroupRead(
    activeGroup?.id,
    Boolean(activeGroup),
    messages.length,
  )

  const selectGroup = useCallback(
    (group: EnrichedChatGroup) => {
      resetInitialScroll(group.id)
      prevMessageCountRef.current = 0
      setChatGroups((prev) =>
        prev.map((item) =>
          item.id === group.id ? { ...item, unreadCount: 0 } : item,
        ),
      )
      setActiveGroup(group)
      setReplyTo(null)
      setIsCreatingGroup(false)
    },
    [resetInitialScroll, setChatGroups],
  )

  useEffect(() => {
    if (!activeGroup && chatGroups.length > 0) {
      selectGroup(chatGroups[0])
    }
  }, [activeGroup, chatGroups, selectGroup])

  useEffect(() => {
    resetInitialScroll(activeGroup?.id ?? null)
    prevMessageCountRef.current = 0
  }, [activeGroup?.id, resetInitialScroll])

  useEffect(() => {
    if (!activeGroup || messages.length === 0) return

    const member = activeGroup.members?.find(
      (item) => item.userId === currentUserId,
    )

    handleInitialGroupScroll({
      groupId: activeGroup.id,
      messages,
      unreadCount: activeGroup.unreadCount ?? 0,
      lastReadAt: member?.lastReadAt,
      currentUserId,
    })
  }, [activeGroup, messages, currentUserId, handleInitialGroupScroll])

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

    void fetchMsgs()

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
      setMessages((prev) => [
        ...prev,
        {
          id: `temp-${Date.now()}`,
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
    } finally {
      setIsSending(false)
    }
  }

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) return
    await createChatGroup(newGroupName, boardId, selectedUserIds)
    setIsCreatingGroup(false)
    setNewGroupName("")
    setSelectedUserIds([])

    const updated = await getUserChatGroups()
    const boardGroups = updated.filter((group) => group.boardId === boardId)
    setChatGroups(boardGroups)
    if (boardGroups.length > 0) {
      selectGroup(boardGroups[0])
    }
  }

  const groupPreview = (group: EnrichedChatGroup) => {
    const lastMsg = getLastChatMessage(group)
    if (!lastMsg) return "Henüz mesaj yok"
    const prefix = lastMsg.authorId === currentUserId ? "Sen: " : ""
    return `${prefix}${formatChatMessagePreview(lastMsg)}`
  }

  return (
    <div className="flex min-h-0 flex-1 overflow-hidden">
      <div className="flex w-[38%] min-w-[120px] flex-col border-r border-border bg-muted/20">
        <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Sohbetler
          </span>
          {!telegramEnabled ? (
            <button
              type="button"
              onClick={() => setIsCreatingGroup(true)}
              className="rounded-md p-1 text-primary transition-colors hover:bg-primary/10"
              title="Yeni grup"
            >
              <Plus className="size-4" />
            </button>
          ) : null}
        </div>

        <div className="custom-scrollbar flex-1 overflow-y-auto p-2">
          {chatGroups.length === 0 ? (
            <p className="px-2 py-4 text-center text-xs text-muted-foreground">
              {telegramEnabled
                ? "Bu projede henüz Telegram konusu yok."
                : "Henüz sohbet grubu yok."}
            </p>
          ) : (
            chatGroups.map((group) => (
              <button
                key={group.id}
                type="button"
                onClick={() => selectGroup(group)}
                className={cn(
                  "mb-1 flex w-full items-start gap-2 rounded-lg p-2 text-left transition-colors",
                  activeGroup?.id === group.id
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
              >
                <Hash className="mt-0.5 size-3.5 shrink-0 opacity-60" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="truncate text-xs font-medium">
                      {group.name}
                    </span>
                    <ChatUnreadBadge count={group.unreadCount ?? 0} />
                  </div>
                  <p className="truncate text-[10px] opacity-80">
                    {groupPreview(group)}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col bg-card">
        {isCreatingGroup ? (
          <div className="custom-scrollbar flex flex-1 flex-col overflow-y-auto p-4">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">
                Yeni Sohbet Grubu
              </h3>
              <button
                type="button"
                onClick={() => setIsCreatingGroup(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>
            <input
              type="text"
              placeholder="Grup adı"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              className="mb-4 w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground outline-none focus:border-ring"
            />
            <p className="mb-2 text-xs font-medium text-muted-foreground">
              Üyeler
            </p>
            <div className="mb-4 max-h-48 space-y-1 overflow-y-auto rounded-lg border border-border bg-muted/30 p-2">
              {allUsers
                .filter((user) => user.id !== currentUserId)
                .map((user) => (
                  <label
                    key={user.id}
                    className="flex cursor-pointer items-center gap-2 rounded-md p-2 text-sm hover:bg-accent"
                  >
                    <input
                      type="checkbox"
                      checked={selectedUserIds.includes(user.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedUserIds((prev) => [...prev, user.id])
                        } else {
                          setSelectedUserIds((prev) =>
                            prev.filter((id) => id !== user.id),
                          )
                        }
                      }}
                      className="rounded border-border"
                    />
                    <span className="truncate text-muted-foreground">
                      {getUserDisplayName(user)}
                    </span>
                  </label>
                ))}
            </div>
            <button
              type="button"
              onClick={() => void handleCreateGroup()}
              disabled={!newGroupName.trim()}
              className="mt-auto rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              Oluştur
            </button>
          </div>
        ) : activeGroup ? (
          <>
            <div className="flex shrink-0 items-center justify-between border-b border-border px-3 py-2.5">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">
                  {activeGroup.name}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {activeGroup.members?.length ?? 0} üye
                </p>
              </div>
              <Link
                href={`/chat?group=${encodeURIComponent(activeGroup.id)}`}
                className="shrink-0 rounded-md bg-muted px-2 py-1 text-[10px] text-muted-foreground transition-colors hover:text-foreground"
              >
                Genişlet
              </Link>
            </div>

            <div className="relative flex min-h-0 flex-1 flex-col" {...dragHandlers}>
              <div
                ref={messagesScrollRef}
                onScroll={handleMessagesScroll}
                className="custom-scrollbar relative flex flex-1 flex-col gap-3 overflow-y-auto p-3"
              >
                <ChatScrollToBottomButton
                  visible={showScrollToBottom}
                  unreadCount={activeGroup.unreadCount ?? 0}
                  onClick={() => scrollToBottom()}
                />
                <ChatDropOverlay visible={isDragging} />
                {messages.length === 0 ? (
                  <p className="m-auto text-center text-xs text-muted-foreground">
                    Bu grupta henüz mesaj yok.
                  </p>
                ) : (
                  messages.map((msg, index) => {
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

            <div className="shrink-0 border-t border-border p-2">
              {sendError ? (
                <p className="mb-2 rounded-lg border border-destructive/30 bg-destructive/10 px-2 py-1.5 text-xs text-destructive">
                  {sendError}
                </p>
              ) : null}
              {replyTo ? (
                <ChatReplyBar
                  replyTo={replyTo}
                  onCancel={() => setReplyTo(null)}
                  onQuoteClick={scrollToMessage}
                />
              ) : null}
              {uploadError ? (
                <p className="mb-2 text-xs text-destructive">{uploadError}</p>
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
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 px-4 text-center">
            <p className="text-sm text-muted-foreground">
              Sohbet seçin veya yeni bir grup oluşturun.
            </p>
            {!telegramEnabled ? (
              <button
                type="button"
                onClick={() => setIsCreatingGroup(true)}
                className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
              >
                Grup oluştur
              </button>
            ) : (
              <Link
                href="/chat"
                className="text-xs text-primary hover:underline"
              >
                Tam sayfa sohbete git →
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
