"use client"

import { useMemo, useState } from "react"
import {
  CheckCircle2,
  Copy,
  Link2,
  Loader2,
  Search,
  Unlink,
  UserPlus,
  Users,
} from "lucide-react"
import {
  adminGenerateTelegramLinkCodeForUser,
  adminLinkTelegramAccount,
  adminLookupTelegramUser,
  adminUnlinkTelegramAccount,
  type TelegramUserMapping,
} from "@/app/actions/telegramActions"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { getUserDisplayName, getUserInitial } from "@/lib/user"
import { cn } from "@/lib/utils"

type FilterMode = "all" | "linked" | "unlinked"

export default function TelegramUserMappingPanel({
  users: initialUsers,
  botUsername,
}: {
  users: TelegramUserMapping[]
  botUsername: string | null
}) {
  const [users, setUsers] = useState(initialUsers)
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<FilterMode>("all")
  const [message, setMessage] = useState<string | null>(null)
  const [busyUserId, setBusyUserId] = useState<string | null>(null)
  const [generatedCodes, setGeneratedCodes] = useState<
    Record<string, { code: string; expiresAt: string }>
  >({})

  const [linkUser, setLinkUser] = useState<TelegramUserMapping | null>(null)
  const [lookupQuery, setLookupQuery] = useState("")
  const [lookupResult, setLookupResult] = useState<{
    telegramUserId: string
    username: string | null
    alreadyLinkedTo: {
      id: string
      email: string
      firstName: string | null
      lastName: string | null
    } | null
  } | null>(null)
  const [lookupLoading, setLookupLoading] = useState(false)
  const [linkLoading, setLinkLoading] = useState(false)

  const linkedCount = users.filter((u) => u.telegramUserId).length

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase()
    return users.filter((user) => {
      if (filter === "linked" && !user.telegramUserId) return false
      if (filter === "unlinked" && user.telegramUserId) return false
      if (!q) return true
      const name = getUserDisplayName(user).toLowerCase()
      const telegram = user.telegramUsername?.toLowerCase() ?? ""
      return (
        name.includes(q) ||
        user.email.toLowerCase().includes(q) ||
        telegram.includes(q) ||
        user.telegramUserId?.includes(q)
      )
    })
  }, [users, search, filter])

  const updateUserInList = (userId: string, patch: Partial<TelegramUserMapping>) => {
    setUsers((prev) =>
      prev.map((user) => (user.id === userId ? { ...user, ...patch } : user)),
    )
  }

  const handleGenerateCode = async (user: TelegramUserMapping) => {
    setBusyUserId(user.id)
    setMessage(null)
    try {
      const result = await adminGenerateTelegramLinkCodeForUser(user.id)
      const pending = { code: result.code, expiresAt: result.expiresAt }
      setGeneratedCodes((prev) => ({ ...prev, [user.id]: pending }))
      updateUserInList(user.id, { pendingLinkCode: pending })
      setMessage(
        `${getUserDisplayName(user)} için bağlantı kodu oluşturuldu. Kullanıcıya /start ${result.code} göndermesini söyleyin.`,
      )
    } catch (e: unknown) {
      setMessage(e instanceof Error ? e.message : "Kod oluşturulamadı")
    } finally {
      setBusyUserId(null)
    }
  }

  const handleUnlink = async (user: TelegramUserMapping) => {
    setBusyUserId(user.id)
    setMessage(null)
    try {
      await adminUnlinkTelegramAccount(user.id)
      updateUserInList(user.id, {
        telegramUserId: null,
        telegramUsername: null,
        mtprotoLinked: false,
        pendingLinkCode: null,
      })
      setGeneratedCodes((prev) => {
        const next = { ...prev }
        delete next[user.id]
        return next
      })
      setMessage(`${getUserDisplayName(user)} için Telegram bağlantısı kaldırıldı.`)
    } catch (e: unknown) {
      setMessage(e instanceof Error ? e.message : "Bağlantı kaldırılamadı")
    } finally {
      setBusyUserId(null)
    }
  }

  const openLinkSheet = (user: TelegramUserMapping) => {
    setLinkUser(user)
    setLookupQuery("")
    setLookupResult(null)
    setMessage(null)
  }

  const handleLookup = async () => {
    if (!lookupQuery.trim()) return
    setLookupLoading(true)
    setLookupResult(null)
    setMessage(null)
    try {
      const result = await adminLookupTelegramUser(lookupQuery)
      setLookupResult(result)
    } catch (e: unknown) {
      setMessage(e instanceof Error ? e.message : "Kullanıcı bulunamadı")
    } finally {
      setLookupLoading(false)
    }
  }

  const handleConfirmLink = async () => {
    if (!linkUser || !lookupResult) return
    if (lookupResult.alreadyLinkedTo && lookupResult.alreadyLinkedTo.id !== linkUser.id) {
      setMessage("Bu Telegram hesabı başka bir Zubee kullanıcısına bağlı")
      return
    }

    setLinkLoading(true)
    setMessage(null)
    try {
      await adminLinkTelegramAccount(
        linkUser.id,
        lookupResult.telegramUserId,
        lookupResult.username,
      )
      updateUserInList(linkUser.id, {
        telegramUserId: lookupResult.telegramUserId,
        telegramUsername: lookupResult.username,
        pendingLinkCode: null,
      })
      setMessage(`${getUserDisplayName(linkUser)} Telegram ile eşleştirildi.`)
      setLinkUser(null)
      setLookupResult(null)
    } catch (e: unknown) {
      setMessage(e instanceof Error ? e.message : "Eşleştirme başarısız")
    } finally {
      setLinkLoading(false)
    }
  }

  const copyStartCommand = async (code: string) => {
    const command = `/start ${code}`
    try {
      await navigator.clipboard.writeText(command)
      setMessage("Komut panoya kopyalandı.")
    } catch {
      setMessage(command)
    }
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border/40 bg-card/40 p-6 shadow-xl backdrop-blur-xl transition-all dark:bg-card/20">
      {/* Decorative gradient */}
      <div className="absolute -left-20 -top-20 z-0 size-64 rounded-full bg-blue-500/5 blur-[100px]" />
      
      <div className="relative z-10 mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex size-12 items-center justify-center rounded-xl bg-linear-to-br from-blue-500/20 to-blue-500/5 ring-1 ring-blue-500/20 shadow-inner">
            <Users className="size-6 text-blue-500 -ml-0.5 mt-0.5" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight">Kullanıcı Eşleştirme</h2>
            <p className="text-sm font-medium text-muted-foreground/80">
              Zubee hesaplarını Telegram kullanıcılarıyla eşleştirin
            </p>
          </div>
        </div>
      </div>

      <div className="relative z-10 mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="outline" className="h-7 border-blue-500/20 bg-blue-500/10 px-3 text-blue-600 dark:text-blue-400">
            {linkedCount} / {users.length} Bağlı
          </Badge>
          {botUsername ? (
            <Badge variant="secondary" className="h-7 bg-muted/50 px-3 text-muted-foreground">
              @{botUsername}
            </Badge>
          ) : null}
        </div>
        
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
          <div className="flex rounded-lg bg-muted/40 p-1">
            {(
              [
                ["all", "Tümü"],
                ["linked", "Bağlı"],
                ["unlinked", "Bağlı Değil"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setFilter(value)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-xs font-medium transition-all",
                  filter === value
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Ara..."
              className="pl-9 h-9 bg-background/50 backdrop-blur-sm"
            />
          </div>
        </div>
      </div>

      <div className="relative z-10 space-y-3">
        {filteredUsers.map((user) => {
          const pendingCode =
            generatedCodes[user.id] ?? user.pendingLinkCode ?? null
          const isBusy = busyUserId === user.id

          return (
            <div
              key={user.id}
              className="group flex flex-col gap-4 rounded-xl border border-border/40 bg-card/40 p-4 shadow-sm backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-border/80 hover:bg-card/80 hover:shadow-md dark:bg-card/20 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex min-w-0 items-center gap-4">
                <Avatar size="sm" className="size-10 border-2 border-background shadow-sm transition-transform group-hover:scale-105">
                  {user.avatarUrl ? (
                    <AvatarImage
                      src={user.avatarUrl}
                      alt={getUserDisplayName(user)}
                    />
                  ) : null}
                  <AvatarFallback
                    className="text-xs font-bold text-white shadow-inner"
                    style={{ backgroundColor: user.color || "#3b82f6" }}
                  >
                    {getUserInitial(user)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p
                    className={cn(
                      "truncate font-semibold tracking-tight",
                      !user.isActive && "text-muted-foreground line-through",
                    )}
                  >
                    {getUserDisplayName(user)}
                  </p>
                  <p className="truncate text-xs font-medium text-muted-foreground/80">
                    {user.email}
                  </p>
                  {user.telegramUserId ? (
                    <div className="mt-1.5 flex flex-wrap items-center gap-2">
                      <span className="flex items-center gap-1 rounded-md bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="size-3" />
                        {user.telegramUsername
                          ? `@${user.telegramUsername}`
                          : `ID: ${user.telegramUserId}`}
                      </span>
                      {user.mtprotoLinked ? (
                        <Badge
                          variant="secondary"
                          className="h-5 px-1.5 text-[9px] bg-blue-500/10 text-blue-600 dark:text-blue-400 border-none"
                        >
                          MTProto
                        </Badge>
                      ) : null}
                    </div>
                  ) : (
                    <p className="mt-1.5 flex items-center gap-1 text-[10px] font-semibold text-amber-500/80">
                      <span className="size-1.5 rounded-full bg-amber-500/50" />
                      Bağlı değil
                    </p>
                  )}
                  {pendingCode ? (
                    <div className="mt-2.5 flex flex-wrap items-center gap-2">
                      <code className="rounded-md bg-primary/10 px-2 py-1 font-mono text-[10px] font-semibold text-primary ring-1 ring-primary/20">
                        /start {pendingCode.code}
                      </code>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        className="h-6 w-6 rounded-md hover:bg-primary/20 hover:text-primary"
                        onClick={() => copyStartCommand(pendingCode.code)}
                      >
                        <Copy className="size-3" />
                      </Button>
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="flex flex-wrap gap-2 sm:shrink-0">
                {!user.telegramUserId ? (
                  <>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={isBusy}
                      onClick={() => handleGenerateCode(user)}
                      className="bg-background/50 shadow-sm transition-all hover:bg-muted"
                    >
                      {isBusy ? (
                        <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                      ) : (
                        <UserPlus className="mr-1.5 size-3.5" />
                      )}
                      Kod oluştur
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={isBusy}
                      onClick={() => openLinkSheet(user)}
                      className="bg-background/50 shadow-sm transition-all hover:bg-muted"
                    >
                      <Link2 className="mr-1.5 size-3.5" />
                      Manuel bağla
                    </Button>
                  </>
                ) : (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={isBusy}
                    onClick={() => handleUnlink(user)}
                    className="border-destructive/20 text-destructive hover:bg-destructive/10 hover:text-destructive shadow-sm transition-all"
                  >
                    {isBusy ? (
                      <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                    ) : (
                      <Unlink className="mr-1.5 size-3.5" />
                    )}
                    Bağlantıyı kaldır
                  </Button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {filteredUsers.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          Eşleşen kullanıcı bulunamadı.
        </p>
      ) : null}

      <p className="mt-4 text-xs text-muted-foreground">
        Kullanıcı kendi hesabını Ayarlar → Telegram üzerinden de bağlayabilir.
        Yönetici olarak kod oluşturup{" "}
        {botUsername ? `@${botUsername}` : "bota"}{" "}
        <code className="rounded bg-muted px-1">/start KOD</code> göndermesini
        isteyebilir veya Telegram kullanıcı adı / ID ile manuel eşleştirebilirsiniz.
      </p>

      {message ? (
        <p className="mt-4 text-sm text-muted-foreground">{message}</p>
      ) : null}

      <Sheet
        open={Boolean(linkUser)}
        onOpenChange={(open) => {
          if (!open) {
            setLinkUser(null)
            setLookupResult(null)
          }
        }}
      >
        <SheetContent className="overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Manuel Telegram eşleştirme</SheetTitle>
            <SheetDescription>
              {linkUser
                ? `${getUserDisplayName(linkUser)} hesabını bir Telegram kullanıcısıyla eşleştirin.`
                : ""}
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-4 px-4">
            <div className="space-y-2">
              <Label htmlFor="telegram-lookup">Telegram kullanıcı adı veya ID</Label>
              <div className="flex gap-2">
                <Input
                  id="telegram-lookup"
                  value={lookupQuery}
                  onChange={(e) => setLookupQuery(e.target.value)}
                  placeholder="@kullanici veya 123456789"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      void handleLookup()
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  disabled={lookupLoading || !lookupQuery.trim()}
                  onClick={() => void handleLookup()}
                >
                  {lookupLoading ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Search className="size-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Kullanıcının süper grupta olduğundan emin olun. Bot, gruptaki
                üyeleri doğrulayabilir.
              </p>
            </div>

            {lookupResult ? (
              <div className="rounded-lg border border-border/60 bg-muted/30 p-3 text-sm">
                <p className="font-medium">
                  {lookupResult.username
                    ? `@${lookupResult.username}`
                    : `ID ${lookupResult.telegramUserId}`}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Telegram ID: {lookupResult.telegramUserId}
                </p>
                {lookupResult.alreadyLinkedTo &&
                lookupResult.alreadyLinkedTo.id !== linkUser?.id ? (
                  <p className="mt-2 text-xs text-destructive">
                    Bu hesap zaten{" "}
                    {getUserDisplayName(lookupResult.alreadyLinkedTo)} ile
                    bağlı.
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>

          <SheetFooter>
            <Button
              type="button"
              disabled={
                !lookupResult ||
                linkLoading ||
                Boolean(
                  lookupResult?.alreadyLinkedTo &&
                    lookupResult.alreadyLinkedTo.id !== linkUser?.id,
                )
              }
              onClick={() => void handleConfirmLink()}
            >
              {linkLoading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Link2 className="size-4" />
              )}
              Eşleştir
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}
