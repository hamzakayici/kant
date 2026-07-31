"use client"

import { X } from "lucide-react"
import { InboxActivityPane } from "@/components/inbox/InboxActivityPane"

type InboxSidebarProps = {
  onClose: () => void
  activities?: any[]
}

export default function InboxSidebar({
  onClose,
  activities = [],
}: InboxSidebarProps) {
  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="fixed top-0 right-0 bottom-0 z-50 flex w-full flex-col border-l border-border bg-card shadow-2xl sm:w-[380px] md:w-[420px]">
        <div className="flex shrink-0 items-center justify-between border-b border-border px-5 py-4">
          <div>
            <h2 className="text-lg font-bold text-foreground">Aktivite</h2>
            <p className="text-xs text-muted-foreground">
              Bu projedeki son hareketler
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            aria-label="Kapat"
          >
            <X className="size-5" />
          </button>
        </div>

        <InboxActivityPane activities={activities} />
      </div>
    </>
  )
}
