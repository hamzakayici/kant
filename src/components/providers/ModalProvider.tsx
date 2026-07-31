"use client"

import React, { createContext, useCallback, useContext, useState, ReactNode } from "react"
import { AlertCircle, HelpCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface ModalContextType {
  showAlert: (message: string) => Promise<void>
  showConfirm: (message: string) => Promise<boolean>
}

const ModalContext = createContext<ModalContextType | undefined>(undefined)

interface ModalState {
  isOpen: boolean
  type: "alert" | "confirm"
  message: string
  resolve: ((value: boolean | void) => void) | null
}

export function ModalProvider({ children }: { children: ReactNode }) {
  const [modal, setModal] = useState<ModalState>({
    isOpen: false,
    type: "alert",
    message: "",
    resolve: null,
  })

  const showAlert = useCallback((message: string) => {
    return new Promise<void>((resolve) => {
      setModal({
        isOpen: true,
        type: "alert",
        message,
        resolve: () => resolve(),
      })
    })
  }, [])

  const showConfirm = useCallback((message: string) => {
    return new Promise<boolean>((resolve) => {
      setModal({
        isOpen: true,
        type: "confirm",
        message,
        resolve: (val) => resolve(val as boolean),
      })
    })
  }, [])

  const handleClose = (value: boolean = false) => {
    if (modal.resolve) {
      if (modal.type === "confirm") {
        modal.resolve(value)
      } else {
        modal.resolve()
      }
    }
    setModal((prev) => ({ ...prev, isOpen: false, resolve: null }))
  }

  return (
    <ModalContext.Provider value={{ showAlert, showConfirm }}>
      {children}

      <Dialog
        open={modal.isOpen}
        onOpenChange={(open) => !open && handleClose(false)}
      >
        <DialogContent className="sm:max-w-md" showCloseButton={false}>
          <DialogHeader>
            <div className="flex items-start gap-4">
              {modal.type === "alert" ? (
                <div className="rounded-full bg-primary/10 p-2 text-primary">
                  <AlertCircle className="size-6" />
                </div>
              ) : (
                <div className="rounded-full bg-destructive/10 p-2 text-destructive">
                  <HelpCircle className="size-6" />
                </div>
              )}
              <div>
                <DialogTitle>
                  {modal.type === "alert" ? "Bilgi" : "Onay Gerekli"}
                </DialogTitle>
                <DialogDescription className="mt-2 whitespace-pre-wrap">
                  {modal.message}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <DialogFooter>
            {modal.type === "confirm" ? (
              <Button variant="outline" onClick={() => handleClose(false)}>
                İptal
              </Button>
            ) : null}
            <Button
              className={modal.type === "alert" ? "w-full sm:w-auto" : undefined}
              onClick={() => handleClose(true)}
            >
              {modal.type === "confirm" ? "Onayla" : "Tamam"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ModalContext.Provider>
  )
}

export function useModal() {
  const context = useContext(ModalContext)
  if (!context) {
    throw new Error("useModal must be used within a ModalProvider")
  }
  return context
}
