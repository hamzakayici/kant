export type CardDropHint = {
  columnId: string
  index: number
}

export type KanbanDragUiState = {
  activeCardId: string
  sourceColumnId: string
  activeCard: any
  dropHint: CardDropHint
}

export type ColumnDragUiSnapshot = {
  activeCardId: string
  sourceColumnId: string
  activeCard: any
  dropHint: CardDropHint
}

const UNAFFECTED = Symbol("unaffected")

let state: KanbanDragUiState | null = null
const listeners = new Set<() => void>()
const columnSnapshots = new Map<string, ColumnDragUiSnapshot | typeof UNAFFECTED>()

function isColumnAffected(columnId: string, drag: KanbanDragUiState) {
  return (
    drag.sourceColumnId === columnId || drag.dropHint.columnId === columnId
  )
}

function rebuildColumnSnapshots() {
  columnSnapshots.clear()
  if (!state) return
  for (const columnId of new Set([
    state.sourceColumnId,
    state.dropHint.columnId,
  ])) {
    columnSnapshots.set(columnId, {
      activeCardId: state.activeCardId,
      sourceColumnId: state.sourceColumnId,
      activeCard: state.activeCard,
      dropHint: state.dropHint,
    })
  }
}

function emit() {
  for (const listener of listeners) {
    listener()
  }
}

export const kanbanDragUiStore = {
  get(): KanbanDragUiState | null {
    return state
  },
  getDropHint(): CardDropHint | null {
    return state?.dropHint ?? null
  },
  getColumnSnapshot(
    columnId: string,
  ): ColumnDragUiSnapshot | null {
    if (!state) return null
    const cached = columnSnapshots.get(columnId)
    if (cached === UNAFFECTED) return null
    if (cached) return cached
    if (!isColumnAffected(columnId, state)) {
      columnSnapshots.set(columnId, UNAFFECTED)
      return null
    }
    const snapshot: ColumnDragUiSnapshot = {
      activeCardId: state.activeCardId,
      sourceColumnId: state.sourceColumnId,
      activeCard: state.activeCard,
      dropHint: state.dropHint,
    }
    columnSnapshots.set(columnId, snapshot)
    return snapshot
  },
  start(next: KanbanDragUiState) {
    state = next
    rebuildColumnSnapshots()
    emit()
  },
  setDropHint(dropHint: CardDropHint) {
    if (!state) return
    if (
      state.dropHint.columnId === dropHint.columnId &&
      state.dropHint.index === dropHint.index
    ) {
      return
    }
    state = { ...state, dropHint }
    rebuildColumnSnapshots()
    emit()
  },
  clear() {
    if (state === null) return
    state = null
    columnSnapshots.clear()
    emit()
  },
  subscribe(listener: () => void) {
    listeners.add(listener)
    return () => listeners.delete(listener)
  },
}

export const kanbanDropHintStore = {
  get: () => kanbanDragUiStore.getDropHint(),
  clear: () => kanbanDragUiStore.clear(),
  subscribe: kanbanDragUiStore.subscribe,
}
