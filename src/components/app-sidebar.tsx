"use client"

import * as React from "react"
import Link from "next/link"
import {
  Calendar,
  LayoutGrid,
} from "lucide-react"
import { NavChat } from "@/components/nav-chat"
import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import { ZubeeIcon } from "@/components/zubee-icon"
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

type AppSidebarProps = React.ComponentProps<typeof Sidebar> & {
  user?: {
    email: string
    name?: string | null
    avatarUrl?: string | null
    color?: string | null
    isSuperAdmin?: boolean
  }
}

export function AppSidebar({ user, ...props }: AppSidebarProps) {
  const resolvedUser = user ?? {
    email: "demo@zubee.app",
    name: "Demo",
    avatarUrl: null,
    color: null,
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
              <div className="flex size-8 items-center justify-center rounded-lg bg-lime-500 text-white">
                <ZubeeIcon className="size-5" />
              </div>
              <span className="text-base font-semibold">Zubee</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
        <NavChat />
      </SidebarContent>
      <SidebarFooter>
        <NavUser
          user={{
            name: displayName,
            email: resolvedUser.email,
            avatar: resolvedUser.avatarUrl ?? "",
            color: resolvedUser.color,
            isSuperAdmin: resolvedUser.isSuperAdmin,
          }}
        />
      </SidebarFooter>
    </Sidebar>
  )
}
