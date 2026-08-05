"use client"

import { useState } from "react"
import { CornerDownRight, Pencil, Trash2, Check, X, Link2 } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ChatMessageAttachments } from "@/components/chat/ChatMessageAttachments"
import { ChatQuotedMessage } from "@/components/chat/ChatQuotedMessage"
import { ChatSharedCard } from "@/components/chat/ChatSharedCard"
import {
  getUserDisplayName,
  getUserInitial,
  getUserColorStylesWithOpacity,
} from "@/lib/user"
import type { CardShareSnapshot } from "@/lib/card-share"
import { ChatMessageContent } from "@/components/chat/ChatMessageContent"
import { stripMentionTokens } from "@/lib/chat-mentions"
import { cn } from "@/lib/utils"

export type ChatMessageItem = {
  id: string
  content?: string | null
  authorId: string
  source?: string | null
  createdAt: string | Date
  editedAt?: string | Date | null
  author?: {
    id?: string
    email?: string | null
    firstName?: string | null
    lastName?: string | null
  } | null
  attachments?: Array<{
    id: string
    filename: string
    mimeType: string
  }>
  card?: CardShareSnapshot | null
  replyTo?: {
    id: string
    content?: string | null
    author?: {
      firstName?: string | null
      lastName?: string | null
      email?: string | null
    } | null
    attachments?: Array<{ filename: string; mimeType?: string }>
    card?: CardShareSnapshot | null
  } | null
}

type ChatMessageBubbleProps = {
  msg: ChatMessageItem
  currentUserId: string
  onReply: (message: ChatMessageItem) => void
  onEdit?: (messageId: string, content: string) => Promise<void>
  onDelete?: (messageId: string) => Promise<void>
  onQuoteClick?: (messageId: string) => void
  highlighted?: boolean
  searchMatched?: boolean
  searchActive?: boolean
  onCopyLink?: (messageId: string) => void
}

export function ChatMessageBubble({
  msg,
  currentUserId,
  onReply,
  onEdit,
  onDelete,
  onQuoteClick,
  highlighted = false,
  searchMatched = false,
  searchActive = false,
  onCopyLink,
  isGroupStart = true,
  isGroupEnd = true,
}: ChatMessageBubbleProps & {
  isGroupStart?: boolean
  isGroupEnd?: boolean
}) {
  const authorId = msg.authorId ?? msg.author?.id
  const isMe = authorId === currentUserId
  const fromTelegram = msg.source === "telegram"
  const [isEditing, setIsEditing] = useState(false)
  const [editText, setEditText] = useState(stripMentionTokens(msg.content ?? ""))
  const [isWorking, setIsWorking] = useState(false)
  const hasCard = Boolean(msg.card)
  const hasTextContent = Boolean(msg.content?.trim())
  const hasAttachments = Boolean(msg.attachments?.length)

  const handleSaveEdit = async () => {
    if (!onEdit || !editText.trim()) return
    setIsWorking(true)
    try {
      await onEdit(msg.id, editText.trim())
      setIsEditing(false)
    } finally {
      setIsWorking(false)
    }
  }

  const handleDelete = async () => {
    if (!onDelete) return
    if (!window.confirm("Bu mesajı silmek istediğinize emin misiniz?")) return
    setIsWorking(true)
    try {
      await onDelete(msg.id)
    } finally {
      setIsWorking(false)
    }
  }

  return (
    <div
      id={`chat-msg-${msg.id}`}
      className={cn(
        "group flex gap-3 scroll-mt-4 transition-shadow duration-300",
        isMe ? "flex-row-reverse" : "flex-row",
        !isGroupEnd && "mb-0.5",
        isGroupEnd && "mb-1",
        highlighted &&
          "rounded-xl ring-2 ring-primary/70 ring-offset-2 ring-offset-background",
        searchActive &&
          "rounded-xl ring-2 ring-amber-400/90 ring-offset-2 ring-offset-background",
        searchMatched &&
          !searchActive &&
          !highlighted &&
          "rounded-xl ring-1 ring-amber-400/50",
      )}
    >
      {!isMe && isGroupEnd ? (
        <Avatar className="size-8 shrink-0">
          <AvatarFallback
            className="text-xs font-semibold"
          >
            {msg.author ? getUserInitial(msg.author) : "?"}
          </AvatarFallback>
        </Avatar>
      ) : !isMe && !isGroupEnd ? (
        <div className="size-8 shrink-0" />
      ) : null}

      <div
        className={cn(
          "flex max-w-[min(100%,42rem)] flex-col gap-1.5",
          hasCard ? "items-start" : isMe ? "items-end" : "items-start",
        )}
      >
        {!isMe && isGroupStart ? (
          <span className="px-1 text-xs text-muted-foreground">
            {msg.author ? getUserDisplayName(msg.author) : "Bilinmeyen Kullanıcı"}
            {fromTelegram ? " · Telegram" : ""}
          </span>
        ) : null}

        <div className="relative">
          {hasCard ? (
            <div className="space-y-2">
              {msg.replyTo ? (
                <ChatQuotedMessage
                  message={msg.replyTo}
                  isMe={false}
                  onClick={
                    onQuoteClick
                      ? () => onQuoteClick(msg.replyTo!.id)
                      : undefined
                  }
                />
              ) : null}
              <ChatSharedCard card={msg.card!} />
              {hasTextContent ? (
                <div
                  className={cn(
                    "rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                    isMe
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground",
                  )}
                >
                  <ChatMessageContent content={msg.content!} isMe={isMe} />
                </div>
              ) : null}
              {hasAttachments ? (
                <div
                  className={cn(
                    "rounded-2xl px-3 py-2",
                    isMe ? "bg-primary/90" : "bg-muted",
                  )}
                >
                  <ChatMessageAttachments
                    attachments={msg.attachments!}
                    isMe={isMe}
                  />
                </div>
              ) : null}
            </div>
          ) : (
            <div
              className={cn(
                "rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                isMe
                  ? cn(
                      "bg-primary text-primary-foreground",
                      isGroupEnd ? "rounded-tr-sm" : "rounded-r-md",
                      !isGroupStart && "rounded-br-md",
                    )
                  : cn(
                      "bg-muted text-foreground",
                      isGroupEnd ? "rounded-tl-sm" : "rounded-l-md",
                      !isGroupStart && "rounded-bl-md",
                    ),
              )}
            >
              {msg.replyTo ? (
                <ChatQuotedMessage
                  message={msg.replyTo}
                  isMe={isMe}
                  onClick={
                    onQuoteClick
                      ? () => onQuoteClick(msg.replyTo!.id)
                      : undefined
                  }
                />
              ) : null}

              {isEditing ? (
                <div className="space-y-2">
                  <Input
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    className="bg-background text-foreground"
                    disabled={isWorking}
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={handleSaveEdit}
                      disabled={isWorking || !editText.trim()}
                    >
                      <Check className="size-3.5" />
                      Kaydet
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setIsEditing(false)
                        setEditText(stripMentionTokens(msg.content ?? ""))
                      }}
                      disabled={isWorking}
                    >
                      <X className="size-3.5" />
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  {hasAttachments ? (
                    <ChatMessageAttachments
                      attachments={msg.attachments!}
                      isMe={isMe}
                    />
                  ) : null}
                  {hasTextContent ? (
                    <ChatMessageContent
                      content={msg.content!}
                      className={cn(hasAttachments ? "mt-2" : "")}
                      isMe={isMe}
                    />
                  ) : null}
                </>
              )}
            </div>
          )}

          {!isEditing ? (
            <div
              className={cn(
                "absolute top-0 flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100",
                isMe ? "-left-20" : "-right-20",
              )}
            >
              <button
                type="button"
                onClick={() => onReply(msg)}
                className="rounded-md bg-card p-1.5 text-muted-foreground shadow-sm hover:text-foreground"
                title="Yanıtla"
              >
                <CornerDownRight className="size-3.5" />
              </button>
              {onCopyLink ? (
                <button
                  type="button"
                  onClick={() => onCopyLink(msg.id)}
                  className="rounded-md bg-card p-1.5 text-muted-foreground shadow-sm hover:text-foreground"
                  title="Mesaj bağlantısını kopyala"
                >
                  <Link2 className="size-3.5" />
                </button>
              ) : null}
              {isMe && onEdit && msg.content ? (
                <button
                  type="button"
                  onClick={() => {
                    setEditText(stripMentionTokens(msg.content ?? ""))
                    setIsEditing(true)
                  }}
                  className="rounded-md bg-card p-1.5 text-muted-foreground shadow-sm hover:text-foreground"
                  title="Düzenle"
                >
                  <Pencil className="size-3.5" />
                </button>
              ) : null}
              {isMe && onDelete ? (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isWorking}
                  className="rounded-md bg-card p-1.5 text-muted-foreground shadow-sm hover:text-destructive"
                  title="Sil"
                >
                  <Trash2 className="size-3.5" />
                </button>
              ) : null}
            </div>
          ) : null}
        </div>

        <span className="px-1 text-[10px] text-muted-foreground/70">
          {isGroupEnd ? (
            <>
              {new Date(msg.createdAt).toLocaleString("tr-TR", {
                day: "numeric",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })}
              {msg.editedAt ? " · düzenlendi" : ""}
            </>
          ) : null}
        </span>
      </div>
    </div>
  )
}
