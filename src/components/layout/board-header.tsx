"use client"

import Link from "next/link"
import {
  Briefcase,
  CalendarDays,
  ChevronLeft,
  Folder,
  Layout,
  LayoutGrid,

  Rocket,
  Star,
  Target,
  Activity,
  Heart,
  Compass,
  Map,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { SidebarTrigger } from "@/components/ui/sidebar"
import BoardMembersPopover from "@/components/BoardMembersPopover"
import { cn } from "@/lib/utils"
import { resolveBoardIconId } from "@/lib/board-icons"

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Folder,
  Briefcase,
  Layout,
  Activity,
  Star,
  Heart,
  Target,
  Compass,
  Rocket,
  Map,
}

const tabs = [
  { id: "kanban", label: "Pano", icon: LayoutGrid },
  { id: "timeline", label: "Zaman Çizelgesi", icon: CalendarDays },
] as const

type BoardMember = {
  user: { id: string; email: string; firstName?: string | null; lastName?: string | null; color?: string | null }
}

type BoardUser = {
  id: string
  email: string
  firstName?: string | null
  lastName?: string | null
  color?: string | null
}

type BoardHeaderProps = {
  boardId: string
  boardName: string
  boardIdentifier: string
  boardIcon?: string | null
  boardDescription?: string | null
  view: string
  cardCount: number
  memberCount: number
  members: BoardMember[]
  allUsers?: BoardUser[]
  canManageMembers?: boolean
  filterSlot?: React.ReactNode
  toolbarSlot?: React.ReactNode
}

export function BoardHeader({
  boardId,
  boardName,
  boardIdentifier,
  boardIcon,
  view,
  cardCount,
  memberCount,
  members,
  allUsers = [],
  canManageMembers = false,
  filterSlot,
  toolbarSlot,
}: BoardHeaderProps) {
  const IconComponent =
    ICONS[resolveBoardIconId(boardIcon)] || Folder

  return (
    <header className="shrink-0 border-b border-border bg-background">
      <div className="flex flex-col gap-2 px-3 py-2 md:px-4">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <div className="flex min-w-0 items-center gap-2">
            <SidebarTrigger className="-ml-1 hidden size-7 md:flex" />
            <Link
              href="/"
              className="hidden items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground sm:inline-flex"
              title="Projelere dön"
            >
              <ChevronLeft className="size-3.5" />
              Projeler
            </Link>
            <div className="hidden h-3.5 w-px bg-border sm:block" />
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <IconComponent className="size-4" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                <h1 className="truncate text-base font-semibold tracking-tight text-foreground md:text-lg">
                  {boardName}
                </h1>
                <Badge
                  variant="outline"
                  className="px-1.5 py-0 font-mono text-[10px]"
                >
                  {boardIdentifier}
                </Badge>
                <span className="text-[11px] text-muted-foreground">
                  {cardCount} görev · {memberCount} üye
                </span>
              </div>
            </div>
          </div>

          <div className="ml-auto flex flex-wrap items-center justify-end gap-1.5">
            {toolbarSlot}
            <BoardMembersPopover
              boardId={boardId}
              members={members}
              allUsers={allUsers}
              canManageMembers={canManageMembers}
            />

          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="inline-flex items-center gap-0.5 rounded-lg border border-border bg-muted/30 p-0.5">
            {tabs.map((tab) => {
              const TabIcon = tab.icon
              const isActive = view === tab.id
              return (
                <Link
                  key={tab.id}
                  href={`/b/${boardId}?view=${tab.id}`}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-all",
                    isActive
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <TabIcon className="size-3.5" />
                  {tab.label}
                </Link>
              )
            })}
          </div>

          {filterSlot ? <div className="shrink-0">{filterSlot}</div> : null}
        </div>
      </div>
    </header>
  )
}
