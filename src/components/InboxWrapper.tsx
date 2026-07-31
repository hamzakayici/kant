"use client"

import { useState } from "react"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import InboxSidebar from "./InboxSidebar"

export default function InboxWrapper({
  activities = [],
}: {
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
        title="Aktivite"
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
          activities={activities}
        />
      ) : null}
    </>
  )
}
