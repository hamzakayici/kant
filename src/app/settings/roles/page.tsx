import { getRoles } from "@/app/actions/roleActions"
import { AVAILABLE_PERMISSIONS, getUserPermissions, hasPermission, checkIsSuperAdmin } from "@/lib/permissions"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import RolesClient from "./RolesClient"
import { PageHeader } from "@/components/layout/page-header"

export default async function RolesPage() {
  const session = await auth()
  if (!session) return <div>Yetkisiz</div>

  const callerIsSuperAdmin = await checkIsSuperAdmin(session.user.id)
  
  if (!callerIsSuperAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-8 text-foreground">
        Bu sayfayı görüntüleme yetkiniz yok. (Sadece Süper Admin)
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
      isSuperAdmin: true,
      telegramUserId: true,
      telegramUsername: true,
    },
    orderBy: { email: "asc" },
  })

  return (
    <div className="h-full overflow-y-auto bg-background p-6 text-foreground md:p-8">
      <PageHeader
        title="Roller ve Yetkiler"
        description="Kullanıcı rollerini, erişim izinlerini ve hesapları yönetin"
        className="mb-8"
      />
      <RolesClient
        roles={roles}
        availablePermissions={AVAILABLE_PERMISSIONS}
        users={users}
        callerIsSuperAdmin={callerIsSuperAdmin}
      />
    </div>
  )
}
