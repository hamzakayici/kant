"use client"

import { useState } from "react"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import InboxSidebar from "./InboxSidebar"

export default function InboxWrapper({
  boardId,
  userRole,
  currentUserId,
  allUsers = [],
  chatGroups = [],
  activities = [],
}: {
  boardId: string
  userRole: string
  currentUserId: string
  allUsers?: any[]
  chatGroups?: any[]
  activities?: any[]
}) {
  const [isOpen, setIsOpen] = useState(false)
  const hasActivity = activities.length > 0

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
        {hasActivity ? (
          <span className="absolute top-1 right-1 size-2 rounded-full border-2 border-background bg-primary" />
        ) : null}
      </Button>

      {isOpen ? (
        <InboxSidebar
          onClose={() => setIsOpen(false)}
          boardId={boardId}
          userRole={userRole}
          currentUserId={currentUserId}
          allUsers={allUsers}
          chatGroups={chatGroups}
          activities={activities}
        />
      ) : null}
    </>
  )
}
