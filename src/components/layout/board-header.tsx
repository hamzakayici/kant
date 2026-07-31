"use client"

import Link from "next/link"
import {
  Briefcase,
  CalendarDays,
  Folder,
  Layout,
  LayoutGrid,
  Settings2,
  Rocket,
  Star,
  Target,
  Activity,
  Heart,
  Compass,
  Map,
} from "lucide-react"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { getUserDisplayName, getUserInitial } from "@/lib/user"
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
  user: { id: string; email: string }
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
  filterSlot?: React.ReactNode
  toolbarSlot?: React.ReactNode
}

export function BoardHeader({
  boardId,
  boardName,
  boardIdentifier,
  boardIcon,
  boardDescription,
  view,
  cardCount,
  memberCount,
  members,
  filterSlot,
  toolbarSlot,
}: BoardHeaderProps) {
  const IconComponent =
    ICONS[resolveBoardIconId(boardIcon)] || Folder

  return (
    <header className="shrink-0 border-b border-border bg-background">
      <div className="flex flex-col gap-4 px-4 py-4 md:px-6 md:py-5">
        {/* Breadcrumb + toolbar */}
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-2">
            <SidebarTrigger className="-ml-1 hidden md:flex" />
            <Separator
              orientation="vertical"
              className="hidden h-4 md:block data-vertical:self-auto"
            />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink render={<Link href="/" />}>
                    Projeler
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage className="max-w-[200px] truncate sm:max-w-none">
                    {boardName}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          {toolbarSlot ? (
            <div className="flex flex-wrap items-center gap-2">
              {toolbarSlot}
            </div>
          ) : null}
        </div>

        {/* Title row */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-sm ring-1 ring-primary/10">
              <IconComponent className="size-6" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="truncate font-heading text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
                  {boardName}
                </h1>
                <Badge variant="outline" className="font-mono text-[11px]">
                  {boardIdentifier}
                </Badge>
              </div>
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                {boardDescription || "Proje görevlerini yönetin"}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span>{cardCount} görev</span>
                <span>·</span>
                <span>{memberCount} üye</span>
              </div>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <div className="flex -space-x-2">
              {members.slice(0, 4).map((member, index) => (
                <Avatar
                  key={member.user.id}
                  className="size-8 border-2 border-background"
                  style={{ zIndex: 10 - index }}
                  title={getUserDisplayName(member.user)}
                >
                  <AvatarFallback className="bg-primary/15 text-[10px] font-bold text-primary">
                    {getUserInitial(member.user)}
                  </AvatarFallback>
                </Avatar>
              ))}
              {members.length > 4 ? (
                <div className="flex size-8 items-center justify-center rounded-full border-2 border-background bg-muted text-[10px] font-semibold text-muted-foreground">
                  +{members.length - 4}
                </div>
              ) : null}
            </div>

            <Button
              variant="outline"
              size="icon-sm"
              render={<Link href={`/b/${boardId}/settings`} title="Pano ayarları" />}
            >
              <Settings2 className="size-4" />
            </Button>
          </div>
        </div>

        {/* Tabs + filter */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="inline-flex w-fit items-center gap-1 rounded-xl border border-border bg-muted/30 p-1">
            {tabs.map((tab) => {
              const TabIcon = tab.icon
              const isActive = view === tab.id
              return (
                <Link
                  key={tab.id}
                  href={`/b/${boardId}?view=${tab.id}`}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all",
                    isActive
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <TabIcon className="size-4" />
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
