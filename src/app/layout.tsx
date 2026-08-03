import type { Metadata } from "next"
import { Montserrat, Raleway } from "next/font/google"
import "./globals.css"
import { auth } from "@/auth"
import { DashboardShell } from "@/components/layout/dashboard-shell"
import { ModalProvider } from "@/components/providers/ModalProvider"
import { TooltipProvider } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { prisma } from "@/lib/prisma"
import { getUserChatGroups, getUserBoardsForChat } from "@/app/actions/chatActions"
import { getUserDisplayName } from "@/lib/user"
import { isTelegramEnabled } from "@/lib/telegram/config"

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-sans",
})

const ralewayHeading = Raleway({
  subsets: ["latin"],
  variable: "--font-heading",
})

export const metadata: Metadata = {
  title: "Kant Kanban",
  description: "Gelişmiş Kanban panosu",
}

export const viewport = {
  colorScheme: "dark",
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const session = await auth()

  const shellUser = session
    ? await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
          color: true,
          telegramUserId: true,
        },
      })
    : null

  const chatGroups = session ? await getUserChatGroups() : []
  const boards = session ? await getUserBoardsForChat() : []
  const allUsers = session
    ? await prisma.user.findMany({
        where: { isActive: true },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          color: true,
        },
      })
    : []

  return (
    <html
      lang="tr"
      className={cn(
        "dark h-full antialiased",
        montserrat.variable,
        ralewayHeading.variable,
      )}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans">
        <TooltipProvider>
          <ModalProvider>
            {session && shellUser ? (
              <DashboardShell
                user={{
                  email: shellUser.email,
                  name: getUserDisplayName(shellUser),
                  avatarUrl: shellUser.avatarUrl,
                  color: shellUser.color,
                }}
                currentUserId={shellUser.id}
                chatGroups={chatGroups}
                boards={boards}
                allUsers={allUsers}
                telegramLinked={Boolean(shellUser.telegramUserId)}
                telegramEnabled={isTelegramEnabled()}
              >
                {children}
              </DashboardShell>
            ) : (
              children
            )}
          </ModalProvider>
        </TooltipProvider>
      </body>
    </html>
  )
}
