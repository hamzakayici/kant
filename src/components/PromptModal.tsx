"use client"

import { useEffect, useState } from "react"
import { Edit2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"

interface PromptModalProps {
  isOpen: boolean
  title: string
  description?: string
  initialValue?: string
  placeholder?: string
  confirmText?: string
  cancelText?: string
  onConfirm: (value: string) => void
  onCancel: () => void
}

export default function PromptModal({
  isOpen,
  title,
  description,
  initialValue = "",
  placeholder = "",
  confirmText = "Kaydet",
  cancelText = "İptal",
  onConfirm,
  onCancel,
}: PromptModalProps) {
  const [value, setValue] = useState(initialValue)

  useEffect(() => {
    if (isOpen) setValue(initialValue)
  }, [isOpen, initialValue])

  const handleConfirm = () => {
    if (!value.trim()) return
    onConfirm(value)
    onCancel()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="sm:max-w-sm" showCloseButton={false}>
        <DialogHeader>
          <div className="flex items-start gap-4">
            <div className="rounded-full bg-primary/10 p-2 text-primary">
              <Edit2 className="size-6" />
            </div>
            <div className="w-full">
              <DialogTitle>{title}</DialogTitle>
              {description ? (
                <DialogDescription className="mt-1">{description}</DialogDescription>
              ) : null}
              <Input
                autoFocus
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={placeholder}
                onKeyDown={(e) => e.key === "Enter" && handleConfirm()}
                className="mt-4"
              />
            </div>
          </div>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            {cancelText}
          </Button>
          <Button disabled={!value.trim()} onClick={handleConfirm}>
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
