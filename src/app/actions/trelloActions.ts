"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import { canCreateBoard, getUserPermissions } from "@/lib/permissions"

export async function importTrelloBoard(trelloJsonString: string) {
  const session = await auth()
  if (!session) throw new Error("Yetkisiz işlem")

  const perms = await getUserPermissions(session.user.id)
  if (!canCreateBoard(perms)) {
    throw new Error("Pano oluşturma yetkiniz yok")
  }
  
  let data;
  try {
    data = JSON.parse(trelloJsonString)
  } catch (e) {
    throw new Error("Geçersiz JSON dosyası")
  }

  if (!data.name || !data.cards || !data.lists) {
    throw new Error("Geçersiz Trello JSON formatı. 'name', 'cards' ve 'lists' alanları bulunamadı.")
  }
  
  const identifier = data.name.substring(0, 3).toUpperCase() || "TRL"
  
  // 1. Create Board
  const board = await prisma.board.create({
    data: {
      name: data.name,
      description: data.desc || null,
      identifier: identifier,
      members: {
        create: {
          userId: session.user.id,
          role: "ADMIN"
        }
      }
    }
  })
  
  // 2. Map Trello List IDs to New Column IDs
  const listIdMap = new Map<string, string>()
  const lists = data.lists.filter((l: any) => !l.closed).sort((a: any, b: any) => a.pos - b.pos)
  
  let colOrder = 0
  for (const l of lists) {
    const col = await prisma.column.create({
      data: {
        name: l.name,
        order: colOrder++,
        boardId: board.id,
        category: "ACTIVE"
      }
    })
    listIdMap.set(l.id, col.id)
  }
  
  // 3. Map Trello Card IDs to New Card IDs
  const cards = data.cards.filter((c: any) => !c.closed)
  const cardIdMap = new Map<string, string>()
  
  const cardsByList = new Map<string, any[]>()
  for (const c of cards) {
    if (!cardsByList.has(c.idList)) cardsByList.set(c.idList, [])
    cardsByList.get(c.idList)!.push(c)
  }
  
  for (const [trelloListId, listCards] of cardsByList.entries()) {
    const columnId = listIdMap.get(trelloListId)
    if (!columnId) continue
    
    // Sort cards by Trello's pos (float)
    listCards.sort((a: any, b: any) => (a.pos || 0) - (b.pos || 0))
    
    let cardOrder = 0
    for (const c of listCards) {
      const tags = c.labels?.map((l: any) => l.name || l.color).filter(Boolean) || []
      
      const updatedBoard = await prisma.board.update({
        where: { id: board.id },
        data: { sequenceCounter: { increment: 1 } }
      })
      const currentSeq = updatedBoard.sequenceCounter - 1
      
      const newCard = await prisma.card.create({
        data: {
          title: c.name,
          description: c.desc || null,
          dueDate: c.due ? new Date(c.due) : null,
          order: cardOrder++,
          sequenceId: currentSeq,
          columnId,
          creatorId: session.user.id,
          tags
        }
      })
      cardIdMap.set(c.id, newCard.id)
    }
  }
  
  // 4. Create Checklists
  if (data.checklists && Array.isArray(data.checklists)) {
    for (const cl of data.checklists) {
      const cardId = cardIdMap.get(cl.idCard)
      if (!cardId) continue
      
      const checkItems = cl.checkItems || []
      checkItems.sort((a: any, b: any) => (a.pos || 0) - (b.pos || 0))
      
      for (const item of checkItems) {
        await prisma.checklistItem.create({
          data: {
            content: item.name,
            isDone: item.state === "complete",
            cardId
          }
        })
      }
    }
  }
  
  // 5. Create Comments from Actions
  if (data.actions && Array.isArray(data.actions)) {
    const comments = data.actions.filter((a: any) => a.type === "commentCard")
    comments.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
    
    for (const cmt of comments) {
      const cardId = cardIdMap.get(cmt.data?.card?.id)
      if (!cardId) continue
      
      const authorName = cmt.memberCreator?.fullName || "Bilinmeyen Trello Kullanıcısı"
      const content = `[Trello: ${authorName}]\n${cmt.data.text}`
      
      await prisma.comment.create({
        data: {
          content,
          cardId,
          authorId: session.user.id,
          createdAt: new Date(cmt.date)
        }
      })
    }
  }
  
  revalidatePath("/")
  return board.id
}
