"use client"

import { useMemo, useState } from "react"
import {
  Ban,
  Briefcase,
  Brush,
  Check,
  Crown,
  Edit3,
  Heart,
  Key,
  Lock,
  Plus,
  Save,
  Search,
  Settings,
  Shield,
  Star,
  Trash2,
  User,
  UserMinus,
  UserPlus,
  Users,
  Zap,
} from "lucide-react"
import {
  assignUserRole,
  createRole,
  createUser,
  deleteRole,
  deleteUserAction,
  resetUserPassword,
  toggleSuperAdmin,
  toggleUserStatus,
  updateRole,
  updateUser,
} from "@/app/actions/roleActions"
import { useModal } from "@/components/providers/ModalProvider"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getUserDisplayName, getUserInitial, getUserColorStyles } from "@/lib/user"
import { resetPasswordHint } from "@/lib/reset-password"
import { cn } from "@/lib/utils"

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Shield,
  Star,
  Zap,
  User,
  Users,
  Briefcase,
  Settings,
  Lock,
  Key,
  Heart,
  Edit3,
  Brush,
}

const AVAILABLE_ICONS = Object.keys(ICONS)
const USER_COLORS = [
  "#3b82f6",
  "#10b981",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#f97316",
  "#eab308",
  "#14b8a6",
  "#6366f1",
  "#d946ef",
  "#06b6d4",
]

type Role = {
  id: string
  name: string
  description?: string | null
  permissions?: string[]
  icon?: string | null
  isSystem?: boolean
  _count?: { users?: number }
}

type Permission = { id: string; label: string }

type UserRow = {
  id: string
  email: string
  firstName?: string | null
  lastName?: string | null
  role: string
  customRoleId?: string | null
  customRole?: { id: string; name: string } | null
  avatarUrl?: string | null
  color?: string | null
  isActive: boolean
  isSuperAdmin?: boolean
  telegramUserId?: string | null
  telegramUsername?: string | null
}

function resolveUserRoleId(user: UserRow): string {
  if (user.customRoleId) return user.customRoleId
  if (user.role === "ADMIN") return "system_admin"
  if (user.role === "EDITOR") return "system_editor"
  if (user.role === "DESIGNER") return "system_designer"
  return "system_requester"
}

function RoleIcon({
  name,
  className,
}: {
  name?: string | null
  className?: string
}) {
  const Icon = ICONS[name || "Shield"] || Shield
  return <Icon className={className} />
}

export default function RolesClient({
  roles,
  availablePermissions,
  users = [],
  callerIsSuperAdmin = false,
}: {
  roles: Role[]
  availablePermissions: Permission[]
  users?: UserRow[]
  callerIsSuperAdmin?: boolean
}) {
  const { showAlert, showConfirm } = useModal()
  const [activeTab, setActiveTab] = useState("roles")
  const [userSearch, setUserSearch] = useState("")

  const [roleSheetOpen, setRoleSheetOpen] = useState(false)
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null)
  const [roleName, setRoleName] = useState("")
  const [roleDesc, setRoleDesc] = useState("")
  const [rolePerms, setRolePerms] = useState<string[]>([])
  const [roleIcon, setRoleIcon] = useState("Shield")

  const [userSheetOpen, setUserSheetOpen] = useState(false)
  const [editingUserId, setEditingUserId] = useState<string | null>(null)
  const [isNewUser, setIsNewUser] = useState(false)
  const [userForm, setUserForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    roleId: "system_requester",
    avatarUrl: "",
    color: "#3b82f6",
    isActive: true,
  })
  const [resettingUserId, setResettingUserId] = useState<string | null>(null)

  const editingUser = editingUserId ? users.find((u) => u.id === editingUserId) : null

  const filteredUsers = useMemo(() => {
    const query = userSearch.trim().toLowerCase()
    const sorted = [...users].sort((a, b) =>
      getUserDisplayName(a).localeCompare(getUserDisplayName(b), "tr", {
        sensitivity: "base",
      }),
    )
    if (!query) return sorted
    return sorted.filter((user) => {
      const displayName = getUserDisplayName(user).toLowerCase()
      return (
        displayName.includes(query) || user.email.toLowerCase().includes(query)
      )
    })
  }, [users, userSearch])

  const openNewRole = () => {
    setEditingRoleId("new")
    setRoleName("")
    setRoleDesc("")
    setRolePerms([])
    setRoleIcon("Shield")
    setRoleSheetOpen(true)
  }

  const openEditRole = (role: Role) => {
    setEditingRoleId(role.id)
    setRoleName(role.name)
    setRoleDesc(role.description || "")
    setRolePerms(role.permissions || [])
    setRoleIcon(role.icon || "Shield")
    setRoleSheetOpen(true)
  }

  const openNewUser = () => {
    setIsNewUser(true)
    setEditingUserId(null)
    setUserForm({
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      roleId: "system_requester",
      avatarUrl: "",
      color: "#3b82f6",
      isActive: true,
    })
    setUserSheetOpen(true)
  }

  const openEditUser = (user: UserRow) => {
    setIsNewUser(false)
    setEditingUserId(user.id)
    setUserForm({
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      email: user.email,
      password: "",
      roleId: resolveUserRoleId(user),
      avatarUrl: user.avatarUrl || "",
      color: user.color || "#3b82f6",
      isActive: user.isActive,
    })
    setUserSheetOpen(true)
  }

  const togglePerm = (id: string) => {
    setRolePerms((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
    )
  }

  const handleSaveRole = async () => {
    if (!roleName.trim()) return
    try {
      if (editingRoleId === "new") {
        await createRole(roleName, roleDesc, rolePerms, roleIcon)
      } else if (editingRoleId) {
        await updateRole(editingRoleId, roleName, roleDesc, rolePerms, roleIcon)
      }
      setRoleSheetOpen(false)
      setEditingRoleId(null)
    } catch (e: unknown) {
      await showAlert(e instanceof Error ? e.message : "Kayıt başarısız")
    }
  }

  const handleDeleteRole = async (id: string) => {
    try {
      if (await showConfirm("Bu rolü silmek istediğinize emin misiniz?")) {
        await deleteRole(id)
        if (editingRoleId === id) {
          setRoleSheetOpen(false)
          setEditingRoleId(null)
        }
      }
    } catch (e: unknown) {
      await showAlert(e instanceof Error ? e.message : "Silme başarısız")
    }
  }

  const handleAssignRole = async (userId: string, roleId: string) => {
    try {
      await assignUserRole(userId, roleId)
    } catch (e: unknown) {
      await showAlert(
        `Rol atanırken bir hata oluştu: ${e instanceof Error ? e.message : ""}`,
      )
    }
  }

  const handleSaveUser = async () => {
    if (!userForm.firstName.trim() || !userForm.lastName.trim()) {
      await showAlert("Ad ve soyad zorunludur.")
      return
    }
    if (!userForm.email.trim()) {
      await showAlert("E-posta adresi zorunludur.")
      return
    }
    if (isNewUser && !userForm.password) {
      await showAlert("Lütfen tüm alanları doldurun.")
      return
    }
    try {
      if (isNewUser) {
        await createUser({
          firstName: userForm.firstName,
          lastName: userForm.lastName,
          email: userForm.email,
          password: userForm.password,
          roleId: userForm.roleId,
        })
      } else if (editingUserId) {
        await updateUser(editingUserId, userForm)
      }
      setUserSheetOpen(false)
    } catch (e: unknown) {
      await showAlert(e instanceof Error ? e.message : "Kayıt başarısız")
    }
  }

  const handleToggleStatus = async () => {
    if (
      await showConfirm(
        userForm.isActive
          ? "Kullanıcıyı dondurmak istediğinize emin misiniz? Sisteme giriş yapamayacak."
          : "Kullanıcıyı tekrar aktifleştirmek istediğinize emin misiniz?",
      )
    ) {
      try {
        await toggleUserStatus(editingUserId!, !userForm.isActive)
        setUserSheetOpen(false)
      } catch (e: unknown) {
        await showAlert(e instanceof Error ? e.message : "İşlem başarısız")
      }
    }
  }

  const handleDeleteUser = async () => {
    if (
      await showConfirm(
        "Kullanıcıyı tamamen silmek istediğinize emin misiniz? Önerilen yöntem kullanıcıyı dondurmaktır.",
      )
    ) {
      try {
        await deleteUserAction(editingUserId!)
        setUserSheetOpen(false)
      } catch (e: unknown) {
        await showAlert(e instanceof Error ? e.message : "Silme başarısız")
      }
    }
  }

  const handleResetPassword = async (user: UserRow) => {
    const temporaryPassword = resetPasswordHint()
    if (
      !(await showConfirm(
        `${getUserDisplayName(user)} için şifre sıfırlansın mı?\n\nGeçici şifre: ${temporaryPassword}\n\nBu şifreyi kullanıcıya iletin. İlk girişte yeni şifre belirlemesi istenecek.`,
      ))
    ) {
      return
    }

    setResettingUserId(user.id)
    try {
      const result = await resetUserPassword(user.id)
      if (!result.ok) {
        await showAlert(result.error)
        return
      }
      await showAlert(
        `Şifre sıfırlandı.\n\nGeçici şifre: ${result.temporaryPassword}\n\nKullanıcı: ${user.email}`,
      )
    } catch {
      await showAlert("Şifre sıfırlanamadı. Lütfen tekrar deneyin.")
    } finally {
      setResettingUserId(null)
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Card size="sm" className="rounded-2xl">
          <CardContent className="flex items-center gap-3 pt-0">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
              <Shield className="size-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-semibold">{roles.length}</p>
              <p className="text-xs text-muted-foreground">Toplam rol</p>
            </div>
          </CardContent>
        </Card>
        <Card size="sm" className="rounded-2xl">
          <CardContent className="flex items-center gap-3 pt-0">
            <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/10">
              <Users className="size-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-2xl font-semibold">{users.length}</p>
              <p className="text-xs text-muted-foreground">Kayıtlı kullanıcı</p>
            </div>
          </CardContent>
        </Card>
        <Card size="sm" className="rounded-2xl">
          <CardContent className="flex items-center gap-3 pt-0">
            <div className="flex size-10 items-center justify-center rounded-xl bg-amber-500/10">
              <Key className="size-5 text-amber-500" />
            </div>
            <div>
              <p className="text-2xl font-semibold">
                {availablePermissions.length}
              </p>
              <p className="text-xs text-muted-foreground">Yetki tanımı</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <TabsList>
            <TabsTrigger value="roles">
              <Shield className="size-4" />
              Roller
            </TabsTrigger>
            <TabsTrigger value="users">
              <Users className="size-4" />
              Kullanıcılar
            </TabsTrigger>
          </TabsList>

          {activeTab === "roles" ? (
            <Button onClick={openNewRole}>
              <Plus />
              Yeni Rol
            </Button>
          ) : (
            <Button onClick={openNewUser}>
              <UserPlus />
              Yeni Kullanıcı
            </Button>
          )}
        </div>

        <TabsContent value="roles" className="mt-6">
          {roles.length === 0 ? (
            <Card className="rounded-2xl">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <Shield className="mb-3 size-10 text-muted-foreground/50" />
                <p className="font-medium">Henüz özel rol yok</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  İlk özel rolünüzü oluşturarak başlayın.
                </p>
                <Button className="mt-4" onClick={openNewRole}>
                  <Plus />
                  Rol Oluştur
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {roles.map((role) => {
                const permCount = role.permissions?.length || 0
                const userCount = role._count?.users || 0
                const visiblePerms = (role.permissions || []).slice(0, 3)

                return (
                  <Card
                    key={role.id}
                    className="cursor-pointer rounded-2xl transition-shadow hover:shadow-lg"
                    onClick={() => openEditRole(role)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              "flex size-10 items-center justify-center rounded-xl",
                              role.isSystem
                                ? "bg-violet-500/10 text-violet-500"
                                : "bg-primary/10 text-primary",
                            )}
                          >
                            <RoleIcon name={role.icon} className="size-5" />
                          </div>
                          <div>
                            <CardTitle className="text-base">
                              {role.name}
                            </CardTitle>
                            {role.description ? (
                              <CardDescription className="line-clamp-1">
                                {role.description}
                              </CardDescription>
                            ) : null}
                          </div>
                        </div>
                        {role.isSystem ? (
                          <Badge
                            variant="secondary"
                            className="shrink-0 gap-1 bg-violet-500/10 text-violet-500"
                          >
                            <Crown className="size-3" />
                            Sistem
                          </Badge>
                        ) : (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            className="shrink-0 text-muted-foreground hover:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteRole(role.id)
                            }}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        )}
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-3">
                      {permCount > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {visiblePerms.map((pId) => {
                            const perm = availablePermissions.find(
                              (ap) => ap.id === pId,
                            )
                            return perm ? (
                              <Badge key={pId} variant="outline">
                                {perm.label}
                              </Badge>
                            ) : null
                          })}
                          {permCount > 3 ? (
                            <Badge variant="secondary">
                              +{permCount - 3} daha
                            </Badge>
                          ) : null}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground italic">
                          Yetki atanmamış
                        </p>
                      )}
                    </CardContent>

                    <CardFooter className="justify-between border-t pt-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <User className="size-3.5" />
                        {userCount} kullanıcı
                      </span>
                      <span>{permCount} yetki</span>
                    </CardFooter>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="users" className="mt-6">
          <Card className="overflow-hidden rounded-2xl">
            <CardHeader className="border-b pb-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle>Kullanıcı Yönetimi</CardTitle>
                  <CardDescription>
                    Kullanıcılara rol atayın ve hesap ayarlarını düzenleyin
                  </CardDescription>
                </div>
                <div className="relative w-full sm:w-72">
                  <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="Ad, soyad veya e-posta ara..."
                    className="pl-9"
                  />
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kullanıcı</TableHead>
                    <TableHead>Telegram</TableHead>
                    <TableHead>Şifre</TableHead>
                    <TableHead className="w-55">Rol</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => {
                    const currentRoleId = resolveUserRoleId(user)
                    return (
                      <TableRow
                        key={user.id}
                        className="cursor-pointer"
                        onClick={() => openEditUser(user)}
                      >
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar size="sm">
                              {user.avatarUrl ? (
                                <AvatarImage
                                  src={user.avatarUrl}
                                  alt={getUserDisplayName(user)}
                                />
                              ) : null}
                              <AvatarFallback
                                className="text-xs font-semibold"
                                style={getUserColorStyles(user.color)}
                              >
                                {getUserInitial(user)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p
                                className={cn(
                                  "truncate font-medium",
                                  !user.isActive &&
                                    "text-muted-foreground line-through",
                                )}
                              >
                                {getUserDisplayName(user)}
                              </p>
                              <p className="truncate text-xs text-muted-foreground">
                                {user.email}
                              </p>
                              {!user.isActive ? (
                                <Badge
                                  variant="destructive"
                                  className="mt-1 h-5 text-[10px]"
                                >
                                  Askıda
                                </Badge>
                              ) : null}
                              {user.isSuperAdmin ? (
                                <Badge
                                  className="mt-1 h-5 border-amber-500/30 bg-amber-500/10 text-[10px] text-amber-400"
                                >
                                  <Crown className="mr-1 size-3" /> Süper Admin
                                </Badge>
                              ) : null}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {user.telegramUserId ? (
                            <span className="text-xs text-green-500">
                              {user.telegramUsername
                                ? `@${user.telegramUsername}`
                                : "Bağlı"}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              Bağlı değil
                            </span>
                          )}
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-8 gap-1.5"
                            disabled={resettingUserId === user.id}
                            onClick={() => void handleResetPassword(user)}
                          >
                            <Key className="size-3.5" />
                            {resettingUserId === user.id
                              ? "Sıfırlanıyor..."
                              : "Şifre Sıfırla"}
                          </Button>
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <select
                            value={currentRoleId}
                            onChange={(e) =>
                              handleAssignRole(user.id, e.target.value)
                            }
                            className="h-8 w-full rounded-2xl border border-transparent bg-input/50 px-3 text-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
                          >
                            {roles.map((r) => (
                              <option key={r.id} value={r.id}>
                                {r.isSystem ? `${r.name} (Sistem)` : r.name}
                              </option>
                            ))}
                          </select>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>

              {filteredUsers.length === 0 ? (
                <div className="py-12 text-center text-sm text-muted-foreground">
                  {userSearch
                    ? "Aramanızla eşleşen kullanıcı bulunamadı."
                    : "Kullanıcı bulunamadı."}
                </div>
              ) : null}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Sheet open={roleSheetOpen} onOpenChange={setRoleSheetOpen}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>
              {editingRoleId === "new" ? "Yeni Rol" : "Rolü Düzenle"}
            </SheetTitle>
            <SheetDescription>
              Rol adı, ikon ve yetkileri yapılandırın
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-6 px-4 pb-4">
            <div className="space-y-2">
              <Label htmlFor="role-name">Rol Adı</Label>
              <Input
                id="role-name"
                value={roleName}
                onChange={(e) => setRoleName(e.target.value)}
                placeholder="Örn: Proje Yöneticisi"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role-desc">Açıklama</Label>
              <Input
                id="role-desc"
                value={roleDesc}
                onChange={(e) => setRoleDesc(e.target.value)}
                placeholder="İsteğe bağlı"
              />
            </div>

            <div className="space-y-3">
              <Label>İkon</Label>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_ICONS.map((iconName) => {
                  const IconComponent = ICONS[iconName]
                  const selected = roleIcon === iconName
                  return (
                    <button
                      key={iconName}
                      type="button"
                      onClick={() => setRoleIcon(iconName)}
                      className={cn(
                        "flex size-10 items-center justify-center rounded-xl border transition-colors",
                        selected
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-muted/30 text-muted-foreground hover:bg-muted",
                      )}
                    >
                      <IconComponent className="size-4" />
                    </button>
                  )
                })}
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <Label>Yetkiler</Label>
              <div className="space-y-2">
                {availablePermissions.map((perm) => {
                  const checked = rolePerms.includes(perm.id)
                  return (
                    <label
                      key={perm.id}
                      className={cn(
                        "flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-colors",
                        checked
                          ? "border-primary/30 bg-primary/5"
                          : "border-border hover:bg-muted/40",
                      )}
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={() => togglePerm(perm.id)}
                      />
                      <span className="text-sm">{perm.label}</span>
                    </label>
                  )
                })}
              </div>
            </div>
          </div>

          <SheetFooter className="gap-3 border-t">
            <div className="grid w-full grid-cols-2 gap-2">
              <Button variant="outline" className="w-full" onClick={() => setRoleSheetOpen(false)}>
                İptal
              </Button>
              <Button className="w-full" onClick={handleSaveRole}>
                <Save className="size-4" />
                {editingRoleId === "new" ? "Oluştur" : "Kaydet"}
              </Button>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <Sheet open={userSheetOpen} onOpenChange={setUserSheetOpen}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>
              {isNewUser ? "Yeni Kullanıcı" : "Kullanıcıyı Düzenle"}
            </SheetTitle>
            <SheetDescription>
              Hesap bilgileri ve rol ataması
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-5 px-4 pb-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="user-first-name">Ad</Label>
                <Input
                  id="user-first-name"
                  value={userForm.firstName}
                  onChange={(e) =>
                    setUserForm({ ...userForm, firstName: e.target.value })
                  }
                  placeholder="Ahmet"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="user-last-name">Soyad</Label>
                <Input
                  id="user-last-name"
                  value={userForm.lastName}
                  onChange={(e) =>
                    setUserForm({ ...userForm, lastName: e.target.value })
                  }
                  placeholder="Yılmaz"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="user-email">E-posta</Label>
              <Input
                id="user-email"
                type="email"
                value={userForm.email}
                onChange={(e) =>
                  setUserForm({ ...userForm, email: e.target.value })
                }
                placeholder="kullanici@sirket.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="user-password">
                {isNewUser ? "Şifre" : "Yeni Şifre (isteğe bağlı)"}
              </Label>
              <Input
                id="user-password"
                type="password"
                value={userForm.password}
                onChange={(e) =>
                  setUserForm({ ...userForm, password: e.target.value })
                }
                placeholder={isNewUser ? "" : "Değiştirmek için girin"}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="user-role">Rol</Label>
              <select
                id="user-role"
                value={userForm.roleId}
                onChange={(e) =>
                  setUserForm({ ...userForm, roleId: e.target.value })
                }
                className="h-9 w-full rounded-3xl border border-transparent bg-input/50 px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
              >
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.isSystem ? `${r.name} (Sistem)` : r.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label>Profil Rengi</Label>
              <div className="flex flex-wrap gap-2">
                {USER_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setUserForm({ ...userForm, color })}
                    className={cn(
                      "size-8 rounded-full border-2 transition-transform",
                      userForm.color === color
                        ? "scale-110 border-foreground"
                        : "border-transparent hover:scale-105",
                    )}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="user-avatar">Profil Resmi URL</Label>
              <Input
                id="user-avatar"
                value={userForm.avatarUrl}
                onChange={(e) =>
                  setUserForm({ ...userForm, avatarUrl: e.target.value })
                }
                placeholder="https://..."
              />
              <div className="flex items-center gap-3 pt-2">
                <span className="text-xs text-muted-foreground">Önizleme</span>
                <Avatar>
                  {userForm.avatarUrl ? (
                    <AvatarImage
                      src={userForm.avatarUrl}
                      alt={userForm.email}
                    />
                  ) : null}
                  <AvatarFallback
                    className="text-xl font-semibold"
                    style={getUserColorStyles(userForm.color)}
                  >
                    {getUserInitial(userForm)}
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>
          </div>

          <SheetFooter className="gap-3 border-t">
            {!isNewUser ? (
              <div className="grid w-full grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={handleToggleStatus}
                >
                  {userForm.isActive ? (
                    <>
                      <Ban className="size-4" />
                      Dondur
                    </>
                  ) : (
                    <>
                      <Check className="size-4" />
                      Aktifleştir
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  className="w-full"
                  onClick={handleDeleteUser}
                >
                  <UserMinus className="size-4" />
                  Sil
                </Button>
              </div>
            ) : null}
            {!isNewUser && callerIsSuperAdmin ? (
              <Button
                type="button"
                variant="outline"
                className={cn(
                  "w-full",
                  editingUser?.isSuperAdmin
                    ? "border-amber-500/30 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20"
                    : "border-border"
                )}
                onClick={async () => {
                  if (!editingUserId) return
                  const action = editingUser?.isSuperAdmin ? "kaldırmak" : "yapmak"
                  const ok = await showConfirm(`Bu kullanıcıyı süper admin ${action} istediğinize emin misiniz?`)
                  if (!ok) return
                  try {
                    await toggleSuperAdmin(editingUserId)
                    await showAlert(editingUser?.isSuperAdmin ? "Süper admin yetkisi kaldırıldı." : "Süper admin yetkisi verildi.")
                    window.location.reload()
                  } catch (err: any) {
                    await showAlert(err.message ?? "İşlem başarısız")
                  }
                }}
              >
                <Crown className="size-4" />
                {editingUser?.isSuperAdmin ? "Süper Admin Kaldır" : "Süper Admin Yap"}
              </Button>
            ) : null}
            <div className="grid w-full grid-cols-2 gap-2">
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => setUserSheetOpen(false)}
              >
                İptal
              </Button>
              <Button type="button" className="w-full" onClick={handleSaveUser}>
                <Save className="size-4" />
                {isNewUser ? "Kullanıcı Ekle" : "Kaydet"}
              </Button>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}
