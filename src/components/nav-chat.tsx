"use client"

import Link from "next/link"
import { useMemo } from "react"
import { usePathname } from "next/navigation"
import { MessageSquare } from "lucide-react"
import { ChatUnreadBadge } from "@/components/chat/ChatUnreadBadge"
import { useChatGroupsLive } from "@/hooks/useChatGroupsLive"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export function NavChat() {
  const pathname = usePathname()
  const isActive = pathname === "/chat" || pathname.startsWith("/chat/")
  const { chatGroups } = useChatGroupsLive()
  const totalUnread = useMemo(
    () =>
      chatGroups.reduce((sum, group) => sum + (group.unreadCount ?? 0), 0),
    [chatGroups],
  )

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Sohbet</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Sohbet"
              isActive={isActive}
              render={<Link href="/chat" />}
            >
              <MessageSquare className="size-4" />
              <span className="min-w-0 flex-1">Mesajlar</span>
              <ChatUnreadBadge count={totalUnread} />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
