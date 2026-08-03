import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import KanbanBoard from "@/components/KanbanBoard"
import { redirect } from "next/navigation"
import InboxWrapper from "@/components/InboxWrapper"
import { canAssignAssignees, getUserPermissions, hasPermission } from "@/lib/permissions"
import GlobalSearch from "@/components/GlobalSearch"
import BoardTimelineView from "@/components/BoardTimelineView"
import BoardFilter from "@/components/BoardFilter"
import { BoardHeader } from "@/components/layout/board-header"
import type { Metadata } from "next"
import { getCardOgImageUrl } from "@/lib/card-og"
import {
  cardShareSelect,
  formatCardSharePreview,
  getTelegramCardShareUrl,
} from "@/lib/card-share"

export async function generateMetadata(props: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}): Promise<Metadata> {
  const { id: boardId } = await props.params
  const searchParams = await props.searchParams
  const cardId =
    typeof searchParams.card === "string" ? searchParams.card : undefined

  if (!cardId) {
    const board = await prisma.board.findUnique({
      where: { id: boardId },
      select: { name: true, identifier: true },
    })
    if (!board) return { title: "Proje" }
    return {
      title: `${board.name} · ${board.identifier}`,
      description: `${board.name} kanban panosu`,
    }
  }

  const card = await prisma.card.findFirst({
    where: {
      id: cardId,
      column: { boardId },
    },
    select: cardShareSelect,
  })

  if (!card) {
    return { title: "Kart" }
  }

  const preview = formatCardSharePreview(card)
  const url = getTelegramCardShareUrl(boardId, cardId)
  const ogImage = getCardOgImageUrl(boardId, cardId)
  const description = [
    preview.boardName,
    preview.columnName,
    preview.assignees ? `Atanan: ${preview.assignees}` : null,
    preview.descriptionSnippet || null,
  ]
    .filter(Boolean)
    .join(" · ")

  return {
    title: `${preview.identifier} · ${preview.title}`,
    description,
    openGraph: {
      title: `${preview.identifier} · ${preview.title}`,
      description,
      url,
      type: "website",
      siteName: "Kant",
      ...(ogImage ? { images: [{ url: ogImage, width: 1200, height: 630, alt: preview.title }] } : {}),
    },
    twitter: {
      card: ogImage ? "summary_large_image" : "summary",
      title: `${preview.identifier} · ${preview.title}`,
      description,
      ...(ogImage ? { images: [ogImage] } : {}),
    },
  }
}

export default async function BoardPage(props: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { id } = await props.params
  const searchParams = await props.searchParams
  const viewParam = (searchParams.view as string) || "kanban"
  const view = viewParam === "list" ? "kanban" : viewParam
  const session = await auth()

  if (!session) {
    redirect("/login")
  }

  const board = await prisma.board.findUnique({
    where: { id },
    include: {
      members: {
        include: { user: true },
      },
      columns: {
        orderBy: { order: "asc" },
        include: {
          cards: {
            orderBy: [{ order: "asc" }, { createdAt: "asc" }],
            include: {
              assignees: true,
              creator: true,
              attachments: { orderBy: { createdAt: "desc" } },
              comments: {
                include: { author: true },
                orderBy: { createdAt: "desc" },
              },
              checklists: { orderBy: { createdAt: "asc" } },
              activities: {
                include: { user: true },
                orderBy: { createdAt: "desc" },
              },
            },
          },
        },
      },
    },
  })

  if (!board) {
    redirect("/")
  }

  const membership = await prisma.boardMember.findUnique({
    where: {
      userId_boardId: {
        userId: session.user.id,
        boardId: board.id,
      },
    },
  })

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
  })
  let currentUserRole = "system_requester"
  if (dbUser?.customRoleId) {
    currentUserRole = dbUser.customRoleId
  } else if (dbUser?.role) {
    if (dbUser.role === "ADMIN") currentUserRole = "system_admin"
    else if (dbUser.role === "EDITOR") currentUserRole = "system_editor"
    else if (dbUser.role === "DESIGNER") currentUserRole = "system_designer"
  }

  const allRolesRaw = await prisma.customRole.findMany({
    orderBy: { name: "asc" },
  })
  const allRoles = allRolesRaw.map((r) => ({
    ...r,
    isSystem: r.id.startsWith("system_"),
  }))

  const effectiveRole = membership ? membership.role : session.user.role

  const activities = await prisma.activityLog.findMany({
    where: {
      card: { column: { boardId: board.id } },
    },
    include: { user: true, card: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  })

  const totalCards = board.columns.reduce(
    (sum, col) => sum + col.cards.length,
    0,
  )

  const permissions = await getUserPermissions(session.user.id)
  const canAssign = canAssignAssignees(permissions)
  const canManageMembers =
    hasPermission(permissions, "MANAGE_BOARDS") || membership?.role === "ADMIN"

  const allUsers = await prisma.user.findMany({
    where: { isActive: true },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      color: true,
    },
    orderBy: [{ firstName: "asc" }, { email: "asc" }],
  })

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <BoardHeader
        boardId={board.id}
        boardName={board.name}
        boardIdentifier={board.identifier}
        boardIcon={board.icon}
        boardDescription={board.description}
        view={view}
        cardCount={totalCards}
        memberCount={board.members.length}
        members={board.members}
        allUsers={allUsers}
        canManageMembers={canManageMembers}
        filterSlot={
          <BoardFilter
            members={board.members}
            currentUserId={session.user.id}
          />
        }
        toolbarSlot={
          <>
            <GlobalSearch boardId={board.id} />
            <InboxWrapper activities={activities} />
          </>
        }
      />

      <main className="relative z-10 flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="custom-scrollbar kanban-scroll flex min-h-0 flex-1 flex-col overflow-hidden px-3 py-2 md:px-4">
          {view === "kanban" ? (
            <KanbanBoard
              initialBoard={board}
              userRole={effectiveRole}
              allRoles={allRoles}
              currentUserRole={currentUserRole}
              canAssignAssignees={canAssign}
            />
          ) : null}
          {view === "timeline" ? (
            <BoardTimelineView board={board} />
          ) : null}
        </div>
      </main>
    </div>
  )
}
