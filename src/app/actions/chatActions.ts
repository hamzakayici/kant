"use server"

import { auth } from "@/auth"
import { chatMessageInclude } from "@/lib/chat-message-include"
import { prisma } from "@/lib/prisma"
import { isTelegramEnabled } from "@/lib/telegram/config"
import { isPlaceholderTopicName } from "@/lib/telegram/sync"
import { extractMentionedUserIds } from "@/lib/chat-mentions"
import { cardShareInclude } from "@/lib/card-share"
import { getUserDisplayName } from "@/lib/user"
import { sortChatGroupsByActivity } from "@/lib/chat-unread"
import type { EnrichedChatGroup } from "@/lib/chat-types"
import { Prisma } from "@/generated/prisma/client/client"
import { revalidatePath } from "next/cache"

type ChatGroupBase = {
  id: string
  name: string
  boardId: string
  telegramTopicId: number | null
  updatedAt: Date
  createdAt: Date
  board: { id: string; name: string; identifier: string }
  members: Array<{
    userId: string
    lastReadAt: Date | null
    user: {
      id: string
      email: string
      firstName: string | null
      lastName: string | null
    }
  }>
}

async function enrichChatGroupsBatch(
  groups: ChatGroupBase[],
  userId: string,
): Promise<EnrichedChatGroup[]> {
  if (groups.length === 0) return []

  const groupIds = groups.map((group) => group.id)

  const lastMessageRows = await prisma.$queryRaw<
    Array<{ id: string; chatGroupId: string }>
  >`
    SELECT DISTINCT ON (m."chatGroupId") m.id, m."chatGroupId"
    FROM "ChatMessage" m
    WHERE m."chatGroupId" IN (${Prisma.join(groupIds)})
      AND m."deletedAt" IS NULL
    ORDER BY m."chatGroupId", m."createdAt" DESC
  `

  const lastMessageIds = lastMessageRows.map((row) => row.id)
  const lastMessages = lastMessageIds.length
    ? await prisma.chatMessage.findMany({
        where: { id: { in: lastMessageIds } },
        include: chatMessageInclude,
      })
    : []

  const lastMessageByGroup = new Map(
    lastMessages.map((message) => [message.chatGroupId, message]),
  )

  const unreadRows = await prisma.$queryRaw<
    Array<{ chatGroupId: string; count: bigint }>
  >`
    SELECT m."chatGroupId", COUNT(*)::bigint AS count
    FROM "ChatMessage" m
    LEFT JOIN "ChatGroupMember" cgm
      ON cgm."chatGroupId" = m."chatGroupId" AND cgm."userId" = ${userId}
    WHERE m."chatGroupId" IN (${Prisma.join(groupIds)})
      AND m."deletedAt" IS NULL
      AND m."authorId" != ${userId}
      AND (
        cgm."lastReadAt" IS NULL
        OR m."createdAt" > cgm."lastReadAt"
      )
    GROUP BY m."chatGroupId"
  `

  const unreadByGroup = new Map(
    unreadRows.map((row) => [row.chatGroupId, Number(row.count)]),
  )

  return groups.map((group) => {
    const lastMessage = lastMessageByGroup.get(group.id) ?? null
    return {
      ...group,
      lastMessage,
      unreadCount: unreadByGroup.get(group.id) ?? 0,
      messages: lastMessage ? [lastMessage] : [],
    }
  })
}

export async function getUserChatGroups(): Promise<EnrichedChatGroup[]> {
  const session = await auth()
  if (!session) throw new Error("Yetkisiz")

  const isAdmin = session.user.role === "ADMIN"
  const telegramEnabled = isTelegramEnabled()

  const groups = await prisma.chatGroup.findMany({
    where: {
      ...(telegramEnabled ? { telegramTopicId: { not: null } } : {}),
      ...(isAdmin
        ? {}
        : { members: { some: { userId: session.user.id } } }),
    },
    include: {
      board: { select: { id: true, name: true, identifier: true } },
      members: {
        include: {
          user: {
            select: { id: true, email: true, firstName: true, lastName: true },
          },
        },
      },
    },
  })

  const visible = telegramEnabled
    ? groups.filter(
        (group) =>
          group.telegramTopicId == null ||
          !isPlaceholderTopicName(group.name, group.telegramTopicId),
      )
    : groups

  const enriched = await enrichChatGroupsBatch(visible, session.user.id)

  return sortChatGroupsByActivity(enriched)
}

export async function markChatGroupAsRead(chatGroupId: string) {
  const session = await auth()
  if (!session) throw new Error("Yetkisiz")

  const group = await prisma.chatGroup.findUnique({
    where: { id: chatGroupId },
    select: { id: true },
  })

  if (!group) {
    throw new Error("Sohbet konusu bulunamadı")
  }

  if (session.user.role !== "ADMIN") {
    const membership = await prisma.chatGroupMember.findUnique({
      where: {
        chatGroupId_userId: {
          chatGroupId,
          userId: session.user.id,
        },
      },
    })

    if (!membership) {
      throw new Error("Bu sohbet grubuna erişim yetkiniz yok")
    }
  }

  await prisma.chatGroupMember.upsert({
    where: {
      chatGroupId_userId: {
        chatGroupId,
        userId: session.user.id,
      },
    },
    create: {
      chatGroupId,
      userId: session.user.id,
      lastReadAt: new Date(),
    },
    update: {
      lastReadAt: new Date(),
    },
  })
}

export async function getUserBoardsForChat() {
  const session = await auth()
  if (!session) throw new Error("Yetkisiz")

  const memberships = await prisma.boardMember.findMany({
    where: { userId: session.user.id },
    include: {
      board: { select: { id: true, name: true, identifier: true } },
    },
    orderBy: { board: { order: "asc" } },
  })

  if (session.user.role === "ADMIN") {
    const allBoards = await prisma.board.findMany({
      select: { id: true, name: true, identifier: true },
      orderBy: { order: "asc" },
    })
    return allBoards
  }

  return memberships.map((m) => m.board)
}

async function assertCanAccessCard(userId: string, role: string, cardId: string) {
  const card = await prisma.card.findUnique({
    where: { id: cardId },
    select: {
      column: { select: { boardId: true } },
    },
  })

  if (!card) {
    throw new Error("Kart bulunamadı")
  }

  if (role === "ADMIN") return card.column.boardId

  const membership = await prisma.boardMember.findUnique({
    where: {
      userId_boardId: {
        userId,
        boardId: card.column.boardId,
      },
    },
  })

  if (!membership) {
    throw new Error("Bu karta erişim yetkiniz yok")
  }

  return card.column.boardId
}

export async function shareCardToChat(
  cardId: string,
  chatGroupId: string,
  note?: string,
) {
  const session = await auth()
  if (!session) throw new Error("Yetkisiz")

  await assertCanAccessCard(session.user.id, session.user.role, cardId)

  const card = await prisma.card.findUnique({
    where: { id: cardId },
    include: cardShareInclude,
  })

  if (!card) {
    throw new Error("Kart bulunamadı")
  }

  const membership = await prisma.chatGroupMember.findUnique({
    where: {
      chatGroupId_userId: {
        chatGroupId,
        userId: session.user.id,
      },
    },
  })

  if (!membership && session.user.role !== "ADMIN") {
    throw new Error("Bu sohbet grubuna mesaj gönderme yetkiniz yok")
  }

  const trimmedNote = note?.trim() ?? ""

  const { createChatMessageWithTelegram } = await import("@/lib/telegram/sync")
  const { isTelegramEnabled: telegramOn } = await import("@/lib/telegram/config")
  const { resolveTelegramOutboundSender, TelegramSenderNotReadyError } =
    await import("@/lib/telegram/outbound-sender")

  if (telegramOn()) {
    const group = await prisma.chatGroup.findUnique({
      where: { id: chatGroupId },
      select: { telegramTopicId: true },
    })
    if (group?.telegramTopicId) {
      try {
        await resolveTelegramOutboundSender(session.user.id)
      } catch (error) {
        if (error instanceof TelegramSenderNotReadyError) {
          throw new Error(error.message)
        }
        throw error
      }
    }
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { firstName: true, lastName: true, email: true },
  })

  await createChatMessageWithTelegram({
    chatGroupId,
    authorId: session.user.id,
    content: trimmedNote,
    cardId,
    source: "web",
    authorEmail: getUserDisplayName(dbUser ?? session.user),
    pushToTelegram: true,
    mentionedUserIds: extractMentionedUserIds(trimmedNote),
  })

  revalidatePath("/")
  revalidatePath("/chat")
  revalidatePath(`/b/${card.column.board.id}`)
}
