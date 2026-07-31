import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import PlannerClient from "./PlannerClient"

export default async function PlannerPage() {
  const session = await auth()

  if (!session) {
    redirect("/login")
  }

  const memberships = await prisma.boardMember.findMany({
    where: { userId: session.user.id },
  })

  const boardIds = memberships.map((m) => m.boardId)

  const cards = await prisma.card.findMany({
    where:
      session.user.role === "ADMIN"
        ? {}
        : { column: { boardId: { in: boardIds } } },
    include: {
      column: { include: { board: true } },
      creator: true,
      assignees: true,
    },
    orderBy: { createdAt: "desc" },
  })

  return <PlannerClient initialCards={cards} />
}
