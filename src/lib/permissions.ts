import { prisma } from "@/lib/prisma"

export const AVAILABLE_PERMISSIONS = [
  { id: "MANAGE_ROLES", label: "Rolleri ve Yetkileri Yönet" },
  { id: "CREATE_BOARD", label: "Pano Oluştur" },
  { id: "MANAGE_BOARDS", label: "Panoları Düzenle / Sil" },
  { id: "CREATE_CARD", label: "Kart Oluştur" },
  { id: "MOVE_CARD", label: "Kart Taşı" },
  { id: "DELETE_CARD", label: "Kart Sil" },
  { id: "UPDATE_CARD", label: "Kart Düzenle" },
  { id: "ASSIGN_ASSIGNEES", label: "Sorumlu Ata" },
  { id: "MANAGE_CHATS", label: "Sohbet Gruplarını Yönet" },
]

export function canCreateBoard(permissions: string[]): boolean {
  return hasPermission(permissions, "CREATE_BOARD")
}

export function canAssignAssignees(permissions: string[]): boolean {
  return hasPermission(permissions, "ASSIGN_ASSIGNEES")
}

export function canMoveCard(permissions: string[]): boolean {
  return hasPermission(permissions, "MOVE_CARD")
}


export async function getUserPermissions(userId: string): Promise<string[]> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { customRole: true }
  })
  
  if (user?.role === "ADMIN") {
    // Legacy super admin gets everything
    return ["SUPER_ADMIN"]
  }

  return user?.customRole?.permissions || []
}

export function hasPermission(permissions: string[], required: string): boolean {
  if (permissions.includes("SUPER_ADMIN")) return true
  return permissions.includes(required)
}
