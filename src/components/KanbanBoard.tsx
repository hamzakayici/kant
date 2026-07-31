"use client"

import { useState, useId, useEffect, useMemo, useRef, useCallback } from "react"
import { Plus, LayoutGrid, Filter } from "lucide-react"
import {
  DndContext,
  DragOverlay,
  closestCorners,
  pointerWithin,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
  MeasuringStrategy,
  type CollisionDetection,
} from "@dnd-kit/core"
import {
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable"
import { useSearchParams, useRouter, usePathname } from "next/navigation"
import CardModal from "./CardModal"
import ConfirmModal from "./ConfirmModal"
import PromptModal from "./PromptModal"
import { ShareCardToChatDialog } from "@/components/chat/ShareCardToChatDialog"
import { createCard, moveCard, deleteCard, createColumn, reorderColumns } from "@/app/actions"
import { useModal } from "@/components/providers/ModalProvider"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { buildBoardColumnsSignature } from "@/lib/kanban-utils"
import {
  applyColumnReorder,
  applyCardMoveAtIndex,
  getColumnDropId,
} from "@/lib/kanban-drag"
import { KanbanColumnSlot } from "@/components/kanban/KanbanColumnSlot"
import { KanbanDragOverlay } from "@/components/kanban/KanbanDragOverlay"
import { KanbanBoardDndContext } from "@/components/kanban/KanbanBoardDndContext"
import { kanbanDragUiStore } from "@/lib/kanban-drag-ui-store"
import { computeDropIndex } from "@/lib/kanban-drop-index"

export default function KanbanBoard({
  initialBoard,
  userRole,
  allRoles = [],
  currentUserRole = "system_requester",
  canAssignAssignees = false,
}: {
  initialBoard: any
  userRole: string
  allRoles?: any[]
  currentUserRole?: string
  canAssignAssignees?: boolean
}) {
  const { showAlert } = useModal()
  const [columns, setColumns] = useState(initialBoard.columns)
  const columnsRef = useRef(columns)
  columnsRef.current = columns

  const [activeColumn, setActiveColumn] = useState<any | null>(null)
  const dragOriginRef = useRef<{ cardId: string; columnId: string } | null>(null)
  const columnOriginIndexRef = useRef<number | null>(null)
  const [activeModalCard, setActiveModalCard] = useState<any>(null)
  const [addingToColumn, setAddingToColumn] = useState<string | null>(null)
  const [creatingInColumn, setCreatingInColumn] = useState<string | null>(null)
  const [newCardTitle, setNewCardTitle] = useState("")
  const [confirmDeleteCardId, setConfirmDeleteCardId] = useState<string | null>(
    null,
  )
  const [showAddColumnPrompt, setShowAddColumnPrompt] = useState(false)
  const [shareCard, setShareCard] = useState<{
    id: string
    sequenceId: number
    title: string
  } | null>(null)

  const dragFrameRef = useRef<number | null>(null)
  const pendingColumnsRef = useRef<typeof columns | null>(null)
  const dragMutatedRef = useRef(false)
  const pointerRef = useRef({ x: 0, y: 0 })
  const dropTargetRef = useRef<{ columnId: string; index: number } | null>(null)
  const columnScrollMapRef = useRef(new Map<string, HTMLElement>())

  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const urlCardId = searchParams.get("card")

  const keywordFilter = searchParams.get("keyword")?.toLowerCase() || ""
  const assigneesParam = searchParams.get("assignees")
  const assigneesFilter = useMemo(
    () => (assigneesParam ? assigneesParam.split(",") : []),
    [assigneesParam],
  )
  const noMembersFilter = searchParams.get("noMembers") === "true"
  const hasActiveFilters =
    !!keywordFilter || assigneesFilter.length > 0 || noMembersFilter

  const filteredColumns = useMemo(() => {
    return columns.map((col: any) => ({
      ...col,
      cards: col.cards.filter((card: any) => {
        let matchKeyword = true
        let matchAssignee = true

        if (keywordFilter) {
          const inTitle = card.title?.toLowerCase().includes(keywordFilter)
          const inDesc = card.description
            ?.toLowerCase()
            .includes(keywordFilter)
          const inPrefix = `${initialBoard.identifier}-${card.sequenceId}`
            .toLowerCase()
            .includes(keywordFilter)
          const inTags = card.tags?.some((t: string) =>
            t.toLowerCase().includes(keywordFilter),
          )
          matchKeyword = !!(inTitle || inDesc || inPrefix || inTags)
        }

        if (assigneesFilter.length > 0 || noMembersFilter) {
          const cardAssignees = card.assignees?.map((a: any) => a.id) || []
          if (cardAssignees.length === 0) {
            matchAssignee = noMembersFilter
          } else {
            matchAssignee =
              assigneesFilter.length > 0 &&
              cardAssignees.some((id: string) =>
                assigneesFilter.includes(id),
              )
          }
        }

        return matchKeyword && matchAssignee
      }),
    }))
  }, [
    columns,
    keywordFilter,
    assigneesFilter,
    noMembersFilter,
    initialBoard.identifier,
  ])

  const totalCards = useMemo(
    () =>
      columns.reduce(
        (sum: number, col: any) => sum + (col.cards?.length || 0),
        0,
      ),
    [columns],
  )

  const visibleCards = useMemo(
    () =>
      filteredColumns.reduce(
        (sum: number, col: any) => sum + (col.cards?.length || 0),
        0,
      ),
    [filteredColumns],
  )

  const canCreateCard = userRole === "REQUESTER" || userRole === "ADMIN"
  const canReorderColumns = userRole === "ADMIN"

  const registerColumnScroll = useCallback(
    (columnId: string, element: HTMLElement | null) => {
      if (element) {
        columnScrollMapRef.current.set(columnId, element)
      } else {
        columnScrollMapRef.current.delete(columnId)
      }
    },
    [],
  )

  const trackPointer = useCallback((event: PointerEvent) => {
    pointerRef.current = { x: event.clientX, y: event.clientY }
  }, [])

  const startPointerTracking = useCallback(() => {
    window.addEventListener("pointermove", trackPointer, { passive: true })
  }, [trackPointer])

  const stopPointerTracking = useCallback(() => {
    window.removeEventListener("pointermove", trackPointer)
  }, [trackPointer])

  const flushPendingColumns = useCallback(() => {
    dragFrameRef.current = null
    const pending = pendingColumnsRef.current
    if (!pending) return
    pendingColumnsRef.current = null
    setColumns(pending)
  }, [])

  const scheduleColumnsUpdate = useCallback(
    (next: typeof columns) => {
      pendingColumnsRef.current = next
      columnsRef.current = next
      if (dragFrameRef.current !== null) return
      dragFrameRef.current = requestAnimationFrame(flushPendingColumns)
    },
    [flushPendingColumns],
  )

  useEffect(() => {
    return () => {
      if (dragFrameRef.current !== null) {
        cancelAnimationFrame(dragFrameRef.current)
      }
      stopPointerTracking()
    }
  }, [stopPointerTracking])

  const handleOpenCard = useCallback((card: any) => {
    setActiveModalCard(card)
  }, [])

  const handleShareCard = useCallback((card: any) => {
    setShareCard({
      id: card.id,
      sequenceId: card.sequenceId,
      title: card.title,
    })
  }, [])

  const handleDeleteCardRequest = useCallback((cardId: string) => {
    setConfirmDeleteCardId(cardId)
  }, [])

  const finalizeDragFrame = useCallback(() => {
    if (dragFrameRef.current !== null) {
      cancelAnimationFrame(dragFrameRef.current)
      dragFrameRef.current = null
    }
    if (pendingColumnsRef.current) {
      const pending = pendingColumnsRef.current
      pendingColumnsRef.current = null
      columnsRef.current = pending
      setColumns(pending)
    }
  }, [])

  const columnIds = useMemo(
    () => columns.map((col: any) => col.id),
    [columns],
  )

  const boardColumnsSignature = buildBoardColumnsSignature(
    initialBoard.id,
    initialBoard.columns,
  )

  useEffect(() => {
    setColumns(initialBoard.columns)
  }, [boardColumnsSignature])

  useEffect(() => {
    const modalCardId = activeModalCard?.id
    if (!modalCardId) return

    let updatedCard: any = null
    for (const col of initialBoard.columns) {
      const match = col.cards.find((c: any) => c.id === modalCardId)
      if (match) {
        updatedCard = match
        break
      }
    }

    setActiveModalCard((prev: any | null) => {
      if (!prev || prev.id !== modalCardId) return prev
      if (!updatedCard) return null
      if (
        prev.title === updatedCard.title &&
        prev.description === updatedCard.description &&
        prev.updatedAt === updatedCard.updatedAt &&
        prev.columnId === updatedCard.columnId
      ) {
        return prev
      }
      return updatedCard
    })
  }, [boardColumnsSignature, activeModalCard?.id])

  useEffect(() => {
    if (!urlCardId) return

    let matchedCard: any = null
    for (const col of columns) {
      const card = col.cards.find((c: any) => c.id === urlCardId)
      if (card) {
        matchedCard = card
        break
      }
    }

    if (!matchedCard) return

    setActiveModalCard((prev: any | null) =>
      prev?.id === matchedCard.id ? prev : matchedCard,
    )
  }, [urlCardId, columns])

  const handleCloseModal = () => {
    setActiveModalCard(null)
    if (urlCardId) {
      const newParams = new URLSearchParams(searchParams.toString())
      newParams.delete("card")
      const newUrl = newParams.toString()
        ? `${pathname}?${newParams.toString()}`
        : pathname
      router.replace(newUrl, { scroll: false })
    }
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const collisionDetection = useCallback<CollisionDetection>((args) => {
    if (args.active.data.current?.type === "Card") {
      const columnDroppables = args.droppableContainers.filter((container) =>
        String(container.id).startsWith("column-drop-"),
      )
      const pointerCollisions = pointerWithin({
        ...args,
        droppableContainers: columnDroppables,
      })
      if (pointerCollisions.length > 0) {
        return pointerCollisions
      }
      return closestCorners({
        ...args,
        droppableContainers: columnDroppables,
      })
    }

    const pointerCollisions = pointerWithin(args)
    if (pointerCollisions.length > 0) {
      return pointerCollisions
    }
    return closestCorners(args)
  }, [])

  const canDragCard = (column: any) => {
    if (userRole === "ADMIN") return true
    if (userRole === "DESIGNER") {
      return ["BACKLOG", "UNSTARTED", "ACTIVE"].includes(column.category)
    }
    if (userRole === "EDITOR") {
      return column.category === "ACTIVE"
    }
    return false
  }

  const setKanbanDragging = useCallback((dragging: boolean) => {
    document.body.classList.toggle("kanban-dragging", dragging)
  }, [])

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    const activeType = active.data.current?.type
    dragMutatedRef.current = false
    dropTargetRef.current = null
    kanbanDragUiStore.clear()
    startPointerTracking()
    setKanbanDragging(true)

    if (activeType === "Column") {
      if (!canReorderColumns) return
      const column = columnsRef.current.find((col: any) => col.id === active.id)
      if (!column) return
      setActiveColumn(column)
      columnOriginIndexRef.current = columnsRef.current.findIndex(
        (col: any) => col.id === active.id,
      )
      return
    }

    const column = columnsRef.current.find((col: any) =>
      col.cards.some((c: any) => c.id === active.id),
    )
    if (!column) return
    const card = column.cards.find((c: any) => c.id === active.id)
    if (!card || !canDragCard(column)) return
    dragOriginRef.current = { cardId: card.id, columnId: column.id }
    const sourceIndex = column.cards.findIndex((c: any) => c.id === card.id)
    kanbanDragUiStore.start({
      activeCardId: card.id,
      sourceColumnId: column.id,
      activeCard: card,
      dropHint: { columnId: column.id, index: sourceIndex },
    })
  }

  const updateCardDropTarget = useCallback(
    (columnId: string, cardCount: number) => {
      const scrollEl = columnScrollMapRef.current.get(columnId)
      const index = scrollEl
        ? computeDropIndex(scrollEl, pointerRef.current.y, cardCount)
        : cardCount

      const prev = dropTargetRef.current
      if (prev?.columnId === columnId && prev.index === index) {
        return
      }

      dropTargetRef.current = { columnId, index }
      kanbanDragUiStore.setDropHint({ columnId, index })
    },
    [],
  )

  const pendingDropTargetRef = useRef<{
    columnId: string
    cardCount: number
  } | null>(null)
  const dropTargetFrameRef = useRef<number | null>(null)

  const scheduleCardDropTarget = useCallback(
    (columnId: string, cardCount: number) => {
      pendingDropTargetRef.current = { columnId, cardCount }
      if (dropTargetFrameRef.current !== null) return
      dropTargetFrameRef.current = requestAnimationFrame(() => {
        dropTargetFrameRef.current = null
        const pending = pendingDropTargetRef.current
        if (!pending) return
        updateCardDropTarget(pending.columnId, pending.cardCount)
      })
    },
    [updateCardDropTarget],
  )

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event

    if (!over) {
      return
    }

    const activeId = active.id
    const overId = over.id
    if (activeId === overId) return

    const currentColumns = columnsRef.current

    if (active.data.current?.type === "Column") {
      kanbanDragUiStore.clear()
      const next = applyColumnReorder(currentColumns, activeId, overId)
      if (next) {
        dragMutatedRef.current = true
        scheduleColumnsUpdate(next)
      }
      return
    }

    const overIdStr = String(overId)
    if (!overIdStr.startsWith("column-drop-")) {
      return
    }

    const columnId = overIdStr.slice("column-drop-".length)
    const column = currentColumns.find((col: any) => col.id === columnId)
    if (!column) return

    scheduleCardDropTarget(columnId, column.cards.length)
  }

  const flushPendingDropTarget = useCallback(() => {
    if (dropTargetFrameRef.current !== null) {
      cancelAnimationFrame(dropTargetFrameRef.current)
      dropTargetFrameRef.current = null
    }
    const pending = pendingDropTargetRef.current
    pendingDropTargetRef.current = null
    if (pending) {
      updateCardDropTarget(pending.columnId, pending.cardCount)
    }
  }, [updateCardDropTarget])

  const finishDrag = useCallback(() => {
    stopPointerTracking()
    setKanbanDragging(false)
    kanbanDragUiStore.clear()
  }, [setKanbanDragging, stopPointerTracking])

  const handleDragEnd = async (event: DragEndEvent) => {
    finalizeDragFrame()
    flushPendingDropTarget()
    finishDrag()

    try {
    const { active, over } = event

    if (active.data.current?.type === "Column") {
      const originIndex = columnOriginIndexRef.current
      setActiveColumn(null)
      columnOriginIndexRef.current = null

      if (originIndex === null || !over) {
        setColumns(initialBoard.columns)
        return
      }

      const currentColumns = columnsRef.current
      const newIndex = currentColumns.findIndex(
        (col: any) =>
          col.id === over.id || getColumnDropId(col.id) === over.id,
      )

      if (newIndex === -1 || newIndex === originIndex) {
        return
      }

      try {
        await reorderColumns(
          initialBoard.id,
          currentColumns.map((col: any) => col.id),
        )
      } catch (err: any) {
        setColumns(initialBoard.columns)
        await showAlert(err.message || "Sütun sırası kaydedilemedi.")
      }
      return
    }

    const origin = dragOriginRef.current
    dragOriginRef.current = null

    if (!over || !origin || origin.cardId !== active.id) {
      if (dragMutatedRef.current) {
        setColumns(initialBoard.columns)
      }
      dropTargetRef.current = null
      return
    }

    const cardId = active.id as string
    const dropTarget = dropTargetRef.current
    dropTargetRef.current = null

    if (!dropTarget) {
      return
    }

    const nextColumns = applyCardMoveAtIndex(
      columnsRef.current,
      cardId,
      dropTarget.columnId,
      dropTarget.index,
    )

    if (!nextColumns) {
      return
    }

    setColumns(nextColumns)
    columnsRef.current = nextColumns

    let targetColumn: any = null
    let targetIndex = 0

    for (const col of nextColumns) {
      const idx = col.cards.findIndex((c: any) => c.id === cardId)
      if (idx !== -1) {
        targetColumn = col
        targetIndex = idx
        break
      }
    }

    if (!targetColumn) return

    const oldColumn = initialBoard.columns.find(
      (col: any) => col.id === origin.columnId,
    )

    if (
      oldColumn?.dragOutRoles?.length > 0 &&
      oldColumn.id !== targetColumn.id
    ) {
      if (
        !oldColumn.dragOutRoles.includes(currentUserRole) &&
        currentUserRole !== "system_admin"
      ) {
        setColumns(initialBoard.columns)
        columnsRef.current = initialBoard.columns
        await showAlert(
          "Bu sütundan kart çıkarma (taşıma) yetkiniz bulunmuyor.",
        )
        return
      }
    }

    if (targetColumn.allowedRoles?.length > 0) {
      if (
        !targetColumn.allowedRoles.includes(currentUserRole) &&
        currentUserRole !== "system_admin"
      ) {
        setColumns(initialBoard.columns)
        columnsRef.current = initialBoard.columns
        await showAlert("Bu sütuna kart taşıma yetkiniz bulunmuyor.")
        return
      }
    }

    try {
      await moveCard(cardId, targetColumn.id, targetIndex)
    } catch (err: any) {
      setColumns(initialBoard.columns)
      columnsRef.current = initialBoard.columns
      await showAlert(err.message || "Bu işlemi yapmaya yetkiniz yok!")
    }
    } finally {
      dragMutatedRef.current = false
    }
  }

  const handleDragCancel = () => {
    finalizeDragFrame()
    flushPendingDropTarget()
    finishDrag()
    setActiveColumn(null)
    dragOriginRef.current = null
    columnOriginIndexRef.current = null
    dropTargetRef.current = null
    if (dragMutatedRef.current) {
      setColumns(initialBoard.columns)
      columnsRef.current = initialBoard.columns
    }
    dragMutatedRef.current = false
  }

  const handleAddCard = async (e?: React.FormEvent) => {
    if (e && typeof e.preventDefault === "function") e.preventDefault()
    if (!newCardTitle.trim() || !addingToColumn) return

    const columnId = addingToColumn
    const title = newCardTitle.trim()
    setCreatingInColumn(columnId)
    setNewCardTitle("")
    setAddingToColumn(null)

    try {
      const createdCard = await createCard(title, columnId, initialBoard.id)
      setColumns((prev: typeof columns) =>
        prev.map((col: any) =>
          col.id === columnId
            ? { ...col, cards: [createdCard, ...col.cards] }
            : col,
        ),
      )
    } catch (err: any) {
      await showAlert(err.message || "Kart oluşturulamadı")
      setAddingToColumn(columnId)
      setNewCardTitle(title)
    } finally {
      setCreatingInColumn(null)
    }
  }

  const handleStartAddColumn = useCallback((columnId: string) => {
    setAddingToColumn(columnId)
    setNewCardTitle("")
  }, [])

  const handleCancelAdd = useCallback(() => {
    setAddingToColumn(null)
    setNewCardTitle("")
  }, [])

  useEffect(() => {
    return () => {
      document.body.classList.remove("kanban-dragging")
    }
  }, [])

  const dndContextValue = useMemo(
    () => ({
      registerColumnScroll,
    }),
    [registerColumnScroll],
  )

  const dndId = useId()

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 px-1">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="gap-1.5 px-2.5 py-1">
            <LayoutGrid className="size-3.5" />
            {filteredColumns.length} sütun
          </Badge>
          <Badge variant="outline" className="gap-1.5 px-2.5 py-1 tabular-nums">
            {visibleCards}
            {hasActiveFilters ? ` / ${totalCards}` : ""} görev
          </Badge>
          {hasActiveFilters ? (
            <Badge variant="secondary" className="gap-1.5 px-2.5 py-1">
              <Filter className="size-3.5" />
              Filtre aktif
            </Badge>
          ) : null}
        </div>
      </div>

      <div className="kanban-scroll custom-scrollbar min-h-0 flex-1 overflow-x-auto overflow-y-hidden">
        <div className="flex h-full min-h-0 items-stretch gap-4 px-1 pb-1">
          <KanbanBoardDndContext.Provider value={dndContextValue}>
          <DndContext
            id={dndId}
            sensors={sensors}
            collisionDetection={collisionDetection}
            measuring={{
              droppable: { strategy: MeasuringStrategy.BeforeDragging },
            }}
            autoScroll={{
              threshold: { x: 0.12, y: 0.18 },
              acceleration: 8,
              interval: 16,
            }}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
          >
            <SortableContext
              items={columnIds}
              strategy={horizontalListSortingStrategy}
            >
            {columns.map((col: any) => {
              const filteredCol = filteredColumns.find((f: any) => f.id === col.id)
              const displayCards = filteredCol?.cards ?? col.cards

              return (
                <KanbanColumnSlot
                  key={col.id}
                  column={col}
                  displayCards={displayCards}
                  hasActiveFilters={hasActiveFilters}
                  userRole={userRole}
                  boardIdentifier={initialBoard.identifier}
                  allRoles={allRoles}
                  canReorderColumn={canReorderColumns}
                  canAddCard={canCreateCard}
                  isAdding={addingToColumn === col.id}
                  isCreating={creatingInColumn === col.id}
                  newCardTitle={newCardTitle}
                  onStartAdd={handleStartAddColumn}
                  onCancelAdd={handleCancelAdd}
                  onCardTitleChange={setNewCardTitle}
                  onSubmitAdd={handleAddCard}
                  onDeleteCard={handleDeleteCardRequest}
                  onShareCard={handleShareCard}
                  onOpenCard={handleOpenCard}
                />
              )
            })}
            </SortableContext>

            {userRole === "ADMIN" ? (
              <div className="flex h-full w-[min(280px,85vw)] shrink-0 items-start self-stretch">
                <Button
                  type="button"
                  variant="outline"
                  className={cn(
                    "h-full min-h-[200px] w-full flex-col gap-2 border-dashed",
                    "bg-muted/20 text-muted-foreground hover:border-primary/40 hover:bg-muted/40 hover:text-foreground",
                  )}
                  onClick={() => setShowAddColumnPrompt(true)}
                >
                  <Plus className="size-6" />
                  <span className="text-sm font-medium">Sütun Ekle</span>
                </Button>
              </div>
            ) : null}

            <DragOverlay
              dropAnimation={{
                duration: 240,
                easing: "cubic-bezier(0.2, 0.9, 0.3, 1)",
              }}
            >
              <KanbanDragOverlay
                activeColumn={activeColumn}
                boardIdentifier={initialBoard.identifier}
              />
            </DragOverlay>
          </DndContext>
          </KanbanBoardDndContext.Provider>
        </div>
      </div>

      {activeModalCard ? (
        <CardModal
          card={activeModalCard}
          userRole={userRole}
          boardId={initialBoard.id}
          boardIdentifier={initialBoard.identifier}
          boardColumns={initialBoard.columns}
          boardMembers={initialBoard.members}
          canAssignAssignees={canAssignAssignees}
          onClose={handleCloseModal}
        />
      ) : null}

      {shareCard ? (
        <ShareCardToChatDialog
          cardId={shareCard.id}
          boardId={initialBoard.id}
          boardIdentifier={initialBoard.identifier}
          sequenceId={shareCard.sequenceId}
          cardTitle={shareCard.title}
          onClose={() => setShareCard(null)}
        />
      ) : null}

      <ConfirmModal
        isOpen={!!confirmDeleteCardId}
        title="Kartı Sil"
        message="Bu kartı silmek istediğinize emin misiniz? Bu işlem geri alınamaz."
        confirmText="Sil"
        isDestructive
        onConfirm={async () => {
          if (confirmDeleteCardId) {
            await deleteCard(confirmDeleteCardId)
            setConfirmDeleteCardId(null)
          }
        }}
        onCancel={() => setConfirmDeleteCardId(null)}
      />

      <PromptModal
        isOpen={showAddColumnPrompt}
        title="Sütun Ekle"
        placeholder="Yeni sütun adı"
        onConfirm={async (name) => {
          await createColumn(initialBoard.id, name, "ACTIVE", "#579dff")
          window.location.reload()
        }}
        onCancel={() => setShowAddColumnPrompt(false)}
      />
    </div>
  )
}
