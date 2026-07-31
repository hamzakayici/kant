"use client"

import { useCallback, useSyncExternalStore } from "react"
import {
  kanbanDragUiStore,
  type ColumnDragUiSnapshot,
} from "@/lib/kanban-drag-ui-store"

export function useColumnDragUi(columnId: string) {
  const getSnapshot = useCallback(
    () => kanbanDragUiStore.getColumnSnapshot(columnId),
    [columnId],
  )

  return useSyncExternalStore(
    kanbanDragUiStore.subscribe,
    getSnapshot,
    getSnapshot,
  ) as ColumnDragUiSnapshot | null
}

export function useKanbanDropHint() {
  const getSnapshot = useCallback(() => kanbanDragUiStore.getDropHint(), [])

  return useSyncExternalStore(
    kanbanDragUiStore.subscribe,
    getSnapshot,
    getSnapshot,
  )
}

export function useColumnIsDragTarget(columnId: string) {
  const getSnapshot = useCallback(
    () => kanbanDragUiStore.getDropHint()?.columnId === columnId,
    [columnId],
  )

  return useSyncExternalStore(
    kanbanDragUiStore.subscribe,
    getSnapshot,
    getSnapshot,
  )
}
