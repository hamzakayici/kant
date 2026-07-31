"use client"

import { createContext, useContext } from "react"

type KanbanBoardDndContextValue = {
  registerColumnScroll: (columnId: string, element: HTMLElement | null) => void
}

export const KanbanBoardDndContext =
  createContext<KanbanBoardDndContextValue | null>(null)

export function useKanbanBoardDnd() {
  const ctx = useContext(KanbanBoardDndContext)
  if (!ctx) {
    throw new Error("useKanbanBoardDnd must be used within KanbanBoardDndContext")
  }
  return ctx
}

export function useKanbanBoardDndOptional() {
  return useContext(KanbanBoardDndContext)
}
