import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { canCreateBoard, getUserPermissions } from "@/lib/permissions"
import BoardListDnd from "@/components/BoardListDnd"
import { ProjectsHeader } from "@/components/projects/projects-header"
import { ProjectsStats } from "@/components/projects/projects-stats"

export default async function Dashboard() {
  const session = await auth()

  if (!session) {
    redirect("/login")
  }

  const userMemberships = await prisma.boardMember.findMany({
    where: { userId: session.user.id },
    include: {
      board: {
        include: {
          columns: {
            select: {
              _count: {
                select: { cards: true },
              },
            },
          },
        },
      },
    },
    orderBy: {
      board: {
        order: "asc",
      },
    },
  })

  const boards = userMemberships.map((m) => m.board)

  const allUsers = await prisma.user.findMany({
    select: { id: true, email: true, firstName: true, lastName: true, role: true },
  })

  const totalCards = boards.reduce(
    (sum, board) =>
      sum +
      board.columns.reduce(
        (colSum, col) => colSum + (col._count?.cards || 0),
        0,
      ),
    0,
  )

  const activeBoards = boards.filter((board) =>
    board.columns.some((col) => (col._count?.cards || 0) > 0),
  ).length

  const permissions = await getUserPermissions(session.user.id)
  const canCreate = canCreateBoard(permissions)

  return (
    <div className="@container/main flex h-full min-h-0 flex-1 flex-col overflow-y-auto">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <ProjectsHeader
          user={session.user}
          allUsers={allUsers}
          canCreateBoard={canCreate}
        />

        <ProjectsStats
          boardCount={boards.length}
          totalCards={totalCards}
          activeBoards={activeBoards}
        />

        <div className="px-4 lg:px-6">
          <BoardListDnd initialBoards={boards} />
        </div>
      </div>
    </div>
  )
}
