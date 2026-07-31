"use client"

import {
  createContext,
  useContext,
  useState,
} from "react"
import { useDroppable } from "@dnd-kit/core"
import { useSortable } from "@dnd-kit/sortable"
import { sortableTranslateStyle } from "@/lib/kanban-dnd-style"
import {
  MoreHorizontal,
  Edit2,
  Trash2,
  Palette,
  Shield,
  ArrowLeft,
  ArrowRight,
  Plus,
  X,
  Inbox,
  GripVertical,
} from "lucide-react"
import {
  updateColumn,
  deleteColumn,
  moveColumnPosition,
  updateColumnAllowedRoles,
} from "@/app/actions"
import ConfirmModal from "./ConfirmModal"
import PromptModal from "./PromptModal"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { getColumnCategoryLabel, hexToRgba } from "@/lib/kanban-utils"
import { useColumnIsDragTarget } from "@/components/kanban/useColumnDragUi"

const ColumnScrollContext = createContext<HTMLDivElement | null>(null)

export function useColumnScrollRoot() {
  return useContext(ColumnScrollContext)
}

const COLUMN_COLORS = [
  "#579dff",
  "#4bce97",
  "#f5cd47",
  "#e774bb",
  "#f87168",
  "#9f8fef",
]

type ColumnProps = {
  column: any
  children: React.ReactNode
  userRole?: string
  allRoles?: any[]
  cardCount?: number
  totalCardCount?: number
  canReorderColumn?: boolean
  canAddCard?: boolean
  isAdding?: boolean
  newCardTitle?: string
  onStartAdd?: () => void
  onCancelAdd?: () => void
  onCardTitleChange?: (value: string) => void
  onSubmitAdd?: (e?: React.FormEvent) => void
}

export default function Column({
  column,
  children,
  userRole,
  allRoles = [],
  cardCount,
  totalCardCount,
  canReorderColumn = false,
  canAddCard = false,
  isAdding = false,
  newCardTitle = "",
  onStartAdd,
  onCancelAdd,
  onCardTitleChange,
  onSubmitAdd,
}: ColumnProps) {
  const {
    attributes,
    listeners,
    setNodeRef: setSortableRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: column.id,
    data: { type: "Column", column },
    disabled: !canReorderColumn,
  })

  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: `column-drop-${column.id}`,
    data: { type: "ColumnDrop", columnId: column.id },
  })

  const [scrollRootNode, setScrollRootNode] = useState<HTMLDivElement | null>(null)

  const columnStyle = sortableTranslateStyle(transform, transition)

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showRenamePrompt, setShowRenamePrompt] = useState(false)
  const [showPermissionsModal, setShowPermissionsModal] = useState(false)
  const [allowedRoles, setAllowedRoles] = useState<string[]>(
    column.allowedRoles || [],
  )
  const [dragOutRoles, setDragOutRoles] = useState<string[]>(
    column.dragOutRoles || [],
  )

  const dotColor = column.color || "#579dff"
  const totalCount = totalCardCount ?? column.cards?.length ?? 0
  const count = cardCount ?? totalCount
  const categoryLabel = getColumnCategoryLabel(column.category)
  const hasCards = totalCount > 0
  const isDragTarget = useColumnIsDragTarget(column.id)

  const handleSavePermissions = async () => {
    await updateColumnAllowedRoles(column.id, allowedRoles, dragOutRoles)
    setShowPermissionsModal(false)
    window.location.reload()
  }

  return (
    <div
      ref={setSortableRef}
      className={cn(
        "flex h-full max-h-full min-h-0 w-[min(320px,85vw)] shrink-0 flex-col rounded-2xl border transition-all duration-200",
        isOver && !isDragging
          ? "border-primary/50 bg-primary/5 shadow-lg shadow-primary/5"
          : "border-border/60 bg-card/40",
        isDragging && "z-10 opacity-40",
      )}
      style={{
        ...columnStyle,
        boxShadow:
          isOver && !isDragging ? undefined : `inset 0 3px 0 0 ${dotColor}`,
      }}
    >
      <div className="flex items-center justify-between gap-2 px-3 py-3">
        <div className="flex min-w-0 flex-1 items-start gap-1.5">
          {canReorderColumn ? (
            <button
              type="button"
              className="mt-0.5 shrink-0 cursor-grab touch-none rounded p-0.5 text-muted-foreground/60 transition-colors hover:text-muted-foreground active:cursor-grabbing"
              title="Sütunu taşı"
              aria-label="Sütunu taşı"
              {...attributes}
              {...listeners}
            >
              <GripVertical className="size-4" />
            </button>
          ) : null}
          <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <div
              className="size-2.5 shrink-0 rounded-full ring-2 ring-background"
              style={{ backgroundColor: dotColor }}
            />
            <h2 className="truncate text-sm font-semibold text-foreground">
              {column.name}
            </h2>
            <Badge
              variant="secondary"
              className="h-5 min-w-5 shrink-0 justify-center px-1.5 text-[10px] font-semibold tabular-nums"
            >
              {count}
            </Badge>
          </div>
          {categoryLabel ? (
            <p className="mt-1 truncate pl-5 text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
              {categoryLabel}
            </p>
          ) : null}
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                size="icon-sm"
                className="shrink-0 text-muted-foreground"
              />
            }
          >
            <MoreHorizontal className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuItem onClick={() => setShowRenamePrompt(true)}>
              <Edit2 className="size-3.5" />
              Sütunu Yeniden Adlandır
            </DropdownMenuItem>

            <div className="px-2 py-2">
              <div className="mb-1.5 flex items-center gap-1 text-[10px] font-semibold text-muted-foreground uppercase">
                <Palette className="size-3" /> Renk
              </div>
              <div className="flex gap-1.5">
                {COLUMN_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={async () => {
                      await updateColumn(column.id, { color: c })
                      window.location.reload()
                    }}
                    className={cn(
                      "size-4 rounded-full border border-black/20 transition-transform hover:scale-110",
                      dotColor === c && "ring-1 ring-foreground",
                    )}
                    style={{ backgroundColor: c }}
                    title={c}
                  />
                ))}
              </div>
            </div>

            {userRole === "ADMIN" ? (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={async () => {
                    await moveColumnPosition(column.id, "left")
                    window.location.reload()
                  }}
                >
                  <ArrowLeft className="size-3.5" /> Sola Taşı
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={async () => {
                    await moveColumnPosition(column.id, "right")
                    window.location.reload()
                  }}
                >
                  <ArrowRight className="size-3.5" /> Sağa Taşı
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setShowPermissionsModal(true)}
                >
                  <Shield className="size-3.5" /> Erişim Yetkileri
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  <Trash2 className="size-3.5" />
                  Sütunu Sil
                </DropdownMenuItem>
              </>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <ColumnScrollContext.Provider value={scrollRootNode}>
      <div
        ref={(node) => {
          setScrollRootNode(node)
          setDropRef(node)
          if (node) {
            node.dataset.kanbanColumnScroll = ""
          }
        }}
        className={cn(
          "custom-scrollbar mx-2 mb-2 flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-y-contain rounded-xl border border-transparent p-1.5 transition-colors",
          isOver && "border-primary/20 bg-primary/5",
          isDragTarget && !hasCards && "min-h-[160px]",
        )}
        style={{
          backgroundColor: isOver
            ? undefined
            : hexToRgba(dotColor, 0.04),
        }}
      >
        {hasCards || isAdding ? (
          <div className="flex flex-col gap-2">{children}</div>
        ) : (
          <div className="flex min-h-[120px] flex-col items-center justify-center rounded-xl border border-dashed border-border/60 px-4 py-8 text-center">
            <Inbox className="mb-2 size-8 text-muted-foreground/40" />
            <p className="text-xs text-muted-foreground">
              {isDragTarget ? "Kartı buraya bırakın" : "Bu sütunda kart yok"}
            </p>
          </div>
        )}
      </div>
      </ColumnScrollContext.Provider>

      {canAddCard ? (
        <div className="mt-auto shrink-0 border-t border-border/50 bg-card/40 p-2">
          {isAdding ? (
            <form
              onSubmit={onSubmitAdd}
              className="rounded-xl border border-primary/30 bg-muted/50 p-2"
            >
              <Input
                autoFocus
                placeholder="Görev başlığı..."
                value={newCardTitle}
                onChange={(e) => onCardTitleChange?.(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") onCancelAdd?.()
                }}
                className="mb-2 h-9 text-sm"
              />
              <div className="flex items-center gap-2">
                <Button type="submit" size="sm" className="h-8">
                  Ekle
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={onCancelAdd}
                >
                  <X className="size-4" />
                </Button>
              </div>
            </form>
          ) : (
            <Button
              type="button"
              variant="ghost"
              className="h-9 w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
              onClick={onStartAdd}
            >
              <Plus className="size-4" />
              Kart ekle
            </Button>
          )}
        </div>
      ) : null}

      <ConfirmModal
        isOpen={showDeleteConfirm}
        title="Sütunu Sil"
        message={`"${column.name}" sütununu ve içindeki tüm kartları silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`}
        confirmText="Sil"
        isDestructive
        onConfirm={async () => {
          await deleteColumn(column.id)
          window.location.reload()
        }}
        onCancel={() => setShowDeleteConfirm(false)}
      />

      <PromptModal
        isOpen={showRenamePrompt}
        title="Sütunu Yeniden Adlandır"
        initialValue={column.name}
        placeholder="Sütun adı"
        onConfirm={async (newName) => {
          if (newName && newName !== column.name) {
            await updateColumn(column.id, { name: newName })
            window.location.reload()
          }
        }}
        onCancel={() => setShowRenamePrompt(false)}
      />

      <Dialog
        open={showPermissionsModal}
        onOpenChange={setShowPermissionsModal}
      >
        <DialogContent className="flex max-h-[85vh] max-w-md flex-col overflow-hidden sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Sütun Yetkileri</DialogTitle>
          </DialogHeader>

          <div className="custom-scrollbar flex-1 space-y-6 overflow-y-auto">
            <div>
              <h3 className="mb-1 flex items-center gap-2 text-sm font-semibold text-foreground">
                Giriş İzni (İçeri Taşıma)
              </h3>
              <p className="mb-3 text-xs text-muted-foreground">
                Kimler bu sütuna kart bırakabilir? (Hiçbiri seçilmezse herkese
                açıktır)
              </p>
              <div className="flex flex-wrap gap-2">
                {allRoles.map((role) => {
                  const isChecked = allowedRoles.includes(role.id)
                  return (
                    <Badge
                      key={role.id}
                      variant={isChecked ? "default" : "outline"}
                      className="cursor-pointer px-3 py-1.5"
                      onClick={() => {
                        if (!isChecked)
                          setAllowedRoles([...allowedRoles, role.id])
                        else
                          setAllowedRoles(
                            allowedRoles.filter((id) => id !== role.id),
                          )
                      }}
                    >
                      {role.name}
                      {role.isSystem ? " · Sistem" : ""}
                    </Badge>
                  )
                })}
              </div>
            </div>

            <div className="border-t border-border pt-5">
              <h3 className="mb-1 flex items-center gap-2 text-sm font-semibold text-foreground">
                Çıkış İzni (Dışarı Taşıma)
              </h3>
              <p className="mb-3 text-xs text-muted-foreground">
                Kimler bu sütundaki kartı alıp başka sütuna taşıyabilir?
              </p>
              <div className="flex flex-wrap gap-2">
                {allRoles.map((role) => {
                  const isChecked = dragOutRoles.includes(role.id)
                  return (
                    <Badge
                      key={role.id}
                      variant={isChecked ? "destructive" : "outline"}
                      className="cursor-pointer px-3 py-1.5"
                      onClick={() => {
                        if (!isChecked)
                          setDragOutRoles([...dragOutRoles, role.id])
                        else
                          setDragOutRoles(
                            dragOutRoles.filter((id) => id !== role.id),
                          )
                      }}
                    >
                      {role.name}
                      {role.isSystem ? " · Sistem" : ""}
                    </Badge>
                  )
                })}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowPermissionsModal(false)}
            >
              İptal
            </Button>
            <Button type="button" onClick={handleSavePermissions}>
              Kaydet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
