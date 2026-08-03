import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import ChatPageClient from "@/components/chat/ChatPageClient"
import {
  getUserChatGroups,
  getUserBoardsForChat,
} from "@/app/actions/chatActions"
import { isTelegramEnabled } from "@/lib/telegram/config"
import { getTelegramDefaultChatGroupId } from "@/lib/telegram/settings"
import { isMtprotoConfigured } from "@/lib/telegram/mtproto"

type ChatPageProps = {
  searchParams: Promise<{ group?: string; message?: string }>
}

export default async function ChatPage({ searchParams }: ChatPageProps) {
  const { group: initialGroupId, message: initialMessageId } = await searchParams
  const session = await auth()

  if (!session) {
    redirect("/login")
  }

  const telegramEnabled = isTelegramEnabled()
  const [chatGroups, boards, dbUser, allUsers, defaultGroupId] =
    await Promise.all([
    getUserChatGroups(),
    getUserBoardsForChat(),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { telegramUserId: true, telegramMtprotoSession: true },
    }),
    prisma.user.findMany({
      where: { isActive: true },
      select: { id: true, email: true, firstName: true, lastName: true, role: true, color: true },
    }),
    telegramEnabled ? getTelegramDefaultChatGroupId() : Promise.resolve(null),
  ])

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
      <ChatPageClient
      chatGroups={chatGroups}
      boards={boards}
      currentUserId={session.user.id}
      allUsers={allUsers}
      telegramLinked={Boolean(dbUser?.telegramUserId)}
      telegramEnabled={telegramEnabled}
      mtprotoConfigured={isMtprotoConfigured()}
      mtprotoLinked={Boolean(dbUser?.telegramMtprotoSession)}
      initialGroupId={initialGroupId ?? defaultGroupId}
      initialMessageId={initialMessageId ?? null}
    />
    </div>
  )
}
