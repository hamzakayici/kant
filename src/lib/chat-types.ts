import type { chatMessageInclude } from "@/lib/chat-message-include"
import type { Prisma } from "@/generated/prisma/client/client"

export type ChatMessageWithRelations = Prisma.ChatMessageGetPayload<{
  include: typeof chatMessageInclude
}>

export type ChatGroupBoard = {
  id: string
  name: string
  identifier: string
}

export type ChatGroupMemberWithUser = {
  userId: string
  lastReadAt: Date | null
  user: {
    id: string
    email: string
    firstName: string | null
    lastName: string | null
  }
}

export type EnrichedChatGroup = {
  id: string
  name: string
  boardId: string
  telegramTopicId: number | null
  updatedAt: Date
  createdAt: Date
  board: ChatGroupBoard
  members: ChatGroupMemberWithUser[]
  lastMessage: ChatMessageWithRelations | null
  unreadCount: number
  messages: ChatMessageWithRelations[]
}

export type ChatMessagePreviewInput = {
  content?: string | null
  authorId?: string
  createdAt?: string | Date
  card?: {
    title: string
    sequenceId: number
    column?: { board?: { identifier?: string } }
  } | null
  attachments?: Array<{ filename: string; mimeType?: string }>
}
