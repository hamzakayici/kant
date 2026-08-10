import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { getUserPermissions, hasPermission } from "@/lib/permissions"

export async function checkCardPermission(cardId: string, action: "UPDATE_CARD" | "DELETE_CARD" | "ASSIGN_ASSIGNEES") {
  const session = await auth()
  if (!session) throw new Error("Yetkisiz işlem")

  const card = await prisma.card.findUnique({
    where: { id: cardId },
    include: { column: true }
  })
  if (!card) throw new Error("Kart bulunamadı")

  const dbUser = await prisma.user.findUnique({ where: { id: session.user.id } })
  let currentRole = "system_requester"
  if (dbUser?.customRoleId) currentRole = dbUser.customRoleId
  else if (dbUser?.role) {
    if (dbUser.role === "ADMIN") currentRole = "system_admin"
    else if (dbUser.role === "EDITOR") currentRole = "system_editor"
    else if (dbUser.role === "DESIGNER") currentRole = "system_designer"
  }

  const perms = await getUserPermissions(session.user.id)
  const isAllowed = hasPermission(perms, action)

  if (!isAllowed) {
    // If user is a system admin, they can bypass
    const isAdmin = currentRole === "system_admin"
    if (!isAdmin) {
      throw new Error("Bu işlemi yapma yetkiniz bulunmuyor.")
    }
  }

  return session.user.id
}
