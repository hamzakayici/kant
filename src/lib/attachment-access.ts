import { prisma } from "@/lib/prisma"

export async function canUserAccessAttachment(
  userId: string,
  role: string,
  attachment: {
    cardId: string | null
    chatMessage?: {
      chatGroupId: string
      chatGroup?: {
        members: Array<{ userId: string }>
      }
    } | null
    card?: {
      column: {
        board: {
          members: Array<{ userId: string }>
        }
      }
    } | null
  },
): Promise<boolean> {
  if (role === "ADMIN") return true

  if (attachment.chatMessage) {
    const members =
      attachment.chatMessage.chatGroup?.members ??
      (
        await prisma.chatGroupMember.findMany({
          where: { chatGroupId: attachment.chatMessage.chatGroupId },
          select: { userId: true },
        })
      ).map((member) => ({ userId: member.userId }))

    return members.some((member) => member.userId === userId)
  }

  if (attachment.card) {
    return attachment.card.column.board.members.some(
      (member) => member.userId === userId,
    )
  }

  return false
}
