"use client"

import { useMemo, useState } from "react"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import InboxSidebar from "./InboxSidebar"
import type { EnrichedChatGroup } from "@/lib/chat-types"
import { getTotalUnreadCount } from "@/lib/chat-unread"

export default function InboxWrapper({
  boardId,
  currentUserId,
  allUsers = [],
  chatGroups = [],
  activities = [],
  telegramEnabled = false,
}: {
  boardId: string
  currentUserId: string
  allUsers?: {
    id: string
    email: string
    firstName?: string | null
    lastName?: string | null
  }[]
  chatGroups?: EnrichedChatGroup[]
  activities?: any[]
  telegramEnabled?: boolean
}) {
  const [isOpen, setIsOpen] = useState(false)

  const unreadCount = useMemo(
    () => getTotalUnreadCount(chatGroups),
    [chatGroups],
  )
  const hasBadge = unreadCount > 0 || activities.length > 0

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        className="relative"
        title="Gelen Kutusu"
        onClick={() => setIsOpen(true)}
      >
        <Bell className="size-4" />
        {hasBadge ? (
          <span className="absolute top-1 right-1 size-2 rounded-full border-2 border-background bg-primary" />
        ) : null}
      </Button>

      {isOpen ? (
        <InboxSidebar
          onClose={() => setIsOpen(false)}
          boardId={boardId}
          currentUserId={currentUserId}
          allUsers={allUsers}
          chatGroups={chatGroups}
          activities={activities}
          telegramEnabled={telegramEnabled}
        />
      ) : null}
    </>
  )
}
