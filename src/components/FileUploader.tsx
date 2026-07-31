"use client"

import { useState, useCallback } from "react"
import { Loader2 } from "lucide-react"

import { useModal } from "@/components/providers/ModalProvider"

export default function FileUploader({ 
  cardId, 
  onUploadSuccess,
  children,
  className = ""
}: { 
  cardId: string, 
  onUploadSuccess: () => void,
  children?: React.ReactNode,
  className?: string
}) {
  const { showAlert } = useModal()
  const [isUploading, setIsUploading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  const uploadFile = async (selectedFile: File) => {
    setIsUploading(true)
    const formData = new FormData()
    formData.append("file", selectedFile)
    formData.append("cardId", cardId)

    // Eğer resimse genişlik ve yüksekliği bul
    if (selectedFile.type.startsWith('image/')) {
      try {
        const dimensions = await new Promise<{width: number, height: number}>((resolve) => {
          const img = new Image()
          img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight })
          img.src = URL.createObjectURL(selectedFile)
        })
        formData.append("width", dimensions.width.toString())
        formData.append("height", dimensions.height.toString())
      } catch (e) {
        console.error("Görsel boyutları alınamadı:", e)
      }
    }

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })
      if (res.ok) {
        onUploadSuccess()
      } else {
        const data = await res.json().catch(() => null)
        const detail =
          data && typeof data.error === "string" ? data.error : null
        await showAlert(detail || "Yükleme başarısız.")
      }
    } catch (error) {
      await showAlert("Hata oluştu.")
    } finally {
      setIsUploading(false)
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return
    
    for (const file of files) {
      await uploadFile(file)
    }
    e.target.value = ''
  }

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const onDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const files = Array.from(e.dataTransfer.files || [])
    if (files.length === 0) return
    
    for (const file of files) {
      await uploadFile(file)
    }
  }, [cardId, onUploadSuccess])

  return (
    <div 
      className={`relative ${className} ${isDragging ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""}`}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onClick={(e) => e.stopPropagation()}
    >
      <input 
        id={`file-upload-${cardId}`}
        type="file" 
        multiple
        className="hidden" 
        onChange={handleFileChange} 
        disabled={isUploading}
        onClick={(e) => e.stopPropagation()}
      />
      {isUploading ? (
        <div
          className="absolute inset-0 z-50 flex items-center justify-center rounded-[inherit] bg-card"
          aria-live="polite"
          aria-busy="true"
        >
          <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 shadow-lg">
            <Loader2 className="size-4 animate-spin text-primary" />
            <span className="text-sm font-medium">Dosya yükleniyor...</span>
          </div>
        </div>
      ) : null}
      {children}
    </div>
  )
}
