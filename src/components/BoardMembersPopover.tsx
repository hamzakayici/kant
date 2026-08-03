"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Plus, UserPlus, X } from "lucide-react"
import { addBoardMember, removeBoardMember } from "@/app/actions"
import {
  getUserDisplayName,
  getUserInitial,
  getUserColorStylesWithOpacity,
} from "@/lib/user"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

type BoardMember = {
  user: { id: string; email: string; firstName?: string | null; lastName?: string | null; color?: string | null }
}

type BoardUser = {
  id: string
  email: string
  firstName?: string | null
  lastName?: string | null
  color?: string | null
}

export default function BoardMembersPopover({
  boardId,
  members,
  allUsers,
  canManageMembers,
}: {
  boardId: string
  members: BoardMember[]
  allUsers: BoardUser[]
  canManageMembers: boolean
}) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const memberIds = new Set(members.map((m) => m.user.id))
  const normalizedQuery = query.trim().toLowerCase()

  const availableUsers = allUsers
    .filter((user) => !memberIds.has(user.id))
    .filter((user) => {
      if (!normalizedQuery) return true
      const name = getUserDisplayName(user).toLowerCase()
      return (
        name.includes(normalizedQuery) ||
        user.email.toLowerCase().includes(normalizedQuery)
      )
    })

  const handleAdd = (userId: string) => {
    setError(null)
    startTransition(async () => {
      try {
        await addBoardMember(boardId, userId)
        router.refresh()
      } catch (err) {
        setError(err instanceof Error ? err.message : "Üye eklenemedi")
      }
    })
  }

  const handleRemove = (userId: string) => {
    setError(null)
    startTransition(async () => {
      try {
        await removeBoardMember(boardId, userId)
        router.refresh()
      } catch (err) {
        setError(err instanceof Error ? err.message : "Üye kaldırılamadı")
      }
    })
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="outline"
            className="h-auto gap-2 px-2 py-1.5"
            title="Pano üyeleri"
          />
        }
      >
        <div className="flex -space-x-2">
          {members.slice(0, 4).map((member, index) => (
            <Avatar
              key={member.user.id}
              className="size-8 border-2 border-background"
              style={{ zIndex: 10 - index }}
            >
              <AvatarFallback
                className="text-[10px] font-bold"
                style={getUserColorStylesWithOpacity(member.user.color)}
              >
                {getUserInitial(member.user)}
              </AvatarFallback>
            </Avatar>
          ))}
          {members.length > 4 ? (
            <div className="flex size-8 items-center justify-center rounded-full border-2 border-background bg-muted text-[10px] font-semibold text-muted-foreground">
              +{members.length - 4}
            </div>
          ) : null}
        </div>
        {canManageMembers ? (
          <span className="flex size-8 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <UserPlus className="size-4" />
          </span>
        ) : null}
      </PopoverTrigger>

      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h3 className="text-sm font-semibold text-foreground">Pano üyeleri</h3>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => setIsOpen(false)}
          >
            <X className="size-4" />
          </Button>
        </div>

        <div className="space-y-4 p-4">
          <div>
            <p className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Mevcut üyeler ({members.length})
            </p>
            <div className="max-h-40 space-y-1 overflow-y-auto">
              {members.map((member) => (
                <div
                  key={member.user.id}
                  className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <Avatar className="size-7">
                      <AvatarFallback
                        className="text-[10px] font-bold"
                        style={getUserColorStylesWithOpacity(member.user.color)}
                      >
                        {getUserInitial(member.user)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="truncate text-sm text-foreground">
                      {getUserDisplayName(member.user)}
                    </span>
                  </div>
                  {canManageMembers && members.length > 1 ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      disabled={isPending}
                      onClick={() => handleRemove(member.user.id)}
                      title="Üyeyi kaldır"
                    >
                      <X className="size-3.5" />
                    </Button>
                  ) : null}
                </div>
              ))}
            </div>
          </div>

          {canManageMembers ? (
            <div>
              <p className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                Kişi ekle
              </p>
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="İsim veya e-posta ara..."
                className="mb-2"
              />
              <div className="max-h-48 space-y-1 overflow-y-auto">
                {availableUsers.length > 0 ? (
                  availableUsers.map((user) => (
                    <button
                      key={user.id}
                      type="button"
                      disabled={isPending}
                      onClick={() => handleAdd(user.id)}
                      className={cn(
                        "flex w-full items-center justify-between gap-2 rounded-lg px-2 py-2 text-left transition-colors hover:bg-accent",
                        isPending && "opacity-60",
                      )}
                    >
                      <div className="flex min-w-0 items-center gap-2">
                        <Avatar className="size-7">
                          <AvatarFallback
                            className="text-[10px] font-bold"
                            style={getUserColorStylesWithOpacity(user.color)}
                          >
                            {getUserInitial(user)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-foreground">
                            {getUserDisplayName(user)}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {user.email}
                          </p>
                        </div>
                      </div>
                      <Plus className="size-4 shrink-0 text-primary" />
                    </button>
                  ))
                ) : (
                  <p className="px-2 py-3 text-sm text-muted-foreground">
                    {normalizedQuery
                      ? "Eşleşen kullanıcı bulunamadı."
                      : "Eklenebilecek kullanıcı kalmadı."}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              Üye eklemek veya kaldırmak için pano yöneticisi olmanız gerekir.
            </p>
          )}

          {error ? (
            <p className="text-xs text-destructive">{error}</p>
          ) : null}
        </div>
      </PopoverContent>
    </Popover>
  )
}
