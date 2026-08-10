"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import { getUserPermissions, hasPermission, canCreateBoard, canAssignAssignees } from "@/lib/permissions"
import { deleteStoredFile, ensureBoardOpenCloudStructure, getAttachmentCopyUrl, getAttachmentOpenCloudUrl } from "@/lib/storage"
import { isOpenCloudEnabled, getOpenCloudConfig } from "@/lib/storage/config"
import {
  getAttachmentUrl,
  isKantShareOrProxyUrl,
  isOpenCloudHttpUrl,
} from "@/lib/attachment-url"
import { extractMentionedUserIds, normalizeMentionsInContent, stripMentionTokens } from "@/lib/chat-mentions"
import { getUserDisplayName } from "@/lib/user"
import { cardModalInclude } from "@/lib/card-modal-data"
import {
  buildMovedCardIds,
  persistColumnCardOrder,
} from "@/lib/card-order"

export async function createCard(title: string, columnId: string, boardId: string) {
  const session = await auth()
  if (!session) throw new Error("Yetkisiz işlem")
  
  const perms = await getUserPermissions(session.user.id)
  if (!hasPermission(perms, "CREATE_CARD")) {
    throw new Error("Yetkisiz işlem")
  }

  // Mevcut tüm kartların order değerini 1 artırarak en üstü (0. sırayı) boşalt
  await prisma.card.updateMany({
    where: { columnId },
    data: { order: { increment: 1 } }
  })

  const updatedBoard = await prisma.board.update({
    where: { id: boardId },
    data: { sequenceCounter: { increment: 1 } }
  })
  
  const currentSeq = updatedBoard.sequenceCounter - 1;

  const card = await prisma.card.create({
    data: {
      title,
      columnId,
      sequenceId: currentSeq,
      order: 0, // Yeni kart artık her zaman en üstte
      creatorId: session.user.id
    },
    include: {
      assignees: true,
      creator: true,
      attachments: { orderBy: { createdAt: "desc" } },
      comments: {
        include: { author: true },
        orderBy: { createdAt: "desc" },
      },
      checklists: { orderBy: { createdAt: "asc" } },
    },
  })

  await prisma.activityLog.create({
    data: {
      action: "Kartı oluşturdu",
      cardId: card.id,
      userId: session.user.id
    }
  })

  revalidatePath("/")
  revalidatePath(`/b/${boardId}`)

  return card
}

export async function moveCard(cardId: string, newColumnId: string, newOrder: number) {
  const session = await auth()
  if (!session) throw new Error("Yetkisiz")

  const perms = await getUserPermissions(session.user.id)
  if (!hasPermission(perms, "MOVE_CARD")) {
    throw new Error("Kart taşıma yetkiniz bulunmuyor.")
  }

  const oldCard = await prisma.card.findUnique({
    where: { id: cardId },
    include: { column: true }
  })
  if (!oldCard) throw new Error("Kart bulunamadı")

  const newColumn = await prisma.column.findUnique({
    where: { id: newColumnId }
  })
  if (!newColumn) throw new Error("Sütun bulunamadı")

  const dbUser = await prisma.user.findUnique({ where: { id: session.user.id } })
  let currentRole = "system_requester"
  if (dbUser?.customRoleId) {
    currentRole = dbUser.customRoleId
  } else if (dbUser?.role) {
    if (dbUser.role === "ADMIN") currentRole = "system_admin"
    else if (dbUser.role === "EDITOR") currentRole = "system_editor"
    else if (dbUser.role === "DESIGNER") currentRole = "system_designer"
  }

  // Check dragOutRoles on the old column
  if (oldCard.column.dragOutRoles && oldCard.column.dragOutRoles.length > 0) {
    if (!oldCard.column.dragOutRoles.includes(currentRole) && currentRole !== "system_admin") {
      throw new Error("Bu sütundan kart çıkarma (taşıma) yetkiniz bulunmuyor.")
    }
  }

  // Backend checks for RBAC (Drag In)
  if (newColumn.allowedRoles && newColumn.allowedRoles.length > 0) {
    if (!newColumn.allowedRoles.includes(currentRole) && currentRole !== "system_admin") {
      throw new Error("Bu sütuna kart taşıma yetkiniz bulunmuyor.")
    }
  }

  const sourceColumnId = oldCard.columnId
  const isSameColumn = sourceColumnId === newColumnId

  await prisma.$transaction(async (tx) => {
    const [sourceCards, targetCards] = await Promise.all([
      tx.card.findMany({
        where: { columnId: sourceColumnId },
        orderBy: [{ order: "asc" }, { createdAt: "asc" }],
        select: { id: true },
      }),
      isSameColumn
        ? Promise.resolve(null)
        : tx.card.findMany({
            where: { columnId: newColumnId },
            orderBy: [{ order: "asc" }, { createdAt: "asc" }],
            select: { id: true },
          }),
    ])

    const sourceIds = sourceCards.map((card) => card.id)

    if (isSameColumn) {
      const nextIds = buildMovedCardIds(sourceIds, cardId, newOrder)
      await persistColumnCardOrder(tx, newColumnId, nextIds)
      return
    }

    const nextSourceIds = sourceIds.filter((id) => id !== cardId)
    const targetIds = (targetCards ?? []).map((card) => card.id)
    const insertAt = Math.max(0, Math.min(newOrder, targetIds.length))
    targetIds.splice(insertAt, 0, cardId)

    await persistColumnCardOrder(tx, sourceColumnId, nextSourceIds)
    await persistColumnCardOrder(tx, newColumnId, targetIds)
  })

  if (oldCard.columnId !== newColumnId) {
    await prisma.activityLog.create({
      data: {
        action: `Kartı "${oldCard.column.name}" sütunundan "${newColumn.name}" sütununa taşıdı`,
        cardId,
        userId: session.user.id
      }
    })
  }

  revalidatePath("/")
}

export async function deleteCard(cardId: string) {
  const session = await auth()
  if (!session) throw new Error("Yetkisiz işlem")

  const perms = await getUserPermissions(session.user.id)
  if (!hasPermission(perms, "DELETE_CARD")) {
    throw new Error("Yetkisiz işlem")
  }

  await prisma.card.delete({
    where: { id: cardId }
  })

  revalidatePath("/")
}

export async function addComment(cardId: string, content: string) {
  const session = await auth()
  if (!session) throw new Error("Yetkisiz")

  await prisma.comment.create({
    data: {
      content,
      cardId,
      authorId: session.user.id
    }
  })

  revalidatePath("/")
}

export async function updateCardTitle(cardId: string, title: string) {
  const session = await auth()
  if (!session) throw new Error("Yetkisiz")

  await prisma.card.update({
    where: { id: cardId },
    data: { title }
  })

  await prisma.activityLog.create({
    data: {
      action: "Başlığı güncelledi",
      cardId,
      userId: session.user.id
    }
  })

  revalidatePath("/")
}

export async function updateCardDescription(cardId: string, description: string) {
  const session = await auth()
  if (!session) throw new Error("Yetkisiz")

  await prisma.card.update({
    where: { id: cardId },
    data: { description }
  })
  
  // Coalesce history entries:
  // Find the most recent history entry for this card
  const lastHistory = await prisma.cardDescriptionHistory.findFirst({
    where: { cardId },
    orderBy: { createdAt: 'desc' }
  })

  // If the last entry was made by the same user within the last 5 minutes, update it.
  // Otherwise, create a new one.
  const FIVE_MINUTES = 5 * 60 * 1000
  if (lastHistory && lastHistory.userId === session.user.id && (Date.now() - new Date(lastHistory.createdAt).getTime() < FIVE_MINUTES)) {
    await prisma.cardDescriptionHistory.update({
      where: { id: lastHistory.id },
      data: { content: description }
    })
  } else {
    await prisma.cardDescriptionHistory.create({
      data: {
        content: description,
        cardId,
        userId: session.user.id
      }
    })

    // Only log activity if we are creating a new "session" of edits
    await prisma.activityLog.create({
      data: {
        action: "Açıklamayı güncelledi",
        cardId,
        userId: session.user.id
      }
    })
  }

  revalidatePath("/")
}

export async function getCardDescriptionHistory(cardId: string) {
  const session = await auth()
  if (!session) throw new Error("Yetkisiz")

  return await prisma.cardDescriptionHistory.findMany({
    where: { cardId },
    include: { user: true },
    orderBy: { createdAt: 'desc' }
  })
}

export async function getCardForModal(cardId: string) {
  const session = await auth()
  if (!session) throw new Error("Yetkisiz")

  const card = await prisma.card.findUnique({
    where: { id: cardId },
    include: cardModalInclude,
  })

  if (!card) {
    throw new Error("Kart bulunamadı")
  }

  const boardId = card.column.boardId

  const membership = await prisma.boardMember.findUnique({
    where: {
      userId_boardId: {
        userId: session.user.id,
        boardId,
      },
    },
  })

  if (session.user.role !== "ADMIN" && !membership) {
    throw new Error("Bu karta erişim yetkiniz yok")
  }

  const board = await prisma.board.findUnique({
    where: { id: boardId },
    include: {
      members: { include: { user: true } },
      columns: {
        orderBy: { order: "asc" },
        select: {
          id: true,
          name: true,
          order: true,
          category: true,
          color: true,
        },
      },
    },
  })

  if (!board) {
    throw new Error("Proje bulunamadı")
  }

  return {
    card,
    boardId: board.id,
    boardIdentifier: board.identifier,
    userRole: membership?.role ?? session.user.role,
    boardColumns: board.columns,
    boardMembers: board.members,
    canAssignAssignees: canAssignAssignees(
      await getUserPermissions(session.user.id),
    ),
  }
}

export async function updateCardDates(cardId: string, startDate: Date | null, dueDate: Date | null, reminderMinutes?: number | null, isRecurring?: boolean) {
  const session = await auth()
  if (!session) throw new Error("Yetkisiz")

  await prisma.card.update({
    where: { id: cardId },
    data: { 
      startDate, 
      dueDate,
      ...(reminderMinutes !== undefined && { reminderMinutes }),
      ...(isRecurring !== undefined && { isRecurring })
    }
  })

  await prisma.activityLog.create({
    data: {
      action: "Tarih ve hatırlatıcı ayarlarını güncelledi",
      cardId,
      userId: session.user.id
    }
  })

  revalidatePath("/")
}

export async function createProject(data: { name: string, identifier: string, description?: string, isPrivate: boolean, memberIds?: string[], startingNumber?: number, icon?: string }) {
  const session = await auth()
  if (!session) throw new Error("Yetkisiz")

  const perms = await getUserPermissions(session.user.id)
  if (!canCreateBoard(perms)) {
    throw new Error("Pano oluşturma yetkiniz yok")
  }

  const membersData = [
    { userId: session.user.id, role: "ADMIN" as any }
  ]

  if (data.memberIds && data.memberIds.length > 0) {
    data.memberIds.forEach(id => {
      if (id !== session.user.id) {
        membersData.push({ userId: id, role: "REQUESTER" as any })
      }
    })
  }

  const board = await prisma.board.create({
    data: {
      name: data.name,
      identifier: data.identifier,
      sequenceCounter: data.startingNumber || 1,
      description: data.description,
      isPrivate: data.isPrivate,
      icon: data.icon || 'Folder',
      members: {
        create: membersData
      },
      columns: {
        create: [
          { name: "Bekleyen", order: 0, category: "BACKLOG", color: "#e2e8f0" },
          { name: "Yapılacak", order: 1, category: "UNSTARTED", color: "#facc15" },
          { name: "Devam Ediyor", order: 2, category: "ACTIVE", color: "#60a5fa" },
          { name: "Tamamlandı", order: 3, category: "DONE STATUS / WON", color: "#4ade80" },
        ]
      }
    }
  })

  try {
    await ensureBoardOpenCloudStructure(board.id)
  } catch (error) {
    console.error("OpenCloud board folder creation failed:", error)
  }

  revalidatePath("/")
  return board.id
}

export async function updateColumn(columnId: string, data: { name?: string, color?: string, category?: string, order?: number }) {
  const session = await auth()
  if (!session) throw new Error("Yetkisiz")

  await prisma.column.update({
    where: { id: columnId },
    data
  })
  
  revalidatePath("/")
}

export async function updateColumnAllowedRoles(columnId: string, allowedRoles: string[], dragOutRoles: string[] = []) {
  const session = await auth()
  if (!session) throw new Error("Yetkisiz")
  const dbUser = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (dbUser?.role !== "ADMIN") throw new Error("Sadece yöneticiler yetki değiştirebilir")

  await prisma.column.update({
    where: { id: columnId },
    data: { allowedRoles, dragOutRoles }
  })
  revalidatePath("/")
}

export async function moveColumnPosition(columnId: string, direction: 'left' | 'right') {
  const session = await auth()
  if (!session) throw new Error("Yetkisiz")
  const dbUser = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (dbUser?.role !== "ADMIN") throw new Error("Sadece yöneticiler sütunları taşıyabilir")

  const col = await prisma.column.findUnique({ where: { id: columnId } })
  if (!col) throw new Error("Sütun bulunamadı")

  const allCols = await prisma.column.findMany({
    where: { boardId: col.boardId, category: col.category },
    orderBy: { order: 'asc' }
  })

  const currentIndex = allCols.findIndex(c => c.id === columnId)
  if (currentIndex === -1) return

  let targetIndex = direction === 'left' ? currentIndex - 1 : currentIndex + 1
  if (targetIndex < 0 || targetIndex >= allCols.length) return // Can't move further

  const targetCol = allCols[targetIndex]

  // Swap orders
  await prisma.$transaction([
    prisma.column.update({
      where: { id: col.id },
      data: { order: targetCol.order }
    }),
    prisma.column.update({
      where: { id: targetCol.id },
      data: { order: col.order }
    })
  ])

  revalidatePath("/")
}

export async function reorderColumns(boardId: string, columnIds: string[]) {
  const session = await auth()
  if (!session) throw new Error("Yetkisiz")

  const dbUser = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (dbUser?.role !== "ADMIN") {
    throw new Error("Sadece yöneticiler sütunları taşıyabilir")
  }

  const boardColumns = await prisma.column.findMany({
    where: { boardId },
    select: { id: true },
  })

  const validIds = new Set(boardColumns.map((c) => c.id))
  if (
    columnIds.length !== boardColumns.length ||
    columnIds.some((id) => !validIds.has(id))
  ) {
    throw new Error("Geçersiz sütun sıralaması")
  }

  await prisma.$transaction(
    columnIds.map((id, index) =>
      prisma.column.update({
        where: { id },
        data: { order: index },
      }),
    ),
  )

  revalidatePath("/")
}

export async function createColumn(boardId: string, name: string, category: string, color: string) {
  const session = await auth()
  if (!session) throw new Error("Yetkisiz")

  const count = await prisma.column.count({ where: { boardId } })

  const col = await prisma.column.create({
    data: {
      name,
      boardId,
      category,
      color,
      order: count
    }
  })

  revalidatePath("/")
  return col
}

export async function deleteColumn(columnId: string) {
  const session = await auth()
  if (!session) throw new Error("Yetkisiz")

  await prisma.column.delete({
    where: { id: columnId }
  })
  
  revalidatePath("/")
}

export async function deleteBoard(boardId: string) {
  const session = await auth()
  if (!session) throw new Error("Yetkisiz")

  const perms = await getUserPermissions(session.user.id)
  const membership = await prisma.boardMember.findUnique({
    where: {
      userId_boardId: { userId: session.user.id, boardId },
    },
  })

  const canDelete =
    hasPermission(perms, "MANAGE_BOARDS") || membership?.role === "ADMIN"

  if (!canDelete) {
    throw new Error("Bu projeyi silme yetkiniz yok")
  }

  await prisma.board.delete({ where: { id: boardId } })
  revalidatePath("/")
}

export async function reorderBoards(boardIds: string[]) {
  const session = await auth()
  if (!session) throw new Error("Yetkisiz")

  const perms = await getUserPermissions(session.user.id)
  if (!hasPermission(perms, "MANAGE_BOARDS")) {
    throw new Error("Pano sıralama yetkiniz yok")
  }
  
  const updates = boardIds.map((id, index) => 
    prisma.board.update({
      where: { id },
      data: { order: index }
    })
  )
  
  await prisma.$transaction(updates)
  revalidatePath("/")
}

export async function toggleCardAssignee(cardId: string, assigneeId: string) {
  const session = await auth()
  if (!session) throw new Error("Yetkisiz")

  const perms = await getUserPermissions(session.user.id)
  if (!canAssignAssignees(perms)) {
    throw new Error("Sorumlu atama yetkiniz yok")
  }

  const card = await prisma.card.findUnique({
    where: { id: cardId },
    include: { assignees: true }
  })

  if (!card) return

  const isAssigned = card.assignees.some((u: any) => u.id === assigneeId)

  await prisma.card.update({
    where: { id: cardId },
    data: {
      assignees: isAssigned ? { disconnect: { id: assigneeId } } : { connect: { id: assigneeId } }
    }
  })

  await prisma.activityLog.create({
    data: {
      action: isAssigned ? "Sorumluyu karttan çıkardı" : "Yeni sorumlu atadı",
      cardId,
      userId: session.user.id
    }
  })

  revalidatePath("/")
}

export async function updateCardPriority(cardId: string, priority: any) {
  const session = await auth()
  if (!session) throw new Error("Yetkisiz")

  await prisma.card.update({
    where: { id: cardId },
    data: { priority }
  })

  await prisma.activityLog.create({
    data: { action: `Önceliği '${priority}' olarak güncelledi`, cardId, userId: session.user.id }
  })

  revalidatePath("/")
}

export async function updateCardTags(cardId: string, tags: string[]) {
  const session = await auth()
  if (!session) throw new Error("Yetkisiz")

  await prisma.card.update({
    where: { id: cardId },
    data: { tags }
  })

  await prisma.activityLog.create({
    data: { action: `Etiketleri güncelledi: ${tags.join(", ") || 'Etiket yok'}`, cardId, userId: session.user.id }
  })

  revalidatePath("/")
}

export async function addChecklistItem(cardId: string, content: string) {
  const session = await auth()
  if (!session) throw new Error("Yetkisiz")

  await prisma.checklistItem.create({
    data: { cardId, content }
  })
  
  await prisma.activityLog.create({
    data: { action: `'${content}' adlı kontrol listesi öğesini ekledi`, cardId, userId: session.user.id }
  })

  revalidatePath("/")
}

export async function addCardComment(cardId: string, content: string) {
  const session = await auth()
  if (!session) throw new Error("Yetkisiz")

  await prisma.comment.create({
    data: { cardId, content, authorId: session.user.id }
  })

  revalidatePath("/")
}

export async function updateCardCover(cardId: string, coverAttachmentId: string | null, coverMode?: string) {
  const session = await auth()
  if (!session) throw new Error("Yetkisiz")

  await prisma.card.update({
    where: { id: cardId },
    data: { 
      coverAttachmentId,
      ...(coverMode && { coverMode })
    }
  })

  revalidatePath("/")
}

export async function toggleChecklistItem(itemId: string, isDone: boolean) {
  const session = await auth()
  if (!session) throw new Error("Yetkisiz")

  const item = await prisma.checklistItem.update({
    where: { id: itemId },
    data: { isDone }
  })
  
  await prisma.activityLog.create({
    data: { action: `'${item.content}' adlı kontrol listesi öğesini ${isDone ? 'tamamladı' : 'iptal etti'}`, cardId: item.cardId, userId: session.user.id }
  })

  revalidatePath("/")
}

export async function editChecklistItem(itemId: string, content: string) {
  const session = await auth()
  if (!session) throw new Error("Yetkisiz")

  const oldItem = await prisma.checklistItem.findUnique({ where: { id: itemId } })
  if (!oldItem) throw new Error("Öğe bulunamadı")

  const item = await prisma.checklistItem.update({
    where: { id: itemId },
    data: { content }
  })

  await prisma.activityLog.create({
    data: { action: `'${oldItem.content}' öğesini '${content}' olarak güncelledi`, cardId: item.cardId, userId: session.user.id }
  })

  revalidatePath("/")
}

export async function deleteChecklistItem(itemId: string) {
  const session = await auth()
  if (!session) throw new Error("Yetkisiz")

  const item = await prisma.checklistItem.findUnique({ where: { id: itemId } })
  if (!item) throw new Error("Öğe bulunamadı")

  await prisma.checklistItem.delete({
    where: { id: itemId }
  })
  
  await prisma.activityLog.create({
    data: { action: `'${item.content}' adlı kontrol listesi öğesini sildi`, cardId: item.cardId, userId: session.user.id }
  })

  revalidatePath("/")
}

export async function deleteAttachment(attachmentId: string) {
  const session = await auth()
  if (!session) throw new Error("Yetkisiz")

  const attachment = await prisma.attachment.findUnique({ where: { id: attachmentId } })
  if (!attachment) return

  await deleteStoredFile(attachment)

  await prisma.attachment.delete({
    where: { id: attachmentId }
  })
  
  if (attachment.cardId) {
    await prisma.card.update({
      where: { id: attachment.cardId },
      data: { updatedAt: new Date() },
    })
    await prisma.activityLog.create({
      data: { action: `'${attachment.filename}' adlı dosyayı sildi`, cardId: attachment.cardId, userId: session.user.id }
    })
  }

  revalidatePath("/")
}

export async function createShareLink(attachmentId: string): Promise<string> {
  const session = await auth()
  if (!session) throw new Error("Yetkisiz")

  const attachment = await prisma.attachment.findUnique({
    where: { id: attachmentId },
  })
  if (!attachment) throw new Error("Dosya bulunamadı")

  const openCloudUrl = await getAttachmentCopyUrl(attachment)
  if (openCloudUrl) {
    await prisma.attachment.update({
      where: { id: attachmentId },
      data: { path: openCloudUrl },
    })
    return openCloudUrl
  }

  if (isOpenCloudHttpUrl(attachment.path) && !isKantShareOrProxyUrl(attachment.path)) {
    return attachment.path
  }

  if (isOpenCloudEnabled() && getOpenCloudConfig() && attachment.remotePath) {
    const url = await getAttachmentOpenCloudUrl(attachment)
    await prisma.attachment.update({
      where: { id: attachmentId },
      data: { path: url },
    })
    return url
  }

  let link = await prisma.sharedLink.findUnique({ where: { attachmentId } })

  if (!link) {
    const token =
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15)
    link = await prisma.sharedLink.create({
      data: {
        attachmentId,
        token,
      },
    })
  }

  const baseUrl = process.env.AUTH_URL || process.env.NEXTAUTH_URL || ""
  return `${baseUrl}/api/s/${link.token}`
}

export async function createChatGroup(
  name: string,
  boardId: string,
  memberIds: string[],
) {
  const session = await auth()
  if (!session) throw new Error("Yetkisiz")

  if (session.user.role !== "ADMIN") {
    throw new Error("Sadece yöneticiler sohbet grubu oluşturabilir!")
  }

  const { isTelegramEnabled } = await import("@/lib/telegram/config")

  if (isTelegramEnabled()) {
    throw new Error(
      "Yeni konular yalnızca Telegram üzerinden oluşturulabilir. Telegram'da konu açın; Kant otomatik senkronize eder.",
    )
  }

  if (!boardId.trim()) {
    throw new Error("Proje seçilmelidir")
  }

  const allMembers = Array.from(new Set([...memberIds, session.user.id]))

  await prisma.chatGroup.create({
    data: {
      name,
      boardId,
      members: {
        create: allMembers.map((userId) => ({ userId })),
      },
    },
  })

  revalidatePath("/")
  revalidatePath("/chat")
}

export async function sendChatMessage(
  chatGroupId: string,
  content: string,
  attachmentIds: string[] = [],
  replyToId?: string | null,
) {
  const session = await auth()
  if (!session) throw new Error("Yetkisiz")

  const trimmed = content.trim()
  if (!trimmed && attachmentIds.length === 0) {
    throw new Error("Mesaj veya dosya gerekli")
  }

  // Kullanıcının gruba üye olup olmadığını kontrol et
  const membership = await prisma.chatGroupMember.findUnique({
    where: {
      chatGroupId_userId: {
        chatGroupId,
        userId: session.user.id
      }
    }
  })

  if (!membership && session.user.role !== "ADMIN") {
    throw new Error("Bu gruba mesaj gönderme yetkiniz yok!")
  }

  if (attachmentIds.length > 0) {
    const attachments = await prisma.attachment.findMany({
      where: {
        id: { in: attachmentIds },
        chatMessageId: null,
      },
    })

    if (attachments.length !== attachmentIds.length) {
      throw new Error("Bir veya daha fazla dosya bulunamadı")
    }
  }

  if (replyToId) {
    const parent = await prisma.chatMessage.findFirst({
      where: {
        id: replyToId,
        chatGroupId,
        deletedAt: null,
      },
    })
    if (!parent) {
      throw new Error("Yanıtlanacak mesaj bulunamadı")
    }
  }

  const { createChatMessageWithTelegram } = await import("@/lib/telegram/sync")
  const { isTelegramEnabled } = await import("@/lib/telegram/config")
  const { resolveTelegramOutboundSender, TelegramSenderNotReadyError } =
    await import("@/lib/telegram/outbound-sender")

  if (isTelegramEnabled()) {
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
    select: { firstName: true, lastName: true, email: true, color: true },
  })

  const groupMembers = await prisma.chatGroupMember.findMany({
    where: { chatGroupId },
    select: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          color: true,
        },
      },
    },
  })

  const { content: normalizedContent, mentionedUserIds } =
    normalizeMentionsInContent(
      trimmed,
      groupMembers.map((member) => member.user),
    )

  await createChatMessageWithTelegram({
    chatGroupId,
    authorId: session.user.id,
    content: normalizedContent,
    source: "web",
    authorEmail: getUserDisplayName(dbUser ?? session.user),
    pushToTelegram: true,
    attachmentIds,
    replyToId: replyToId ?? null,
    mentionedUserIds,
  })

  revalidatePath("/")
  revalidatePath("/chat")
}

export async function editChatMessage(messageId: string, content: string) {
  const session = await auth()
  if (!session) throw new Error("Yetkisiz")

  const trimmed = content.trim()
  if (!trimmed) throw new Error("Mesaj boş olamaz")

  const message = await prisma.chatMessage.findUnique({
    where: { id: messageId },
    include: {
      chatGroup: { select: { telegramTopicId: true } },
    },
  })

  if (!message || message.deletedAt) {
    throw new Error("Mesaj bulunamadı")
  }

  if (
    message.authorId !== session.user.id &&
    session.user.role !== "ADMIN"
  ) {
    throw new Error("Bu mesajı düzenleme yetkiniz yok")
  }

  const groupMembers = await prisma.chatGroupMember.findMany({
    where: { chatGroupId: message.chatGroupId },
    select: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          color: true,
        },
      },
    },
  })

  const { content: normalizedContent, mentionedUserIds } =
    normalizeMentionsInContent(
      trimmed,
      groupMembers.map((member) => member.user),
    )

  await prisma.chatMessage.update({
    where: { id: messageId },
    data: {
      content: normalizedContent,
      editedAt: new Date(),
      mentionedUserIds,
    },
  })

  if (message.telegramMessageId) {
    const { getTelegramSupergroupId } = await import("@/lib/telegram/settings")
    const { toTelegramThreadId } = await import("@/lib/telegram/sync")
    const { editTelegramMessage } = await import("@/lib/telegram/api")
    const { isTelegramEnabled } = await import("@/lib/telegram/config")
    const supergroupId = await getTelegramSupergroupId()

    if (isTelegramEnabled() && supergroupId) {
      try {
        await editTelegramMessage({
          chatId: supergroupId,
          messageId: Number.parseInt(message.telegramMessageId, 10),
          text: stripMentionTokens(normalizedContent),
          topicId: toTelegramThreadId(message.chatGroup.telegramTopicId),
        })
      } catch (error) {
        console.error("Telegram mesaj düzenlenemedi:", error)
      }
    }
  }

  revalidatePath("/")
  revalidatePath("/chat")
}

export async function deleteChatMessage(messageId: string) {
  const session = await auth()
  if (!session) throw new Error("Yetkisiz")

  const message = await prisma.chatMessage.findUnique({
    where: { id: messageId },
  })

  if (!message || message.deletedAt) {
    throw new Error("Mesaj bulunamadı")
  }

  if (
    message.authorId !== session.user.id &&
    session.user.role !== "ADMIN"
  ) {
    throw new Error("Bu mesajı silme yetkiniz yok")
  }

  await prisma.chatMessage.update({
    where: { id: messageId },
    data: { deletedAt: new Date() },
  })

  if (message.telegramMessageId) {
    const { getTelegramSupergroupId } = await import("@/lib/telegram/settings")
    const { deleteTelegramMessage } = await import("@/lib/telegram/api")
    const { isTelegramEnabled } = await import("@/lib/telegram/config")
    const supergroupId = await getTelegramSupergroupId()

    if (isTelegramEnabled() && supergroupId) {
      try {
        await deleteTelegramMessage(
          supergroupId,
          Number.parseInt(message.telegramMessageId, 10),
        )
      } catch (error) {
        console.error("Telegram mesaj silinemedi:", error)
      }
    }
  }

  revalidatePath("/")
  revalidatePath("/chat")
}

export async function searchCards(query: string, boardId?: string) {
  const session = await auth()
  if (!session) throw new Error("Yetkisiz")

  const trimmed = query.trim()
  if (trimmed.length < 2) return []

  const include = {
    column: { include: { board: true } },
    creator: true,
    assignees: true,
    attachments: true,
  }

  const boardScope = boardId ? { column: { boardId } } : {}

  // Kart ID yalnızca ayırıcı ile: "ATF-490" veya "ATF 490" (ATF490 başlık aramasıdır)
  const idMatch = trimmed.match(/^([a-zA-Z]{1,12})[-\s](\d+)$/i)
  if (idMatch) {
    const exactCard = await prisma.card.findFirst({
      where: {
        sequenceId: parseInt(idMatch[2], 10),
        column: {
          ...(boardId ? { boardId } : {}),
          board: { identifier: { equals: idMatch[1], mode: "insensitive" } },
        },
      },
      include,
    })
    if (exactCard) return [exactCard]
  }

  const textFilter = {
    OR: [
      { title: { contains: trimmed, mode: "insensitive" as const } },
      { description: { contains: trimmed, mode: "insensitive" as const } },
      { comments: { some: { content: { contains: trimmed, mode: "insensitive" as const } } } },
      { checklists: { some: { content: { contains: trimmed, mode: "insensitive" as const } } } },
    ],
  }

  const dbResults = await prisma.card.findMany({
    where: { ...boardScope, ...textFilter },
    include,
    take: 30,
    orderBy: { updatedAt: "desc" },
  })

  if (dbResults.length >= 15) return dbResults.slice(0, 15)

  const { matchSorter } = await import("match-sorter")
  const candidateCards = await prisma.card.findMany({
    where: boardScope,
    include,
    take: 2000,
    orderBy: { updatedAt: "desc" },
  })

  const fuzzyResults = matchSorter(candidateCards, trimmed, {
    keys: [
      "title",
      { key: (card) => `${card.column.board.identifier}-${card.sequenceId}` },
      "description",
      { key: "tags", threshold: matchSorter.rankings.CONTAINS },
    ],
  })

  const seen = new Set<string>()
  const merged = []
  for (const card of [...dbResults, ...fuzzyResults]) {
    if (seen.has(card.id)) continue
    seen.add(card.id)
    merged.push(card)
    if (merged.length >= 15) break
  }

  return merged
}

async function canManageBoardMembers(userId: string, boardId: string) {
  const perms = await getUserPermissions(userId)
  if (hasPermission(perms, "MANAGE_BOARDS")) return true

  const membership = await prisma.boardMember.findUnique({
    where: { userId_boardId: { userId, boardId } },
  })
  return membership?.role === "ADMIN"
}

export async function addBoardMember(boardId: string, userId: string) {
  const session = await auth()
  if (!session) throw new Error("Yetkisiz")

  if (!(await canManageBoardMembers(session.user.id, boardId))) {
    throw new Error("Üye ekleme yetkiniz yok")
  }

  const user = await prisma.user.findFirst({
    where: { id: userId, isActive: true },
  })
  if (!user) throw new Error("Kullanıcı bulunamadı")

  const existing = await prisma.boardMember.findUnique({
    where: { userId_boardId: { userId, boardId } },
  })
  if (existing) return existing

  const member = await prisma.boardMember.create({
    data: { boardId, userId, role: "REQUESTER" },
    include: { user: true },
  })

  revalidatePath(`/b/${boardId}`)
  revalidatePath("/")
  return member
}

export async function removeBoardMember(boardId: string, userId: string) {
  const session = await auth()
  if (!session) throw new Error("Yetkisiz")

  if (!(await canManageBoardMembers(session.user.id, boardId))) {
    throw new Error("Üye kaldırma yetkiniz yok")
  }

  const memberCount = await prisma.boardMember.count({ where: { boardId } })
  if (memberCount <= 1) {
    throw new Error("Panoda en az bir üye kalmalıdır")
  }

  await prisma.boardMember.delete({
    where: { userId_boardId: { userId, boardId } },
  })

  revalidatePath(`/b/${boardId}`)
  revalidatePath("/")
}

export async function getChatMessages(chatGroupId: string) {
  const session = await auth()
  if (!session) throw new Error("Yetkisiz")

  const { chatMessageInclude } = await import("@/lib/chat-message-include")

  return await prisma.chatMessage.findMany({
    where: { chatGroupId, deletedAt: null },
    include: chatMessageInclude,
    orderBy: { createdAt: "asc" },
  })
}

export async function updateBoard(boardId: string, data: { name?: string, identifier?: string, coverImage?: string | null, icon?: string | null }) {
  const session = await auth()
  if (!session) throw new Error("Yetkisiz")

  const board = await prisma.board.update({
    where: { id: boardId },
    data
  })

  revalidatePath("/")
  return board
}
