"use client"

import {
  Calendar,
  CheckSquare,
  ChevronRight,
  Columns3,
  LayoutGrid,
  Loader2,
  MessageSquare,
  Paperclip,
} from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  getDueDateClass,
  getPriorityBadgeClass,
  getPriorityLabel,
} from "@/lib/card-styles"
import {
  formatCardSharePreview,
  type CardShareSnapshot,
} from "@/lib/card-share"
import { getAttachmentUrl } from "@/lib/attachment-url"
import { useOptionalCardModal } from "@/components/providers/CardModalProvider"
import { getUserInitial } from "@/lib/user"
import { cn } from "@/lib/utils"

const PRIORITY_BORDER: Record<string, string> = {
  LOW: "border-l-blue-400",
  MEDIUM: "border-l-purple-400",
  HIGH: "border-l-orange-400",
  URGENT: "border-l-destructive",
}

function formatDueDate(dueDate: string | Date) {
  const date = new Date(dueDate)
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const target = new Date(date)
  target.setHours(0, 0, 0, 0)
  const diffDays = Math.round(
    (target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
  )

  return {
    label: date.toLocaleDateString("tr-TR", {
      day: "numeric",
      month: "short",
    }),
    diffDays,
  }
}

function useOpenSharedCard(cardId: string, fallbackUrl: string) {
  const cardModal = useOptionalCardModal()

  return {
    isOpening: cardModal?.isOpening ?? false,
    open: () => {
      if (cardModal) {
        void cardModal.openCard(cardId)
        return
      }
      window.location.assign(fallbackUrl)
    },
  }
}

export function ChatSharedCard({
  card,
  variant = "default",
}: {
  card: CardShareSnapshot
  variant?: "default" | "compact"
  isMe?: boolean
}) {
  const preview = formatCardSharePreview(card)
  const { open, isOpening } = useOpenSharedCard(card.id, preview.url)
  const priorityBorder =
    card.priority && card.priority !== "NONE"
      ? PRIORITY_BORDER[card.priority]
      : "border-l-muted-foreground/30"
  const dueDate = card.dueDate ? formatDueDate(card.dueDate) : null
  const coverUrl = preview.cover ? getAttachmentUrl(preview.cover) : null

  if (variant === "compact") {
    return (
      <button
        type="button"
        onClick={open}
        disabled={isOpening}
        className="flex min-w-0 w-full items-center gap-2 rounded-md border border-border/70 bg-background/80 px-2 py-1.5 text-left transition-colors hover:bg-background disabled:opacity-70"
      >
        {isOpening ? (
          <Loader2 className="size-3.5 shrink-0 animate-spin text-primary" />
        ) : (
          <LayoutGrid className="size-3.5 shrink-0 text-primary" />
        )}
        <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
          {preview.identifier}
        </span>
        <span className="truncate text-xs font-medium">{preview.title}</span>
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={open}
      disabled={isOpening}
      className={cn(
        "group block w-full max-w-[20rem] overflow-hidden rounded-xl border border-border/80 bg-card text-left shadow-sm transition-all",
        "hover:border-primary/35 hover:shadow-md disabled:opacity-70",
      )}
    >
      {coverUrl ? (
        <div className="relative h-24 w-full overflow-hidden border-b border-border/60 bg-muted/30">
          <img
            src={coverUrl}
            alt=""
            className={cn(
              "h-full w-full",
              card.coverMode === "CONTAIN" ? "object-contain" : "object-cover",
            )}
            onError={(e) => {
              ;(e.target as HTMLImageElement).style.display = "none"
            }}
          />
        </div>
      ) : null}

      <div className="flex items-center gap-2 border-b border-border/60 bg-muted/35 px-3 py-2">
        <div className="flex size-6 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
          {isOpening ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <LayoutGrid className="size-3.5" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[11px] font-medium text-muted-foreground">
            {preview.boardName}
          </p>
        </div>
        <ChevronRight className="size-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
      </div>

      <div className={cn("border-l-[3px] px-3 py-3", priorityBorder)}>
        <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
          <span className="font-mono text-[10px] font-semibold text-muted-foreground">
            {preview.identifier}
          </span>
          {card.priority && card.priority !== "NONE" ? (
            <Badge
              variant="outline"
              className={cn(
                "h-4 px-1.5 text-[9px] font-semibold",
                getPriorityBadgeClass(card.priority),
              )}
            >
              {getPriorityLabel(card.priority)}
            </Badge>
          ) : null}
        </div>

        <h4 className="line-clamp-2 text-sm leading-snug font-semibold text-foreground">
          {preview.title}
        </h4>

        {preview.descriptionSnippet ? (
          <p className="mt-1.5 line-clamp-2 text-xs text-muted-foreground">
            {preview.descriptionSnippet}
          </p>
        ) : null}

        {preview.tags.length > 0 ? (
          <div className="mt-2 flex flex-wrap gap-1">
            {preview.tags.slice(0, 3).map((tag, index) => (
              <Badge
                key={`${tag}-${index}`}
                variant="outline"
                className="h-4 border-orange-500/20 bg-orange-500/10 px-1.5 text-[9px] text-orange-300"
              >
                {tag}
              </Badge>
            ))}
          </div>
        ) : null}

        <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Columns3 className="size-3 shrink-0" />
          <span className="truncate">{preview.columnName}</span>
        </div>

        {preview.checklist.total > 0 ? (
          <div className="mt-2">
            <div className="mb-1 flex items-center justify-between text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <CheckSquare className="size-3" />
                Kontrol listesi
              </span>
              <span
                className={cn(
                  preview.checklist.done === preview.checklist.total &&
                    "text-primary",
                )}
              >
                {preview.checklist.done}/{preview.checklist.total}
              </span>
            </div>
            <div className="h-1 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{
                  width: `${(preview.checklist.done / preview.checklist.total) * 100}%`,
                }}
              />
            </div>
          </div>
        ) : null}

        <div className="mt-2.5 flex items-center justify-between gap-2">
          {preview.assignees ? (
            <div className="flex min-w-0 items-center gap-1.5">
              <div className="flex -space-x-1.5">
                {card.assignees.slice(0, 3).map((user, index) => (
                  <Avatar
                    key={`${user.email ?? "user"}-${index}`}
                    className="size-5 border border-card"
                  >
                    <AvatarFallback className="bg-muted text-[9px] font-semibold">
                      {getUserInitial(user)}
                    </AvatarFallback>
                  </Avatar>
                ))}
              </div>
              <span className="truncate text-[11px] text-muted-foreground">
                {preview.assignees}
              </span>
            </div>
          ) : (
            <span className="text-[11px] text-muted-foreground/70">
              Atanan yok
            </span>
          )}

          <div className="flex shrink-0 items-center gap-1.5">
            {preview.attachmentCount > 0 ? (
              <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                <Paperclip className="size-3" />
                {preview.attachmentCount}
              </span>
            ) : null}
            {preview.commentCount > 0 ? (
              <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                <MessageSquare className="size-3" />
                {preview.commentCount}
              </span>
            ) : null}
            {dueDate ? (
              <span
                className={cn(
                  "rounded px-1.5 py-0.5 text-[10px] font-medium",
                  getDueDateClass(dueDate.diffDays),
                )}
              >
                <Calendar className="mr-0.5 inline size-3" />
                {dueDate.label}
              </span>
            ) : null}
          </div>
        </div>

        <p className="mt-2 text-[10px] font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
          Kartı aç
        </p>
      </div>
    </button>
  )
}
