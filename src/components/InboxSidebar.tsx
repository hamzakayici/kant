"use client"

import { useState } from "react"
import { Activity, MessageSquare, X } from "lucide-react"
import { InboxActivityPane } from "@/components/inbox/InboxActivityPane"
import { InboxChatPane } from "@/components/inbox/InboxChatPane"
import type { EnrichedChatGroup } from "@/lib/chat-types"
import { cn } from "@/lib/utils"

type InboxSidebarProps = {
  onClose: () => void
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
}

export default function InboxSidebar({
  onClose,
  boardId,
  currentUserId,
  allUsers = [],
  chatGroups = [],
  activities = [],
  telegramEnabled = false,
}: InboxSidebarProps) {
  const [activeTab, setActiveTab] = useState<"aktivite" | "sohbet">("aktivite")

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="fixed top-0 right-0 bottom-0 z-50 flex w-full flex-col border-l border-border bg-card shadow-2xl sm:w-[420px] md:w-[480px] lg:w-[540px]">
        <div className="flex shrink-0 items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-lg font-bold text-foreground">Gelen Kutusu</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            aria-label="Kapat"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="flex shrink-0 border-b border-border px-5">
          <button
            type="button"
            onClick={() => setActiveTab("aktivite")}
            className={cn(
              "flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors",
              activeTab === "aktivite"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            <Activity className="size-4" />
            Aktivite
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("sohbet")}
            className={cn(
              "flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors",
              activeTab === "sohbet"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            <MessageSquare className="size-4" />
            Sohbet
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {activeTab === "aktivite" ? (
            <InboxActivityPane activities={activities} />
          ) : (
            <InboxChatPane
              boardId={boardId}
              currentUserId={currentUserId}
              initialGroups={chatGroups}
              allUsers={allUsers}
              telegramEnabled={telegramEnabled}
            />
          )}
        </div>
      </div>
    </>
  )
}
