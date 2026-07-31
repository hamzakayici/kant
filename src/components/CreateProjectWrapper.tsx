"use client"

import { useRef, useState } from "react"
import { Plus, Upload } from "lucide-react"
import { useRouter } from "next/navigation"
import CreateProjectModal from "./CreateProjectModal"
import { importTrelloBoard } from "@/app/actions/trelloActions"
import { useModal } from "@/components/providers/ModalProvider"
import { Button } from "@/components/ui/button"

export default function CreateProjectWrapper({
  user,
  allUsers,
}: {
  user: any
  allUsers?: any[]
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const { showAlert } = useModal()

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsImporting(true)
    try {
      const text = await file.text()
      const newBoardId = await importTrelloBoard(text)
      router.push(`/b/${newBoardId}`)
    } catch (error: any) {
      showAlert(error.message || "İçe aktarılırken bir hata oluştu")
    } finally {
      setIsImporting(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" onClick={() => setIsOpen(true)}>
          <Plus className="size-4" />
          Yeni Proje
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={isImporting}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="size-4" />
          {isImporting ? "Yükleniyor..." : "Trello'dan İçe Aktar"}
        </Button>
      </div>

      <input
        type="file"
        accept=".json"
        className="hidden"
        ref={fileInputRef}
        onChange={handleFileChange}
      />

      {isOpen ? (
        <CreateProjectModal
          onClose={() => setIsOpen(false)}
          user={user}
          allUsers={allUsers}
        />
      ) : null}
    </>
  )
}
