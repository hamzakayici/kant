"use client"

import { useState, useEffect } from "react"
import {
  AlertCircle,
  ArrowUp,
  Calendar,
  Check,
  CornerDownRight,
  LayoutGrid,
  Minus,
  Plus,
  Tag,
  User,
  X,
  Zap,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { tr } from "date-fns/locale"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { getUserDisplayName, getUserInitial, getUserColorStylesWithOpacity } from "@/lib/user"
import DatePickerPopover from "@/components/DatePickerPopover"

const priorities = [
  { value: "NONE", label: "Öncelik Yok", icon: Minus, color: "text-muted-foreground" },
  { value: "LOW", label: "Düşük", icon: CornerDownRight, color: "text-blue-400" },
  { value: "MEDIUM", label: "Orta", icon: ArrowUp, color: "text-yellow-400" },
  { value: "HIGH", label: "Yüksek", icon: AlertCircle, color: "text-orange-400" },
  { value: "URGENT", label: "Acil", icon: Zap, color: "text-red-400" },
]

type CardModalPropertiesProps = {
  card: any
  boardColumns: any[]
  boardMembers: any[]
  openDropdown: string | null
  setOpenDropdown: (value: string | null) => void
  onStatusChange: (colId: string) => void
  onAssigneeChange: (userId: string) => void
  onPriorityChange: (priority: string) => void
  onDateSave: (data: any) => void
  onDateRemove: () => void
  onTagsChange: (tags: string[]) => void
  canAssignAssignees?: boolean
}

function PropertyCell({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-muted/20 p-3">
      <p className="mb-2 text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
        {label}
      </p>
      {children}
    </div>
  )
}

export function CardModalProperties({
  card,
  boardColumns,
  boardMembers,
  openDropdown,
  setOpenDropdown,
  onStatusChange,
  onAssigneeChange,
  onPriorityChange,
  onDateSave,
  onDateRemove,
  onTagsChange,
  canAssignAssignees = false,
}: CardModalPropertiesProps) {
  const [newTag, setNewTag] = useState("")
  const currentPriority =
    priorities.find((p) => p.value === card.priority) || priorities[0]
  const PriorityIcon = currentPriority.icon
  const currentColumn = boardColumns.find((c) => c.id === card.columnId)
  const tags: string[] = card.tags ?? []

  const addTag = () => {
    const trimmed = newTag.trim()
    if (!trimmed) return
    const normalized = trimmed.toLowerCase()
    if (tags.some((t) => t.toLowerCase() === normalized)) {
      setNewTag("")
      return
    }
    onTagsChange([...tags, trimmed])
    setNewTag("")
  }

  const removeTag = (index: number) => {
    onTagsChange(tags.filter((_, i) => i !== index))
  }

  useEffect(() => {
    if (!openDropdown) return

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (target.closest("[data-property-dropdown]")) return
      setOpenDropdown(null)
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return
      event.stopPropagation()
      setOpenDropdown(null)
    }

    document.addEventListener("mousedown", handlePointerDown)
    document.addEventListener("keydown", handleKeyDown, true)
    return () => {
      document.removeEventListener("mousedown", handlePointerDown)
      document.removeEventListener("keydown", handleKeyDown, true)
    }
  }, [openDropdown, setOpenDropdown])

  return (
    <div className="space-y-3">
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <PropertyCell label="Durum">
        <div className="relative" data-property-dropdown>
          <button
            type="button"
            onClick={() =>
              setOpenDropdown(openDropdown === "status" ? null : "status")
            }
            className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm text-foreground transition-colors hover:bg-accent"
          >
            <LayoutGrid className="size-4 shrink-0 text-primary" />
            <span className="truncate">{currentColumn?.name || "Seç"}</span>
          </button>
          {openDropdown === "status" ? (
            <div className="absolute top-full left-0 z-50 mt-1 w-52 rounded-xl border border-border bg-popover py-1 shadow-xl">
              {boardColumns.map((col) => (
                <button
                  key={col.id}
                  type="button"
                  onClick={() => onStatusChange(col.id)}
                  className="flex w-full items-center justify-between px-3 py-2 text-sm hover:bg-accent"
                >
                  <span>{col.name}</span>
                  {col.id === card.columnId ? (
                    <Check className="size-4 text-primary" />
                  ) : null}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </PropertyCell>

      <PropertyCell label="Sorumlular">
        <div className="relative" data-property-dropdown>
          {canAssignAssignees ? (
            <button
              type="button"
              onClick={() =>
                setOpenDropdown(openDropdown === "assignee" ? null : "assignee")
              }
              className="flex w-full min-h-8 items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm transition-colors hover:bg-accent"
            >
              {card.assignees?.length > 0 ? (
                <div className="flex -space-x-1.5">
                  {card.assignees.map((user: any) => (
                    <Avatar
                      key={user.id}
                      className="size-6 border-2 border-card"
                      title={getUserDisplayName(user)}
                    >
                      <AvatarFallback
                        className="text-[10px] font-bold"
                        style={getUserColorStylesWithOpacity(user.color)}
                      >
                        {getUserInitial(user)}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                </div>
              ) : (
                <span className="flex items-center gap-2 text-muted-foreground">
                  <User className="size-4" />
                  Atanmadı
                </span>
              )}
              <span className="ml-auto flex size-6 items-center justify-center rounded-full bg-muted">
                <Plus className="size-3.5" />
              </span>
            </button>
          ) : (
            <div className="flex min-h-8 items-center gap-2 rounded-lg px-2 py-1.5 text-sm">
              {card.assignees?.length > 0 ? (
                <div className="flex -space-x-1.5">
                  {card.assignees.map((user: any) => (
                    <Avatar
                      key={user.id}
                      className="size-6 border-2 border-card"
                      title={getUserDisplayName(user)}
                    >
                      <AvatarFallback
                        className="text-[10px] font-bold"
                        style={getUserColorStylesWithOpacity(user.color)}
                      >
                        {getUserInitial(user)}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                </div>
              ) : (
                <span className="flex items-center gap-2 text-muted-foreground">
                  <User className="size-4" />
                  Atanmadı
                </span>
              )}
            </div>
          )}
          {canAssignAssignees && openDropdown === "assignee" ? (
            <div className="absolute top-full left-0 z-50 mt-1 max-h-48 w-56 overflow-y-auto rounded-xl border border-border bg-popover py-1 shadow-xl">
              {boardMembers.map((member) => {
                const isAssigned = card.assignees?.some(
                  (a: any) => a.id === member.user.id,
                )
                return (
                  <button
                    key={member.user.id}
                    type="button"
                    onClick={() => onAssigneeChange(member.user.id)}
                    className="flex w-full items-center justify-between px-3 py-2 text-sm hover:bg-accent"
                  >
                    <span className="truncate">{getUserDisplayName(member.user)}</span>
                    {isAssigned ? <Check className="size-4 text-primary" /> : null}
                  </button>
                )
              })}
            </div>
          ) : null}
        </div>
      </PropertyCell>

      <PropertyCell label="Tarihler">
        <div className="relative" data-property-dropdown>
          <button
            type="button"
            onClick={() =>
              setOpenDropdown(openDropdown === "date" ? null : "date")
            }
            className="flex w-full items-start gap-2 rounded-lg px-2 py-1.5 text-left text-sm transition-colors hover:bg-accent"
          >
            <Calendar className="mt-0.5 size-4 shrink-0 text-primary" />
            {card.startDate || card.dueDate ? (
              <div className="min-w-0 space-y-0.5">
                {card.startDate ? (
                  <p className="truncate text-[11px] text-muted-foreground">
                    Başlangıç:{" "}
                    {format(new Date(card.startDate), "d MMM yyyy", {
                      locale: tr,
                    })}
                  </p>
                ) : null}
                {card.dueDate ? (
                  <p className="truncate">
                    Bitiş:{" "}
                    {format(new Date(card.dueDate), "d MMM yyyy HH:mm", {
                      locale: tr,
                    })}
                  </p>
                ) : null}
              </div>
            ) : (
              <span className="text-muted-foreground">Tarih yok</span>
            )}
          </button>
          {openDropdown === "date" ? (
            <DatePickerPopover
              initialStartDate={
                card.startDate ? new Date(card.startDate) : null
              }
              initialDueDate={card.dueDate ? new Date(card.dueDate) : null}
              initialReminderMinutes={card.reminderMinutes || null}
              initialIsRecurring={card.isRecurring || false}
              onSave={onDateSave}
              onClose={() => setOpenDropdown(null)}
              onRemove={onDateRemove}
            />
          ) : null}
        </div>
      </PropertyCell>

      <PropertyCell label="Öncelik">
        <div className="relative" data-property-dropdown>
          <button
            type="button"
            onClick={() =>
              setOpenDropdown(openDropdown === "priority" ? null : "priority")
            }
            className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm transition-colors hover:bg-accent"
          >
            <PriorityIcon
              className={cn("size-4 shrink-0", currentPriority.color)}
            />
            <span>{currentPriority.label}</span>
          </button>
          {openDropdown === "priority" ? (
            <div className="absolute top-full left-0 z-50 mt-1 w-48 rounded-xl border border-border bg-popover py-1 shadow-xl">
              {priorities.map((p) => {
                const Icon = p.icon
                return (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => onPriorityChange(p.value)}
                    className="flex w-full items-center justify-between px-3 py-2 text-sm hover:bg-accent"
                  >
                    <span className="flex items-center gap-2">
                      <Icon className={cn("size-4", p.color)} />
                      {p.label}
                    </span>
                    {p.value === card.priority ? (
                      <Check className="size-4 text-primary" />
                    ) : null}
                  </button>
                )
              })}
            </div>
          ) : null}
        </div>
      </PropertyCell>
    </div>

      <PropertyCell label="Etiketler">
        <div className="flex flex-wrap items-center gap-1.5">
          {tags.length > 0 ? (
            tags.map((tag, index) => (
              <Badge
                key={`${tag}-${index}`}
                variant="outline"
                className="h-6 gap-1 border-orange-500/20 bg-orange-500/10 pr-1 pl-2 text-xs text-orange-300"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(index)}
                  className="rounded p-0.5 hover:bg-orange-500/20"
                  aria-label={`${tag} etiketini kaldır`}
                >
                  <X className="size-3" />
                </button>
              </Badge>
            ))
          ) : (
            <span className="flex items-center gap-2 text-sm text-muted-foreground">
              <Tag className="size-4" />
              Etiket yok
            </span>
          )}
          <input
            type="text"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                addTag()
              }
            }}
            onBlur={addTag}
            placeholder="Etiket ekle..."
            className="min-w-[100px] flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
        </div>
      </PropertyCell>
    </div>
  )
}
