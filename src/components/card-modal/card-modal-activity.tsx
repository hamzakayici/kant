"use client"

import { Clock, MessageSquare, Send } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { getUserDisplayName, getUserInitial } from "@/lib/user"
import { cn } from "@/lib/utils"

type CardModalActivityProps = {
  activities: any[]
  comments: any[]
  commentText: string
  isSubmittingComment: boolean
  onCommentChange: (value: string) => void
  onCommentSubmit: () => void
}

export function CardModalActivity({
  activities,
  comments,
  commentText,
  isSubmittingComment,
  onCommentChange,
  onCommentSubmit,
}: CardModalActivityProps) {
  const items = [
    ...(activities || []).map((a) => ({
      ...a,
      type: "activity" as const,
      date: new Date(a.createdAt),
    })),
    ...(comments || []).map((c) => ({
      ...c,
      type: "comment" as const,
      date: new Date(c.createdAt),
      user: c.author,
    })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime())

  return (
    <aside className="flex min-h-0 flex-col border-t border-border/80 bg-muted/20 lg:border-t-0 lg:border-l">
      <div className="flex items-center gap-2 border-b border-border/60 px-4 py-3">
        <MessageSquare className="size-4 text-primary" />
        <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          Yorumlar ve Etkinlik
        </h3>
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <div className="space-y-4 p-4">
          {items.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Henüz yorum veya etkinlik yok.
            </p>
          ) : (
            items.map((item) => (
              <div key={`${item.type}-${item.id}`} className="flex gap-3">
                <Avatar className="size-8 shrink-0">
                  <AvatarFallback className="bg-primary/15 text-xs font-bold text-primary">
                    {getUserInitial(item.user)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="text-sm leading-snug">
                    <span className="font-semibold">
                      {getUserDisplayName(item.user)}
                    </span>
                    {item.type === "activity" ? (
                      <span className="ml-1 text-muted-foreground">
                        {item.action}
                      </span>
                    ) : null}
                  </div>
                  {item.type === "comment" ? (
                    <div className="mt-2 rounded-xl border border-border/60 bg-card/80 px-3 py-2.5 text-sm whitespace-pre-wrap text-foreground/90">
                      {item.content}
                    </div>
                  ) : null}
                  <div className="mt-1.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                    <Clock className="size-3" />
                    {item.date.toLocaleString("tr-TR", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      <div className="shrink-0 border-t border-border/60 p-4">
        <div
          className={cn(
            "flex items-center gap-2 rounded-xl border border-border/80 bg-card px-3 py-2",
            "focus-within:border-ring",
          )}
        >
          <textarea
            value={commentText}
            onChange={(e) => onCommentChange(e.target.value)}
            placeholder="Yorum yaz..."
            rows={2}
            className={cn(
              "min-h-0 flex-1 resize-none border-0 bg-transparent py-1.5 text-sm",
              "placeholder:text-muted-foreground/70 focus:outline-none",
            )}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                onCommentSubmit()
              }
            }}
          />
          <Button
            type="button"
            size="icon-sm"
            className="shrink-0"
            disabled={isSubmittingComment || !commentText.trim()}
            onClick={onCommentSubmit}
          >
            <Send className="size-3.5" />
          </Button>
        </div>
      </div>
    </aside>
  )
}
