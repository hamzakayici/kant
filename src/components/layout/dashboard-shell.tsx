"use client"

import { AppSidebar } from "@/components/app-sidebar"
import { GlobalChat } from "@/components/layout/global-chat"
import { ChatProvider } from "@/components/providers/ChatProvider"
import { CardModalProvider } from "@/components/providers/CardModalProvider"
import { ChatNotifications } from "@/components/chat/TelegramChatNotifications"
import { ConnectionStatusBanner } from "@/components/layout/ConnectionStatusBanner"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"

type DashboardShellProps = {
  user: {
    email: string
    name?: string | null
    avatarUrl?: string | null
  }
  currentUserId: string
  chatGroups: any[]
  boards: { id: string; name: string; identifier: string }[]
  allUsers: {
    id: string
    email: string
    firstName?: string | null
    lastName?: string | null
    role?: string
  }[]
  telegramLinked: boolean
  telegramEnabled: boolean
  children: React.ReactNode
}

export function DashboardShell({
  user,
  currentUserId,
  chatGroups,
  boards,
  allUsers,
  telegramLinked,
  telegramEnabled,
  children,
}: DashboardShellProps) {
  return (
    <CardModalProvider>
      <ChatProvider>
      <SidebarProvider
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 72)",
            "--header-height": "calc(var(--spacing) * 12)",
          } as React.CSSProperties
        }
      >
        <AppSidebar variant="inset" user={user} />
        <SidebarInset className="flex h-svh max-h-svh flex-col overflow-hidden">
          <ConnectionStatusBanner />
          <div className="flex h-12 shrink-0 items-center gap-2 border-b px-4 md:hidden">
            <SidebarTrigger className="-ml-1" />
            <span className="font-heading text-sm font-semibold">Kant</span>
          </div>
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            {children}
          </div>
        </SidebarInset>
        <GlobalChat
          currentUserId={currentUserId}
          chatGroups={chatGroups}
          boards={boards}
          allUsers={allUsers}
          telegramLinked={telegramLinked}
          telegramEnabled={telegramEnabled}
        />
        <ChatNotifications currentUserId={currentUserId} />
      </SidebarProvider>
    </ChatProvider>
    </CardModalProvider>
  )
}
