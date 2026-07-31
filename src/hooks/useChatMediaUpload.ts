"use client"

import { useCallback, useState } from "react"
import {
  extractFilesFromClipboard,
  uploadChatAttachment,
  type PendingChatAttachment,
} from "@/lib/chat-upload"

export function useChatMediaUpload(chatGroupId: string | null) {
  const [pendingAttachments, setPendingAttachments] = useState<
    PendingChatAttachment[]
  >([])
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const uploadFiles = useCallback(
    async (files: File[]) => {
      if (!chatGroupId || files.length === 0) return

      setIsUploading(true)
      setUploadError(null)

      try {
        for (const file of files) {
          const attachment = await uploadChatAttachment(file, chatGroupId)
          setPendingAttachments((prev) => [...prev, attachment])
        }
      } catch (error) {
        setUploadError(
          error instanceof Error ? error.message : "Dosya yüklenemedi",
        )
      } finally {
        setIsUploading(false)
      }
    },
    [chatGroupId],
  )

  const removeAttachment = useCallback((id: string) => {
    setPendingAttachments((prev) => prev.filter((item) => item.id !== id))
  }, [])

  const clearAttachments = useCallback(() => {
    setPendingAttachments([])
  }, [])

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.stopPropagation()
    setIsDragging(true)
  }, [])

  const onDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.stopPropagation()
    if (event.currentTarget.contains(event.relatedTarget as Node)) return
    setIsDragging(false)
  }, [])

  const onDrop = useCallback(
    async (event: React.DragEvent) => {
      event.preventDefault()
      event.stopPropagation()
      setIsDragging(false)

      const files = Array.from(event.dataTransfer.files || [])
      await uploadFiles(files)
    },
    [uploadFiles],
  )

  const onPaste = useCallback(
    async (event: React.ClipboardEvent) => {
      const files = extractFilesFromClipboard(event.clipboardData)
      if (files.length === 0) return
      event.preventDefault()
      await uploadFiles(files)
    },
    [uploadFiles],
  )

  return {
    pendingAttachments,
    setPendingAttachments,
    removeAttachment,
    clearAttachments,
    uploadFiles,
    isUploading,
    uploadError,
    setUploadError,
    isDragging,
    dragHandlers: { onDragOver, onDragLeave, onDrop },
    onPaste,
  }
}
