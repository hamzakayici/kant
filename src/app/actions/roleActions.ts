"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import bcrypt from "bcryptjs"
import { revalidatePath } from "next/cache"
import { getUserPermissions, hasPermission, checkIsSuperAdmin } from "@/lib/permissions"
import { resolveResetPassword } from "@/lib/reset-password"

export type ResetPasswordResult =
  | { ok: true; temporaryPassword: string }
  | { ok: false; error: string }

export async function getRoles() {
  const session = await auth()
  if (!session) throw new Error("Yetkisiz")
  
  const perms = await getUserPermissions(session.user.id)
  if (!hasPermission(perms, "MANAGE_ROLES")) throw new Error("Yetkisiz işlem")

  // Ensure system roles exist in the database
  const systemRoleCount = await prisma.customRole.count({
    where: { id: { startsWith: "system_" } }
  })

  if (systemRoleCount === 0) {
    // Initialize system roles
    await prisma.customRole.createMany({
      data: [
        { id: "system_admin", name: "Müdürlük / Admin", permissions: ["MANAGE_ROLES", "CREATE_BOARD", "MANAGE_BOARDS", "CREATE_CARD", "MOVE_CARD", "DELETE_CARD", "UPDATE_CARD", "ASSIGN_ASSIGNEES", "MANAGE_CHATS"], icon: "Shield" },
        { id: "system_editor", name: "Editör", permissions: ["UPDATE_CARD", "MOVE_CARD", "ASSIGN_ASSIGNEES"], icon: "Edit3" },
        { id: "system_designer", name: "Görsel Ekip (Tasarımcı)", permissions: ["UPDATE_CARD", "MOVE_CARD", "ASSIGN_ASSIGNEES"], icon: "Brush" },
        { id: "system_requester", name: "Talep Eden", permissions: ["CREATE_CARD"], icon: "User" }
      ]
    })
    
    // Migrate existing users to use customRoleId for system roles
    await prisma.user.updateMany({ where: { role: "ADMIN", customRoleId: null }, data: { customRoleId: "system_admin" } })
    await prisma.user.updateMany({ where: { role: "EDITOR", customRoleId: null }, data: { customRoleId: "system_editor" } })
    await prisma.user.updateMany({ where: { role: "DESIGNER", customRoleId: null }, data: { customRoleId: "system_designer" } })
    await prisma.user.updateMany({ where: { role: "REQUESTER", customRoleId: null }, data: { customRoleId: "system_requester" } })
  }

  const adminRole = await prisma.customRole.findUnique({
    where: { id: "system_admin" },
    select: { permissions: true },
  })
  if (adminRole && !adminRole.permissions.includes("CREATE_BOARD")) {
    await prisma.customRole.update({
      where: { id: "system_admin" },
      data: {
        permissions: [...adminRole.permissions, "CREATE_BOARD"],
      },
    })
  }

  for (const roleId of ["system_admin", "system_editor", "system_designer"] as const) {
    const role = await prisma.customRole.findUnique({
      where: { id: roleId },
      select: { permissions: true },
    })
    if (role) {
      const missing: string[] = []
      if (!role.permissions.includes("ASSIGN_ASSIGNEES")) missing.push("ASSIGN_ASSIGNEES")
      if (!role.permissions.includes("MOVE_CARD")) missing.push("MOVE_CARD")
      if (missing.length > 0) {
        await prisma.customRole.update({
          where: { id: roleId },
          data: {
            permissions: [...role.permissions, ...missing],
          },
        })
      }
    }
  }

  const allRoles = await prisma.customRole.findMany({
    include: { _count: { select: { users: true } } },
    orderBy: { createdAt: 'asc' }
  })

  // Map to add isSystem flag for UI logic
  return allRoles.map(r => ({
    ...r,
    isSystem: r.id.startsWith("system_")
  }))
}

export async function createRole(name: string, description: string, permissions: string[], icon?: string) {
  const session = await auth()
  if (!session) throw new Error("Yetkisiz")
  
  const perms = await getUserPermissions(session.user.id)
  if (!hasPermission(perms, "MANAGE_ROLES")) throw new Error("Yetkisiz işlem")

  const role = await prisma.customRole.create({
    data: { name, description, permissions, icon }
  })
  revalidatePath("/settings/roles")
  return role
}

export async function updateRole(id: string, name: string, description: string, permissions: string[], icon?: string) {
  const session = await auth()
  if (!session) throw new Error("Yetkisiz")
  
  const perms = await getUserPermissions(session.user.id)
  if (!hasPermission(perms, "MANAGE_ROLES")) throw new Error("Yetkisiz işlem")

  const role = await prisma.customRole.update({
    where: { id },
    data: { name, description, permissions, icon }
  })
  revalidatePath("/settings/roles")
  return role
}

export async function deleteRole(id: string) {
  const session = await auth()
  if (!session) throw new Error("Yetkisiz")
  
  const perms = await getUserPermissions(session.user.id)
  if (!hasPermission(perms, "MANAGE_ROLES")) throw new Error("Yetkisiz işlem")

  if (id.startsWith("system_")) throw new Error("Sistem rolleri silinemez!")

  await prisma.customRole.delete({ where: { id } })
  revalidatePath("/settings/roles")
}

export async function assignUserRole(userId: string, roleId: string) {
  const session = await auth()
  if (!session) throw new Error("Yetkisiz")
  
  const perms = await getUserPermissions(session.user.id)
  if (!hasPermission(perms, "MANAGE_ROLES")) throw new Error("Yetkisiz işlem")

  let roleEnum = "REQUESTER" as any
  let customRoleId: string | null = null

  if (roleId === "system_admin") roleEnum = "ADMIN"
  else if (roleId === "system_editor") roleEnum = "EDITOR"
  else if (roleId === "system_designer") roleEnum = "DESIGNER"
  else if (roleId === "system_requester") roleEnum = "REQUESTER"
  else {
    // Custom role
    customRoleId = roleId
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      role: roleEnum,
      customRoleId
    }
  })

  revalidatePath("/settings/roles")
}

export async function createUser(data: any) {
  const session = await auth()
  if (!session) throw new Error("Yetkisiz")
  
  const perms = await getUserPermissions(session.user.id)
  if (!hasPermission(perms, "MANAGE_ROLES")) throw new Error("Yetkisiz işlem")

  let roleEnum = "REQUESTER" as any
  let customRoleId: string | null = null

  if (data.roleId === "system_admin") roleEnum = "ADMIN"
  else if (data.roleId === "system_editor") roleEnum = "EDITOR"
  else if (data.roleId === "system_designer") roleEnum = "DESIGNER"
  else if (data.roleId === "system_requester") roleEnum = "REQUESTER"
  else {
    customRoleId = data.roleId
  }

  const bcrypt = require("bcryptjs")
  const hashedPassword = await bcrypt.hash(data.password, 10)

  const user = await prisma.user.create({
    data: {
      email: data.email,
      firstName: data.firstName?.trim() || null,
      lastName: data.lastName?.trim() || null,
      password: hashedPassword,
      role: roleEnum,
      customRoleId
    }
  })
  
  revalidatePath("/settings/roles")
  return user
}

export async function updateUser(id: string, data: any) {
  const session = await auth()
  if (!session) throw new Error("Yetkisiz")
  
  const perms = await getUserPermissions(session.user.id)
  if (!hasPermission(perms, "MANAGE_ROLES")) throw new Error("Yetkisiz işlem")

  let updateData: any = {
    email: data.email,
    firstName: data.firstName?.trim() || null,
    lastName: data.lastName?.trim() || null,
    avatarUrl: data.avatarUrl,
    color: data.color
  }

  if (data.password) {
    const bcrypt = require("bcryptjs")
    updateData.password = await bcrypt.hash(data.password, 10)
    updateData.mustChangePassword = true // Admin reset means they must change it again
  }

  if (data.roleId) {
    let roleEnum = "REQUESTER" as any
    let customRoleId: string | null = null

    if (data.roleId === "system_admin") roleEnum = "ADMIN"
    else if (data.roleId === "system_editor") roleEnum = "EDITOR"
    else if (data.roleId === "system_designer") roleEnum = "DESIGNER"
    else if (data.roleId === "system_requester") roleEnum = "REQUESTER"
    else {
      customRoleId = data.roleId
    }
    updateData.role = roleEnum
    updateData.customRoleId = customRoleId
  }

  const user = await prisma.user.update({
    where: { id },
    data: updateData
  })
  
  revalidatePath("/settings/roles")
  return user
}

export async function toggleUserStatus(id: string, isActive: boolean) {
  const session = await auth()
  if (!session) throw new Error("Yetkisiz")
  
  const perms = await getUserPermissions(session.user.id)
  if (!hasPermission(perms, "MANAGE_ROLES")) throw new Error("Yetkisiz işlem")

  if (session.user.id === id) {
    throw new Error("Kendinizi donduramazsınız!")
  }

  const user = await prisma.user.update({
    where: { id },
    data: { isActive }
  })
  
  revalidatePath("/settings/roles")
  return user
}

export async function deleteUserAction(id: string) {
  const session = await auth()
  if (!session) throw new Error("Yetkisiz")
  
  const perms = await getUserPermissions(session.user.id)
  if (!hasPermission(perms, "MANAGE_ROLES")) throw new Error("Yetkisiz işlem")

  if (session.user.id === id) {
    throw new Error("Kendi hesabınızı silemezsiniz!")
  }

  await prisma.user.delete({
    where: { id }
  })
  
  revalidatePath("/settings/roles")
  return true
}

export async function changeMyPassword(newPassword: string) {
  const session = await auth()
  if (!session) throw new Error("Yetkisiz")
  
  const hashedPassword = await bcrypt.hash(newPassword, 10)

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      password: hashedPassword,
      mustChangePassword: false
    }
  })
  
  return true
}

export async function resetUserPassword(userId: string): Promise<ResetPasswordResult> {
  const session = await auth()
  if (!session?.user?.id) {
    return { ok: false, error: "Oturum bulunamadı. Lütfen tekrar giriş yapın." }
  }

  const perms = await getUserPermissions(session.user.id)
  if (!hasPermission(perms, "MANAGE_ROLES")) {
    return { ok: false, error: "Bu işlem için yetkiniz yok." }
  }

  if (session.user.id === userId) {
    return {
      ok: false,
      error: "Kendi şifrenizi bu ekrandan sıfırlayamazsınız.",
    }
  }

  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true },
  })
  if (!target) {
    return { ok: false, error: "Kullanıcı bulunamadı." }
  }

  const temporaryPassword = resolveResetPassword()

  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        password: await bcrypt.hash(temporaryPassword, 10),
        mustChangePassword: true,
      },
    })

    revalidatePath("/settings/roles")
    return { ok: true, temporaryPassword }
  } catch {
    return { ok: false, error: "Şifre güncellenirken bir hata oluştu." }
  }
}

export async function toggleSuperAdmin(userId: string) {
  const session = await auth()
  if (!session) throw new Error("Yetkisiz")

  // Sadece süper admin bu işlemi yapabilir
  const isCaller = await checkIsSuperAdmin(session.user.id)
  if (!isCaller) throw new Error("Bu işlem için süper admin yetkiniz gerekiyor.")

  if (session.user.id === userId) {
    throw new Error("Kendi süper admin yetkinizi kaldıramazsınız!")
  }

  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { isSuperAdmin: true },
  })
  if (!target) throw new Error("Kullanıcı bulunamadı")

  await prisma.user.update({
    where: { id: userId },
    data: { isSuperAdmin: !target.isSuperAdmin },
  })

  revalidatePath("/settings/roles")
  return { isSuperAdmin: !target.isSuperAdmin }
}
