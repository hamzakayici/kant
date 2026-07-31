import { getRoles } from "@/app/actions/roleActions"
import { AVAILABLE_PERMISSIONS, getUserPermissions, hasPermission } from "@/lib/permissions"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import RolesClient from "./RolesClient"
import { PageHeader } from "@/components/layout/page-header"

export default async function RolesPage() {
  const session = await auth()
  if (!session) return <div>Yetkisiz</div>

  const perms = await getUserPermissions(session.user.id)
  if (!hasPermission(perms, "MANAGE_ROLES")) {
    return (
      <div className="p-8 text-foreground">
        Bu sayfayı görüntüleme yetkiniz yok.
      </div>
    )
  }

  const roles = await getRoles()
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      customRoleId: true,
      customRole: { select: { id: true, name: true } },
      avatarUrl: true,
      color: true,
      isActive: true,
      telegramUserId: true,
      telegramUsername: true,
    },
    orderBy: { email: "asc" },
  })

  return (
    <div className="min-h-screen bg-background p-6 text-foreground md:p-8">
      <PageHeader
        title="Roller ve Yetkiler"
        description="Kullanıcı rollerini, erişim izinlerini ve hesapları yönetin"
        className="mb-8"
      />
      <RolesClient
        roles={roles}
        availablePermissions={AVAILABLE_PERMISSIONS}
        users={users}
      />
    </div>
  )
}
