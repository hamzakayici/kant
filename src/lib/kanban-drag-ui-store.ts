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

type Listener = () => void

let state: KanbanDragUiState | null = null
const columnListeners = new Map<string, Set<Listener>>()
const overlayListeners = new Set<Listener>()
const columnSnapshots = new Map<string, ColumnDragUiSnapshot | typeof UNAFFECTED>()

function isColumnAffected(columnId: string, drag: KanbanDragUiState) {
  return (
    drag.sourceColumnId === columnId || drag.dropHint.columnId === columnId
  )
}

function getAffectedColumnIds(drag: KanbanDragUiState | null): string[] {
  if (!drag) return []
  return [...new Set([drag.sourceColumnId, drag.dropHint.columnId])]
}

function rebuildColumnSnapshots() {
  columnSnapshots.clear()
  if (!state) return
  for (const columnId of getAffectedColumnIds(state)) {
    columnSnapshots.set(columnId, {
      activeCardId: state.activeCardId,
      sourceColumnId: state.sourceColumnId,
      activeCard: state.activeCard,
      dropHint: state.dropHint,
    })
  }
}

function subscribeToSet(
  set: Set<Listener>,
  listener: Listener,
): () => void {
  set.add(listener)
  return () => set.delete(listener)
}

function subscribeColumn(columnId: string, listener: Listener): () => void {
  let set = columnListeners.get(columnId)
  if (!set) {
    set = new Set()
    columnListeners.set(columnId, set)
  }
  return subscribeToSet(set, listener)
}

function emitColumns(columnIds: Iterable<string>) {
  for (const columnId of columnIds) {
    const set = columnListeners.get(columnId)
    if (!set) continue
    for (const listener of set) {
      listener()
    }
  }
}

function emitOverlay() {
  for (const listener of overlayListeners) {
    listener()
  }
}

function emitChange(
  prev: KanbanDragUiState | null,
  next: KanbanDragUiState | null,
) {
  const affected = new Set<string>()
  for (const id of getAffectedColumnIds(prev)) affected.add(id)
  for (const id of getAffectedColumnIds(next)) affected.add(id)
  emitColumns(affected)
  emitOverlay()
}

export const kanbanDragUiStore = {
  get(): KanbanDragUiState | null {
    return state
  },
  getDropHint(): CardDropHint | null {
    return state?.dropHint ?? null
  },
  getColumnSnapshot(columnId: string): ColumnDragUiSnapshot | null {
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
    const prev = state
    state = next
    rebuildColumnSnapshots()
    emitChange(prev, state)
  },
  setDropHint(dropHint: CardDropHint) {
    if (!state) return
    if (
      state.dropHint.columnId === dropHint.columnId &&
      state.dropHint.index === dropHint.index
    ) {
      return
    }
    const prev = state
    state = { ...state, dropHint }
    rebuildColumnSnapshots()
    emitChange(prev, state)
  },
  clear() {
    if (state === null) return
    const prev = state
    state = null
    columnSnapshots.clear()
    emitChange(prev, null)
  },
  subscribeColumn(columnId: string, listener: Listener) {
    return subscribeColumn(columnId, listener)
  },
  subscribeOverlay(listener: Listener) {
    return subscribeToSet(overlayListeners, listener)
  },
}

export const kanbanDropHintStore = {
  get: () => kanbanDragUiStore.getDropHint(),
  clear: () => kanbanDragUiStore.clear(),
  subscribe: kanbanDragUiStore.subscribeOverlay,
}
