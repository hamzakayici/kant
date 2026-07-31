"use client"

import { useMemo, useRef, useState } from "react"
import { Mic, Paperclip, RefreshCw, Send, Smile, Square } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { ChatPendingAttachments } from "@/components/chat/ChatPendingAttachments"
import type { PendingChatAttachment } from "@/lib/chat-upload"
import {
  filterMentionMembers,
  getMentionQueryAtCursor,
  stripMentionTokens,
  type MentionMember,
} from "@/lib/chat-mentions"
import { getUserDisplayName } from "@/lib/user"

type ChatComposerProps = {
  message: string
  onMessageChange: (value: string) => void
  onSubmit: (event: React.FormEvent) => void
  onPaste?: (event: React.ClipboardEvent) => void
  pendingAttachments: PendingChatAttachment[]
  onRemoveAttachment: (id: string) => void
  onFilesSelected: (files: File[]) => void
  isSending: boolean
  isUploading?: boolean
  showEmojis: boolean
  onToggleEmojis: () => void
  emojis: string[]
  onEmojiSelect: (emoji: string) => void
  isRecording: boolean
  recordingLabel: string
  recordingError?: string | null
  onToggleRecording: () => void
  inputClassName?: string
  compact?: boolean
  mentionMembers?: MentionMember[]
  currentUserId?: string
  disabled?: boolean
}

export function ChatComposer({
  message,
  onMessageChange,
  onSubmit,
  onPaste,
  pendingAttachments,
  onRemoveAttachment,
  onFilesSelected,
  isSending,
  isUploading = false,
  showEmojis,
  onToggleEmojis,
  emojis,
  onEmojiSelect,
  isRecording,
  recordingLabel,
  recordingError,
  onToggleRecording,
  inputClassName,
  compact = false,
  mentionMembers = [],
  currentUserId,
  disabled = false,
}: ChatComposerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [mentionIndex, setMentionIndex] = useState(0)
  const [mentionRange, setMentionRange] = useState<{
    start: number
    end: number
    query: string
  } | null>(null)

  const busy = isSending || isUploading || disabled
  const canSend =
    !busy && (Boolean(message.trim()) || pendingAttachments.length > 0)

  const mentionCandidates = useMemo(() => {
    if (!mentionRange || mentionMembers.length === 0) return []
    return filterMentionMembers(
      mentionMembers,
      mentionRange.query,
      currentUserId,
    )
  }, [mentionMembers, mentionRange, currentUserId])

  const showMentionList = Boolean(mentionRange && mentionCandidates.length > 0)

  const updateMentionState = (value: string, cursor: number) => {
    const query = getMentionQueryAtCursor(value, cursor)
    if (!query) {
      setMentionRange(null)
      setMentionIndex(0)
      return
    }
    setMentionRange({
      start: query.start,
      end: query.end,
      query: query.query,
    })
    setMentionIndex(0)
  }

  const handleMessageChange = (value: string) => {
    const cleaned = stripMentionTokens(value)
    onMessageChange(cleaned)
    const cursor = inputRef.current?.selectionStart ?? cleaned.length
    updateMentionState(cleaned, cursor)
  }

  const insertMention = (member: MentionMember) => {
    if (!mentionRange) return
    const token = `@${getUserDisplayName(member)} `
    const nextValue =
      message.slice(0, mentionRange.start) +
      token +
      message.slice(mentionRange.end)
    onMessageChange(nextValue)
    setMentionRange(null)
    setMentionIndex(0)
    requestAnimationFrame(() => {
      const input = inputRef.current
      if (!input) return
      const cursor = mentionRange.start + token.length
      input.focus()
      input.setSelectionRange(cursor, cursor)
    })
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showMentionList) return

    if (event.key === "ArrowDown") {
      event.preventDefault()
      setMentionIndex((index) =>
        index + 1 >= mentionCandidates.length ? 0 : index + 1,
      )
      return
    }

    if (event.key === "ArrowUp") {
      event.preventDefault()
      setMentionIndex((index) =>
        index - 1 < 0 ? mentionCandidates.length - 1 : index - 1,
      )
      return
    }

    if (event.key === "Enter" || event.key === "Tab") {
      event.preventDefault()
      const member = mentionCandidates[mentionIndex]
      if (member) insertMention(member)
      return
    }

    if (event.key === "Escape") {
      event.preventDefault()
      setMentionRange(null)
    }
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    event.target.value = ""
    if (files.length > 0) await onFilesSelected(files)
  }

  return (
    <div className={cn("relative", inputClassName)}>
      {isRecording ? (
        <div className="mb-2 flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <span className="size-2 animate-pulse rounded-full bg-destructive" />
          <span>Kaydediliyor… {recordingLabel}</span>
          <button
            type="button"
            onClick={onToggleRecording}
            className="ml-auto inline-flex items-center gap-1 text-xs font-medium"
          >
            <Square className="size-3.5 fill-current" />
            Durdur
          </button>
        </div>
      ) : null}

      {recordingError ? (
        <p className="mb-2 text-xs text-destructive">{recordingError}</p>
      ) : null}

      <ChatPendingAttachments
        attachments={pendingAttachments}
        onRemove={onRemoveAttachment}
        className="mb-2"
      />

      <form onSubmit={onSubmit} className="relative">
        {showEmojis ? (
          <div
            className={cn(
              "absolute bottom-full left-0 z-50 mb-2 flex flex-wrap gap-2 rounded-xl border border-border bg-muted p-3 shadow-xl",
              compact ? "w-48" : "w-56",
            )}
          >
            {emojis.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => onEmojiSelect(emoji)}
                className="text-lg transition-transform hover:scale-125"
              >
                {emoji}
              </button>
            ))}
          </div>
        ) : null}

        {showMentionList ? (
          <div className="absolute bottom-full left-0 z-50 mb-2 w-full max-w-sm overflow-hidden rounded-xl border border-border bg-popover shadow-xl">
            <p className="border-b border-border px-3 py-2 text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
              Kullanıcı etiketle
            </p>
            <ul className="max-h-44 overflow-y-auto py-1">
              {mentionCandidates.map((member, index) => (
                <li key={member.id}>
                  <button
                    type="button"
                    className={cn(
                      "flex w-full items-center gap-2 px-3 py-2 text-left text-sm",
                      index === mentionIndex
                        ? "bg-accent text-foreground"
                        : "text-muted-foreground hover:bg-accent/70",
                    )}
                    onMouseDown={(event) => {
                      event.preventDefault()
                      insertMention(member)
                    }}
                  >
                    <span className="font-medium">
                      {getUserDisplayName(member)}
                    </span>
                    {member.email ? (
                      <span className="truncate text-xs opacity-70">
                        {member.email}
                      </span>
                    ) : null}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div
          className={cn(
            "flex items-center gap-2 rounded-xl border border-border bg-card transition-colors focus-within:border-primary/50",
            compact ? "overflow-hidden" : "px-2 py-1",
          )}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleFileChange}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={busy || isRecording}
            className={compact ? "py-2 pl-3" : undefined}
            title="Dosya ekle"
          >
            <Paperclip className="size-5 text-muted-foreground" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onToggleRecording}
            disabled={busy}
            className={cn(isRecording && "text-destructive")}
            title={isRecording ? "Kaydı durdur" : "Sesli mesaj"}
          >
            {isRecording ? (
              <Square className="size-5 fill-current" />
            ) : (
              <Mic className="size-5 text-muted-foreground" />
            )}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onToggleEmojis}
            disabled={isRecording || disabled}
            className={compact ? "text-muted-foreground hover:text-yellow-500" : undefined}
            title="Emoji"
          >
            <Smile className="size-5 text-muted-foreground" />
          </Button>

          {compact ? (
            <input
              ref={inputRef}
              type="text"
              value={message}
              onChange={(event) => handleMessageChange(event.target.value)}
              onKeyDown={handleKeyDown}
              onClick={(event) =>
                updateMentionState(
                  message,
                  (event.target as HTMLInputElement).selectionStart ?? message.length,
                )
              }
              onPaste={onPaste}
              placeholder="Mesaj yazın... (@ ile etiketle)"
              disabled={isRecording || disabled}
              className="flex-1 bg-transparent px-1 py-3 text-sm text-foreground outline-none"
            />
          ) : (
            <Input
              ref={inputRef}
              value={message}
              onChange={(event) => handleMessageChange(event.target.value)}
              onKeyDown={handleKeyDown}
              onClick={(event) =>
                updateMentionState(
                  message,
                  (event.currentTarget as HTMLInputElement).selectionStart ??
                    message.length,
                )
              }
              onPaste={onPaste}
              placeholder="Mesaj yazın... (@ ile etiketle)"
              disabled={isRecording || disabled}
              className="border-0 bg-transparent shadow-none focus-visible:ring-0"
            />
          )}

          <Button
            type="submit"
            size="icon-sm"
            disabled={!canSend || isRecording}
            className={compact ? "pr-3" : undefined}
            title="Gönder"
          >
            {busy ? (
              <RefreshCw className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
