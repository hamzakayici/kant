"use client"

import { formatDistanceToNow } from "date-fns"
import { tr } from "date-fns/locale"
import { getUserDisplayName } from "@/lib/user"

type ActivityItem = {
  id: string
  action: string
  createdAt: string | Date
  user?: {
    email?: string
    firstName?: string | null
    lastName?: string | null
  } | null
  card?: {
    title?: string
  } | null
}

type InboxActivityPaneProps = {
  activities: ActivityItem[]
}

export function InboxActivityPane({ activities }: InboxActivityPaneProps) {
  if (activities.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center p-6 text-center text-sm text-muted-foreground">
        Bu projede henüz aktivite yok.
      </div>
    )
  }

  return (
    <div className="custom-scrollbar flex-1 overflow-y-auto p-4">
      <div className="flex flex-col gap-2">
        {activities.map((log) => {
          const userName = log.user ? getUserDisplayName(log.user) : "Bilinmeyen"
          const initial = userName.charAt(0).toUpperCase()

          return (
            <div
              key={log.id}
              className="flex gap-3 rounded-lg border border-transparent p-3 transition-colors hover:border-border hover:bg-accent/50"
            >
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-xs font-bold text-primary">
                {initial}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">{userName}</span>{" "}
                  {log.action}
                </p>
                <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span>
                    {formatDistanceToNow(new Date(log.createdAt), {
                      addSuffix: true,
                      locale: tr,
                    })}
                  </span>
                  {log.card?.title ? (
                    <span className="rounded bg-muted px-1.5 py-0.5 text-muted-foreground">
                      {log.card.title}
                    </span>
                  ) : null}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
