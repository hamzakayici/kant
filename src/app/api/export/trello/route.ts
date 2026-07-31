import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { getUserDisplayName } from '@/lib/user'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const boardId = searchParams.get('boardId')

  if (!boardId) return new NextResponse('Eksik boardId', { status: 400 })

  const session = await auth()
  if (!session) return new NextResponse('Yetkisiz', { status: 401 })

  const board = await prisma.board.findUnique({
    where: { id: boardId },
    include: {
      columns: {
        include: {
          cards: {
            include: {
              checklists: true,
              comments: {
                include: { author: true }
              }
            }
          }
        }
      }
    }
  })

  if (!board) return new NextResponse('Bulunamadı', { status: 404 })

  // Construct Trello JSON
  const trelloJson = {
    name: board.name,
    desc: board.description || "",
    closed: false,
    idOrganization: null,
    prefs: {
      permissionLevel: board.isPrivate ? "private" : "public",
      background: "blue"
    },
    lists: board.columns.map(c => ({
      id: c.id,
      name: c.name,
      closed: false,
      pos: c.order * 1000
    })),
    cards: board.columns.flatMap(c => c.cards.map(card => ({
      id: card.id,
      idList: c.id,
      name: card.title,
      desc: card.description || "",
      due: card.dueDate ? card.dueDate.toISOString() : null,
      pos: card.order * 1000,
      labels: card.tags ? card.tags.map(tag => ({ name: tag, color: "blue" })) : []
    }))),
    checklists: board.columns.flatMap(c => c.cards.map(card => {
      // Group all checklist items of a card into a single "Checklist" since Trello requires checklists
      if (card.checklists.length === 0) return null
      return {
        id: card.id + "_checklist",
        idCard: card.id,
        name: "Checklist",
        checkItems: card.checklists.map((item, i) => ({
          id: item.id,
          name: item.content,
          state: item.isDone ? "complete" : "incomplete",
          pos: i * 1000
        }))
      }
    })).filter(Boolean),
    actions: board.columns.flatMap(c => c.cards.flatMap(card => card.comments.map(cmt => ({
      id: cmt.id,
      idMemberCreator: cmt.authorId,
      data: {
        text: cmt.content,
        card: { id: card.id, name: card.title },
        board: { id: board.id, name: board.name },
        list: { id: c.id, name: c.name }
      },
      type: "commentCard",
      date: cmt.createdAt.toISOString(),
      memberCreator: {
        id: cmt.author.id,
        username: cmt.author.email,
        fullName: getUserDisplayName(cmt.author)
      }
    }))))
  }

  return new NextResponse(JSON.stringify(trelloJson, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="trello-export-${board.identifier || 'board'}.json"`
    }
  })
}
