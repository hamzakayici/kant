"use client"

import * as React from "react"
import Link from "next/link"
import {
  Calendar,
  CircleHelp,
  LayoutGrid,
  Send,
  Settings2,
} from "lucide-react"
import { NavChat } from "@/components/nav-chat"
import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const navMain = [
  {
    title: "Projeler",
    url: "/",
    icon: <LayoutGrid className="size-4" />,
  },
  {
    title: "Planlayıcı",
    url: "/planner",
    icon: <Calendar className="size-4" />,
  },
]

const navSecondary = [
  {
    title: "Roller ve Yetkiler",
    url: "/settings/roles",
    icon: <Settings2 className="size-4" />,
  },
  {
    title: "Telegram",
    url: "/settings/telegram",
    icon: <Send className="size-4" />,
  },
  {
    title: "Yardım",
    url: "#",
    icon: <CircleHelp className="size-4" />,
  },
]

type AppSidebarProps = React.ComponentProps<typeof Sidebar> & {
  user?: {
    email: string
    name?: string | null
    avatarUrl?: string | null
  }
}

export function AppSidebar({ user, ...props }: AppSidebarProps) {
  const resolvedUser = user ?? {
    email: "demo@kant.app",
    name: "Demo",
    avatarUrl: null,
  }
  const displayName =
    resolvedUser.name?.trim() ||
    resolvedUser.email.split("@")[0] ||
    "Kullanıcı"

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              className="data-[slot=sidebar-menu-button]:p-1.5!"
              render={<Link href="/" />}
            >
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <span className="text-sm font-bold">K</span>
              </div>
              <span className="text-base font-semibold">Kant</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
        <NavChat />
        <NavSecondary items={navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser
          user={{
            name: displayName,
            email: resolvedUser.email,
            avatar: resolvedUser.avatarUrl ?? "",
          }}
        />
      </SidebarFooter>
    </Sidebar>
  )
}
