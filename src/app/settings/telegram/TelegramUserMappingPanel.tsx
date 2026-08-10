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
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
          <Users className="size-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">Kullanıcı Eşleştirme</h2>
          <p className="text-sm text-muted-foreground">
            Zubee hesaplarını Telegram kullanıcılarıyla eşleştirin
          </p>
        </div>
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">
            {linkedCount}/{users.length} bağlı
          </Badge>
          {botUsername ? (
            <Badge variant="secondary">@{botUsername}</Badge>
          ) : null}
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Ad, e-posta veya @kullanıcı ara..."
            className="pl-9"
          />
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {(
          [
            ["all", "Tümü"],
            ["linked", "Bağlı"],
            ["unlinked", "Bağlı değil"],
          ] as const
        ).map(([value, label]) => (
          <Button
            key={value}
            type="button"
            size="sm"
            variant={filter === value ? "default" : "outline"}
            onClick={() => setFilter(value)}
          >
            {label}
          </Button>
        ))}
      </div>

      <div className="space-y-2">
        {filteredUsers.map((user) => {
          const pendingCode =
            generatedCodes[user.id] ?? user.pendingLinkCode ?? null
          const isBusy = busyUserId === user.id

          return (
            <div
              key={user.id}
              className="flex flex-col gap-3 rounded-lg border border-border/60 bg-muted/20 p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex min-w-0 items-center gap-3">
                <Avatar size="sm">
                  {user.avatarUrl ? (
                    <AvatarImage
                      src={user.avatarUrl}
                      alt={getUserDisplayName(user)}
                    />
                  ) : null}
                  <AvatarFallback
                    className="text-xs font-semibold text-white"
                    style={{ backgroundColor: user.color || "#3b82f6" }}
                  >
                    {getUserInitial(user)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p
                    className={cn(
                      "truncate font-medium",
                      !user.isActive && "text-muted-foreground line-through",
                    )}
                  >
                    {getUserDisplayName(user)}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {user.email}
                  </p>
                  {user.telegramUserId ? (
                    <p className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-green-500">
                      <CheckCircle2 className="size-3.5" />
                      {user.telegramUsername
                        ? `@${user.telegramUsername}`
                        : `ID ${user.telegramUserId}`}
                      {user.mtprotoLinked ? (
                        <Badge
                          variant="secondary"
                          className="h-5 text-[10px]"
                        >
                          MTProto
                        </Badge>
                      ) : null}
                    </p>
                  ) : (
                    <p className="mt-1 text-xs text-amber-500">Bağlı değil</p>
                  )}
                  {pendingCode ? (
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <code className="rounded bg-muted px-2 py-0.5 font-mono text-[11px]">
                        /start {pendingCode.code}
                      </code>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => copyStartCommand(pendingCode.code)}
                      >
                        <Copy className="size-3.5" />
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
                    >
                      {isBusy ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <UserPlus className="size-4" />
                      )}
                      Kod oluştur
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={isBusy}
                      onClick={() => openLinkSheet(user)}
                    >
                      <Link2 className="size-4" />
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
                  >
                    {isBusy ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Unlink className="size-4" />
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
