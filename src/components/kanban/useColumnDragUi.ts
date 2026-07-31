"use client"

import { useCallback, useSyncExternalStore } from "react"
import {
  kanbanDragUiStore,
  type ColumnDragUiSnapshot,
  type KanbanDragUiState,
} from "@/lib/kanban-drag-ui-store"

export function useColumnDragUi(columnId: string) {
  const getSnapshot = useCallback(
    () => kanbanDragUiStore.getColumnSnapshot(columnId),
    [columnId],
  )

  const subscribe = useCallback(
    (listener: () => void) =>
      kanbanDragUiStore.subscribeColumn(columnId, listener),
    [columnId],
  )

  return useSyncExternalStore(
    subscribe,
    getSnapshot,
    getSnapshot,
  ) as ColumnDragUiSnapshot | null
}

export function useKanbanDragUi() {
  const getSnapshot = useCallback(() => kanbanDragUiStore.get(), [])

  return useSyncExternalStore(
    kanbanDragUiStore.subscribeOverlay,
    getSnapshot,
    getSnapshot,
  ) as KanbanDragUiState | null
}

export function useKanbanCardDragActive() {
  const getSnapshot = useCallback(() => kanbanDragUiStore.get() !== null, [])

  return useSyncExternalStore(
    kanbanDragUiStore.subscribeOverlay,
    getSnapshot,
    getSnapshot,
  )
}

export function useKanbanDropHint() {
  const getSnapshot = useCallback(() => kanbanDragUiStore.getDropHint(), [])

  return useSyncExternalStore(
    kanbanDragUiStore.subscribeOverlay,
    getSnapshot,
    getSnapshot,
  )
}

export function useColumnIsDragTarget(columnId: string) {
  const getSnapshot = useCallback(
    () => kanbanDragUiStore.getDropHint()?.columnId === columnId,
    [columnId],
  )

  const subscribe = useCallback(
    (listener: () => void) =>
      kanbanDragUiStore.subscribeColumn(columnId, listener),
    [columnId],
  )

  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}
