"use client"

import {
  AlertCircle,
  ArrowUp,
  Calendar,
  Check,
  CornerDownRight,
  LayoutGrid,
  Minus,
  Plus,
  User,
  Zap,
} from "lucide-react"
import { format } from "date-fns"
import { tr } from "date-fns/locale"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { getUserDisplayName, getUserInitial } from "@/lib/user"
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
  canAssignAssignees = false,
}: CardModalPropertiesProps) {
  const currentPriority =
    priorities.find((p) => p.value === card.priority) || priorities[0]
  const PriorityIcon = currentPriority.icon
  const currentColumn = boardColumns.find((c) => c.id === card.columnId)

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <PropertyCell label="Durum">
        <div className="relative">
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
        <div className="relative">
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
                      <AvatarFallback className="bg-primary/20 text-[10px] font-bold text-primary">
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
                      <AvatarFallback className="bg-primary/20 text-[10px] font-bold text-primary">
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
        <div className="relative">
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
        <div className="relative">
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
  )
}
