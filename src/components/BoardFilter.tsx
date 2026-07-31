"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { Filter, X } from "lucide-react"
import { getUserDisplayName, getUserInitial } from "@/lib/user"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

export default function BoardFilter({
  members,
  currentUserId,
}: {
  members: any[]
  currentUserId: string
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isOpen, setIsOpen] = useState(false)

  const [keyword, setKeyword] = useState(searchParams.get("keyword") || "")
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>(
    searchParams.get("assignees")
      ? searchParams.get("assignees")!.split(",")
      : [],
  )
  const [noMembers, setNoMembers] = useState(
    searchParams.get("noMembers") === "true",
  )

  const isFirstRender = useRef(true)

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }

    const params = new URLSearchParams(searchParams.toString())
    let changed = false

    if (keyword.trim()) {
      if (params.get("keyword") !== keyword.trim()) {
        params.set("keyword", keyword.trim())
        changed = true
      }
    } else if (params.has("keyword")) {
      params.delete("keyword")
      changed = true
    }

    const newAssignees = selectedAssignees.join(",")
    if (newAssignees) {
      if (params.get("assignees") !== newAssignees) {
        params.set("assignees", newAssignees)
        changed = true
      }
    } else if (params.has("assignees")) {
      params.delete("assignees")
      changed = true
    }

    if (noMembers) {
      if (params.get("noMembers") !== "true") {
        params.set("noMembers", "true")
        changed = true
      }
    } else if (params.has("noMembers")) {
      params.delete("noMembers")
      changed = true
    }

    if (changed) {
      router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    }
  }, [keyword, selectedAssignees, noMembers, router, searchParams, pathname])

  const toggleAssignee = (userId: string) => {
    setSelectedAssignees((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId],
    )
  }

  const activeFilterCount =
    (keyword ? 1 : 0) +
    (selectedAssignees.length > 0 ? 1 : 0) +
    (noMembers ? 1 : 0)

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "gap-2",
              activeFilterCount > 0 && "border-primary/40 bg-primary/5 text-primary",
            )}
          />
        }
      >
        <Filter className="size-4" />
        Filtre
        {activeFilterCount > 0 ? (
          <Badge variant="secondary" className="h-5 min-w-5 px-1.5 text-[10px]">
            {activeFilterCount}
          </Badge>
        ) : null}
      </PopoverTrigger>

      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h3 className="text-sm font-semibold text-foreground">Filtre</h3>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => setIsOpen(false)}
          >
            <X className="size-4" />
          </Button>
        </div>

        <div className="space-y-5 p-4">
          <div>
            <Label className="text-xs uppercase">Anahtar sözcük</Label>
            <Input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Bir anahtar sözcük girin..."
              className="mt-2"
            />
            <p className="mt-1.5 text-[11px] text-muted-foreground">
              Kartlar, üyeler, etiketler ve daha fazlasını arayın.
            </p>
          </div>

          <div>
            <Label className="text-xs uppercase">Üyeler</Label>
            <div className="mt-2 space-y-1">
              <label className="flex cursor-pointer items-center gap-3 rounded-lg p-1.5 hover:bg-accent">
                <Checkbox
                  checked={noMembers}
                  onCheckedChange={(v) => setNoMembers(!!v)}
                />
                <div className="flex size-6 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <Filter className="size-3" />
                </div>
                <span className="text-sm text-muted-foreground">Üye Yok</span>
              </label>

              <label className="flex cursor-pointer items-center gap-3 rounded-lg p-1.5 hover:bg-accent">
                <Checkbox
                  checked={selectedAssignees.includes(currentUserId)}
                  onCheckedChange={() => toggleAssignee(currentUserId)}
                />
                <Avatar className="size-6">
                  <AvatarFallback className="bg-primary/20 text-[10px] font-bold text-primary">
                    BEN
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm text-muted-foreground">
                  Bana atanmış kartlar
                </span>
              </label>

              {members
                .filter((m) => m.user.id !== currentUserId)
                .map((member) => (
                  <label
                    key={member.user.id}
                    className="flex cursor-pointer items-center gap-3 rounded-lg p-1.5 hover:bg-accent"
                  >
                    <Checkbox
                      checked={selectedAssignees.includes(member.user.id)}
                      onCheckedChange={() => toggleAssignee(member.user.id)}
                    />
                    <Avatar className="size-6">
                      <AvatarFallback className="bg-primary/20 text-[10px] font-bold text-primary">
                        {getUserInitial(member.user)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-muted-foreground">
                      {getUserDisplayName(member.user)}
                    </span>
                  </label>
                ))}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
