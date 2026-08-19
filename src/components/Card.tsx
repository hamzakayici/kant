"use client"

import { memo } from "react"
import { useSortable } from "@dnd-kit/sortable"
import { sortableTranslateStyle } from "@/lib/kanban-dnd-style"
import {
  Trash2,
  Paperclip,
  MessageSquare,
  AlignLeft,
  Clock,
  CheckSquare,
  Share2,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  getDueDateClass,
  getPriorityBadgeClass,
  getPriorityLabel,
} from "@/lib/card-styles"
import { getUserDisplayName, getUserInitial } from "@/lib/user"
import { cn } from "@/lib/utils"
import { getAttachmentUrl, getAttachmentExternalUrl } from "@/lib/attachment-url"

const PRIORITY_BORDER: Record<string, string> = {
  LOW: "border-l-blue-400",
  MEDIUM: "border-l-purple-400",
  HIGH: "border-l-orange-400",
  URGENT: "border-l-destructive",
}

function Card({
  card,
  isOverlay = false,
  isHidden = false,
  canDelete = false,
  boardIdentifier = "ATF",
  onDelete,
  onShare,
  onClick,
}: {
  card: any
  userRole?: string
  isOverlay?: boolean
  isHidden?: boolean
  canDelete?: boolean
  boardIdentifier?: string
  onDelete: () => void
  onShare?: () => void
  onClick: () => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: card.id,
    data: { type: "Card", card, columnId: card.columnId },
    disabled: isHidden || isOverlay,
    animateLayoutChanges: () => false,
  })

  const style = sortableTranslateStyle(
    transform,
    isDragging ? transition : undefined,
  )

  if (isHidden && !isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="h-0 overflow-hidden opacity-0"
        aria-hidden
      />
    )
  }

  if (isDragging && !isOverlay) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="h-[72px] rounded-xl border-2 border-dashed border-primary/40 bg-primary/5"
      />
    )
  }

  const isImageAttachment = (att: any) =>
    att.mimeType?.startsWith("image/") ||
    /\.(jpg|jpeg|png|gif|webp|avif)$/i.test(att.filename ?? "")

  const coverImage = (() => {
    if (card.coverAttachmentId) {
      const found = card.attachments?.find((a: any) => a.id === card.coverAttachmentId)
      if (found) return found
    }
    // Son eklenen resim ekini kapak olarak kullan (attachments desc sıralı)
    return card.attachments?.find(isImageAttachment) ?? null
  })()

  const checklistTotal = card.checklists?.length ?? 0
  const checklistDone =
    card.checklists?.filter((c: any) => c.isDone).length ?? 0
  const assignees = card.assignees?.length
    ? card.assignees
    : card.creator
      ? [card.creator]
      : []

  const attachmentCount = card.attachments?.length || 0
  const commentCount = card.comments?.length || 0
  const hasMeta =
    card.dueDate ||
    card.description ||
    attachmentCount > 0 ||
    commentCount > 0 ||
    checklistTotal > 0

  const priorityBorder =
    card.priority && card.priority !== "NONE"
      ? PRIORITY_BORDER[card.priority]
      : "border-l-transparent"

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => {
        if (!isOverlay) onClick()
      }}
      className={cn(
        "group relative shrink-0 overflow-hidden rounded-xl border border-border/80 bg-card shadow-sm transition-all",
        "border-l-[3px]",
        priorityBorder,
        isOverlay
          ? "scale-[1.02] rotate-1 shadow-2xl ring-2 ring-primary/30"
          : "cursor-grab hover:border-border hover:shadow-md active:cursor-grabbing",
      )}
    >
      {coverImage ? (
        <div
          className={cn(
            "relative flex w-full items-center justify-center overflow-hidden h-28 shrink-0",
            card.coverMode === "CONTAIN"
              ? "border-b border-border/50 bg-muted/30 p-1.5"
              : "bg-black/40",
          )}
        >
          <img
            src={getAttachmentExternalUrl(coverImage)}
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

      <div className="relative p-3">
        <div className="absolute top-2 right-2 z-10 flex items-center gap-1">
          {onShare && !isOverlay ? (
            <Button
              type="button"
              variant="secondary"
              size="icon-sm"
              className="size-7 opacity-100 md:opacity-0 md:transition-opacity md:group-hover:opacity-100"
              title="Sohbete ilet"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation()
                onShare()
              }}
            >
              <Share2 className="size-3.5" />
            </Button>
          ) : null}
          {canDelete && !isOverlay ? (
            <Button
              type="button"
              variant="destructive"
              size="icon-sm"
              className="size-7 opacity-100 md:opacity-0 md:transition-opacity md:group-hover:opacity-100"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation()
                onDelete()
              }}
            >
              <Trash2 className="size-3.5" />
            </Button>
          ) : null}
        </div>

        <div className="pointer-events-none min-w-0">
          <div className="mb-1.5 flex items-center gap-2 pr-6">
            <span className="shrink-0 font-mono text-[10px] font-semibold text-muted-foreground">
              {boardIdentifier}-{card.sequenceId}
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

          <h3 className="mb-2 line-clamp-3 text-[13px] leading-snug font-medium text-foreground">
            {card.title}
          </h3>

          {card.tags?.length > 0 ? (
            <div className="mb-2 flex flex-wrap gap-1">
              {card.tags.slice(0, 3).map((tag: string, index: number) => (
                <Badge
                  key={`${tag}-${index}`}
                  variant="outline"
                  className="h-4 border-orange-500/20 bg-orange-500/10 px-1.5 text-[9px] text-orange-300"
                >
                  {tag}
                </Badge>
              ))}
              {card.tags.length > 3 ? (
                <span className="text-[9px] text-muted-foreground">
                  +{card.tags.length - 3}
                </span>
              ) : null}
            </div>
          ) : null}

          {hasMeta || assignees.length > 0 ? (
            <div className="mt-2 flex items-center justify-between gap-2 border-t border-border/50 pt-2">
              <div className="flex -space-x-1.5">
                {assignees.slice(0, 3).map((user: any) => (
                  <Avatar
                    key={user.id}
                    className="size-5 border-2 border-card"
                    title={getUserDisplayName(user)}
                  >
                    <AvatarFallback className="bg-primary/20 text-[8px] font-bold text-primary">
                      {getUserInitial(user)}
                    </AvatarFallback>
                  </Avatar>
                ))}
                {assignees.length > 3 ? (
                  <span className="flex size-5 items-center justify-center rounded-full border-2 border-card bg-muted text-[8px] font-medium text-muted-foreground">
                    +{assignees.length - 3}
                  </span>
                ) : null}
              </div>

              <div className="flex items-center gap-2 text-muted-foreground">
                {checklistTotal > 0 ? (
                  <span
                    className={cn(
                      "flex items-center gap-0.5 text-[10px] font-medium",
                      checklistDone === checklistTotal && "text-primary",
                    )}
                    title="Kontrol listesi"
                  >
                    <CheckSquare className="size-3" />
                    {checklistDone}/{checklistTotal}
                  </span>
                ) : null}

                {card.dueDate
                  ? (() => {
                      const diffDays = Math.ceil(
                        (new Date(card.dueDate).getTime() - Date.now()) /
                          (1000 * 3600 * 24),
                      )
                      return (
                        <span
                          className={cn(
                            "flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px]",
                            getDueDateClass(diffDays),
                          )}
                        >
                          <Clock className="size-3" />
                          {new Date(card.dueDate).toLocaleDateString("tr-TR", {
                            day: "numeric",
                            month: "short",
                          })}
                        </span>
                      )
                    })()
                  : null}

                {card.description ? (
                  <span title="Açıklama var">
                    <AlignLeft className="size-3" />
                  </span>
                ) : null}

                {attachmentCount > 0 ? (
                  <span className="flex items-center gap-0.5 text-[10px] font-medium">
                    <Paperclip className="size-3" />
                    {attachmentCount}
                  </span>
                ) : null}

                {commentCount > 0 ? (
                  <span className="flex items-center gap-0.5 text-[10px] font-medium">
                    <MessageSquare className="size-3" />
                    {commentCount}
                  </span>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export default memo(Card, (prev, next) => {
  if (prev.isOverlay !== next.isOverlay) return false
  if (prev.isHidden !== next.isHidden) return false
  if (prev.canDelete !== next.canDelete) return false
  if (prev.boardIdentifier !== next.boardIdentifier) return false
  return prev.card === next.card
})
