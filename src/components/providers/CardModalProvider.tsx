"use client"

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react"
import CardModal from "@/components/CardModal"
import { CardModalSkeleton } from "@/components/kanban/CardModalSkeleton"
import { getCardForModal } from "@/app/actions"
import { useModal } from "@/components/providers/ModalProvider"

type CardModalState = {
  card: any
  boardId: string
  boardIdentifier: string
  userRole: string
  boardColumns: any[]
  boardMembers: any[]
  canAssignAssignees: boolean
}

type CardModalContextValue = {
  openCard: (cardId: string) => Promise<void>
  closeCard: () => void
  isOpening: boolean
}

const CardModalContext = createContext<CardModalContextValue | null>(null)

export function CardModalProvider({ children }: { children: ReactNode }) {
  const { showAlert } = useModal()
  const [modalState, setModalState] = useState<CardModalState | null>(null)
  const [isOpening, setIsOpening] = useState(false)

  const closeCard = useCallback(() => {
    setModalState(null)
  }, [])

  const openCard = useCallback(
    async (cardId: string) => {
      if (isOpening) return
      setIsOpening(true)
      try {
        const data = await getCardForModal(cardId)
        setModalState(data)
      } catch (error) {
        await showAlert(
          error instanceof Error ? error.message : "Kart açılamadı",
        )
      } finally {
        setIsOpening(false)
      }
    },
    [isOpening, showAlert],
  )

  return (
    <CardModalContext.Provider value={{ openCard, closeCard, isOpening }}>
      {children}
      {isOpening && !modalState ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3 backdrop-blur-sm sm:p-6"
          aria-busy
          aria-label="Kart yükleniyor"
        >
          <CardModalSkeleton />
        </div>
      ) : null}
      {modalState ? (
        <CardModal
          card={modalState.card}
          boardId={modalState.boardId}
          boardIdentifier={modalState.boardIdentifier}
          userRole={modalState.userRole}
          boardColumns={modalState.boardColumns}
          boardMembers={modalState.boardMembers}
          canAssignAssignees={modalState.canAssignAssignees}
          onClose={closeCard}
        />
      ) : null}
    </CardModalContext.Provider>
  )
}

export function useCardModal() {
  const context = useContext(CardModalContext)
  if (!context) {
    throw new Error("useCardModal must be used within CardModalProvider")
  }
  return context
}

export function useOptionalCardModal() {
  return useContext(CardModalContext)
}
