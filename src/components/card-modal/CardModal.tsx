"use client"

import { useState, useEffect } from "react"
import {
  ChevronLeft,
  ChevronRight,
  Copy,
  History,
  LayoutGrid,
  MessageSquare,
  X,
  Clock,
} from "lucide-react"
import { useRouter } from "next/navigation"
import {
  updateCardTitle,
  updateCardDescription,
  updateCardDates,
  moveCard,
  toggleCardAssignee,
  updateCardPriority,
  updateCardTags,
  addChecklistItem,
  toggleChecklistItem,
  deleteChecklistItem,
  deleteAttachment,
  editChecklistItem,
  addCardComment,
  updateCardCover,
  getCardDescriptionHistory,
  createShareLink,
} from "@/app/actions"
import FileUploader from "@/components/FileUploader"
import ConfirmModal from "@/components/ConfirmModal"
import RichTextEditor from "@/components/RichTextEditor"
import { useModal } from "@/components/providers/ModalProvider"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { getUserDisplayName, getUserInitial } from "@/lib/user"
import { getAttachmentUrl, toAbsoluteUrl } from "@/lib/attachment-url"
import { CardModalHeader } from "./card-modal-header"
import { CardModalProperties } from "./card-modal-properties"
import { CardModalChecklist } from "./card-modal-checklist"
import { CardModalAttachments } from "./card-modal-attachments"
import { CardModalActivity } from "./card-modal-activity"
import { AttachmentShareLinkDialog } from "./AttachmentShareLinkDialog"
import { ShareCardToChatDialog } from "@/components/chat/ShareCardToChatDialog"

export default function CardModal({
  card,
  onClose,
  userRole,
  boardId,
  boardIdentifier = "ATF",
  boardColumns = [],
  boardMembers = [],
  canAssignAssignees = false,
}: {
  card: any
  onClose: () => void
  userRole: string
  boardId: string
  boardIdentifier?: string
  boardColumns?: any[]
  boardMembers?: any[]
  canAssignAssignees?: boolean
}) {
  const { showAlert } = useModal()
  const router = useRouter()

  const [desc, setDesc] = useState(card.description || "")
  const [title, setTitle] = useState(card.title || "")
  const [localAssignees, setLocalAssignees] = useState<any[]>(card.assignees ?? [])
  const [isSaving, setIsSaving] = useState(false)
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const [newChecklistItem, setNewChecklistItem] = useState("")
  const [confirmDeleteAttachmentId, setConfirmDeleteAttachmentId] =
    useState<string | null>(null)
  const [previewImage, setPreviewImage] = useState<{
    id: string
    name: string
    url: string
  } | null>(null)
  const [commentText, setCommentText] = useState("")
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [historyData, setHistoryData] = useState<any[]>([])
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const [showShareDialog, setShowShareDialog] = useState(false)
  const [shareLinkDialog, setShareLinkDialog] = useState<{
    url: string | null
    filename: string | null
    loading: boolean
    error: string | null
  }>({
    url: null,
    filename: null,
    loading: false,
    error: null,
  })

  const currentColumn =
    boardColumns.find((c) => c.id === card.columnId) || card.column
  const boardName = currentColumn?.board?.name || "Proje"
  const columnName = currentColumn?.name || "Sütun"

  useEffect(() => {
    if (title === (card.title || "")) return
    const timer = setTimeout(() => {
      updateCardTitle(card.id, title).then(() => router.refresh())
    }, 1000)
    return () => clearTimeout(timer)
  }, [title, card.title, card.id, router])

  useEffect(() => {
    if (desc === (card.description || "")) return
    const timer = setTimeout(() => {
      updateCardDescription(card.id, desc).then(() => router.refresh())
    }, 1000)
    return () => clearTimeout(timer)
  }, [desc, card.description, card.id, router])

  useEffect(() => {
    if (!previewImage) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setPreviewImage(null)
        return
      }
      const imageAttachments =
        card.attachments?.filter((f: any) =>
          f.mimeType?.startsWith("image/"),
        ) || []
      if (imageAttachments.length <= 1) return
      const currentIndex = imageAttachments.findIndex(
        (f: any) => f.id === previewImage.id,
      )
      if (currentIndex === -1) return
      if (e.key === "ArrowRight") {
        const next = imageAttachments[(currentIndex + 1) % imageAttachments.length]
        setPreviewImage({
          id: next.id,
          name: next.filename,
          url: getAttachmentUrl(next),
        })
      } else if (e.key === "ArrowLeft") {
        const prev =
          imageAttachments[
            (currentIndex - 1 + imageAttachments.length) %
              imageAttachments.length
          ]
        setPreviewImage({
          id: prev.id,
          name: prev.filename,
          url: getAttachmentUrl(prev),
        })
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [previewImage, card.attachments])

  useEffect(() => {
    if (!showHistory) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowHistory(false)
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [showHistory])

  const handleSaveDesc = async () => {
    setIsSaving(true)
    await updateCardDescription(card.id, desc)
    setIsSaving(false)
    router.refresh()
  }

  const handleStatusChange = async (colId: string) => {
    setOpenDropdown(null)
    if (colId === card.columnId) return
    await moveCard(card.id, colId, 0)
    router.refresh()
  }

  const handleAssigneeChange = async (userId: string) => {
    if (!canAssignAssignees) {
      await showAlert("Sorumlu atama yetkiniz yok")
      return
    }

    // Optimistic UI: anında güncelle
    const isCurrentlyAssigned = localAssignees.some((a: any) => a.id === userId)
    if (isCurrentlyAssigned) {
      setLocalAssignees((prev) => prev.filter((a: any) => a.id !== userId))
    } else {
      const member = boardMembers.find((m) => m.user?.id === userId || m.userId === userId)
      if (member?.user) {
        setLocalAssignees((prev) => [...prev, member.user])
      }
    }

    await toggleCardAssignee(card.id, userId)
    router.refresh()
  }

  const handleAdvancedDateSave = async (data: any) => {
    setOpenDropdown(null)
    await updateCardDates(
      card.id,
      data.startDate,
      data.dueDate,
      data.reminderMinutes,
      data.isRecurring,
    )
    router.refresh()
  }

  const handleAdvancedDateRemove = async () => {
    setOpenDropdown(null)
    await updateCardDates(card.id, null, null, null, false)
    router.refresh()
  }

  const handlePriorityChange = async (priority: string) => {
    setOpenDropdown(null)
    if (priority === card.priority) return
    await updateCardPriority(card.id, priority)
    router.refresh()
  }

  const handleTagsChange = async (tags: string[]) => {
    await updateCardTags(card.id, tags)
    router.refresh()
  }

  const handleAddChecklist = async (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && newChecklistItem.trim()) {
      await addChecklistItem(card.id, newChecklistItem.trim())
      setNewChecklistItem("")
      router.refresh()
    }
  }

  const handleToggleChecklist = async (itemId: string, newStatus: boolean) => {
    await toggleChecklistItem(itemId, newStatus)
    router.refresh()
  }

  const handleDeleteChecklist = async (itemId: string) => {
    await deleteChecklistItem(itemId)
    router.refresh()
  }

  const handleEditChecklist = async (itemId: string, content: string) => {
    if (content.trim()) {
      await editChecklistItem(itemId, content.trim())
      router.refresh()
    }
  }

  const handleCopyLink = async (file: { id: string; filename?: string | null }) => {
    setShareLinkDialog({
      url: null,
      filename: file.filename ?? null,
      loading: true,
      error: null,
    })

    try {
      const link = await createShareLink(file.id)
      const fullUrl = toAbsoluteUrl(link)

      setShareLinkDialog({
        url: fullUrl,
        filename: file.filename ?? null,
        loading: false,
        error: null,
      })

      try {
        await navigator.clipboard.writeText(fullUrl)
      } catch {
        // Kullanıcı popup'tan kopyalayabilir
      }
    } catch {
      setShareLinkDialog({
        url: null,
        filename: file.filename ?? null,
        loading: false,
        error:
          "OpenCloud bağlantısı oluşturulamadı. Dosyanın OpenCloud'a yüklendiğinden ve OPENCLOUD_ENABLED ayarının açık olduğundan emin olun.",
      })
    }
  }

  const handleDeleteAttachment = async (
    attachmentId: string,
    e?: React.MouseEvent,
  ) => {
    e?.stopPropagation()
    setConfirmDeleteAttachmentId(attachmentId)
  }

  const handleUploadComplete = () => router.refresh()

  const handleCommentSubmit = async () => {
    if (!commentText.trim()) return
    setIsSubmittingComment(true)
    await addCardComment(card.id, commentText.trim())
    setCommentText("")
    setIsSubmittingComment(false)
    router.refresh()
  }

  const handleMakeCover = async (attachmentId: string) => {
    await updateCardCover(card.id, attachmentId, card.coverMode)
    router.refresh()
  }

  const handleToggleCoverMode = async () => {
    const newMode = card.coverMode === "CONTAIN" ? "COVER" : "CONTAIN"
    await updateCardCover(card.id, card.coverAttachmentId, newMode)
    router.refresh()
  }

  const handleViewHistory = async () => {
    setShowHistory(true)
    setIsLoadingHistory(true)
    try {
      setHistoryData(await getCardDescriptionHistory(card.id))
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoadingHistory(false)
    }
  }

  const handleDownloadAll = async () => {
    try {
      const JSZip = (await import("jszip")).default
      const { saveAs } = await import("file-saver")
      const zip = new JSZip()
      const folderName = card.title
        ? card.title.replace(/[^a-zA-Z0-9 ığüşöçİĞÜŞÖÇ-]/g, "")
        : "Dosyalar"
      const folder = zip.folder(folderName)
      if (!folder) return
      await Promise.all(
        (card.attachments || []).map(async (file: any) => {
          try {
            const res = await fetch(getAttachmentUrl(file))
            folder.file(file.filename || "dosya", await res.blob())
          } catch (err) {
            console.error("Dosya indirilemedi:", file.filename, err)
          }
        }),
      )
      saveAs(await zip.generateAsync({ type: "blob" }), `${folderName}.zip`)
    } catch (err) {
      console.error("ZIP oluşturulurken hata:", err)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3 backdrop-blur-sm sm:p-6"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <FileUploader
        cardId={card.id}
        onUploadSuccess={handleUploadComplete}
        className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-border/80 bg-card shadow-2xl"
      >
        <div
          className="flex min-h-0 flex-1 flex-col overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <CardModalHeader
            boardName={boardName}
            columnName={columnName}
            boardIdentifier={boardIdentifier}
            sequenceId={card.sequenceId}
            hasCover={!!card.coverAttachmentId}
            coverMode={card.coverMode}
            onToggleCoverMode={handleToggleCoverMode}
            onClose={onClose}
          />

          <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[1fr_340px]">
            <ScrollArea className="min-h-0">
              <div className="space-y-6 p-5 sm:p-6">
                <div className="group flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="mb-1 font-mono text-xs text-muted-foreground">
                      {boardIdentifier}-{card.sequenceId}
                    </p>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full bg-transparent text-xl font-bold text-foreground placeholder:text-muted-foreground focus:outline-none sm:text-2xl"
                      placeholder="Görev başlığı..."
                    />
                  </div>
                  <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      title="Sohbete ilet"
                      onClick={() => setShowShareDialog(true)}
                    >
                      <MessageSquare className="size-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={async () => {
                        await navigator.clipboard.writeText(
                          `${boardIdentifier}-${card.sequenceId} ${title}`,
                        )
                        showAlert("Başlık kopyalandı!")
                      }}
                    >
                      <Copy className="size-4" />
                    </Button>
                  </div>
                </div>

                <CardModalProperties
                  card={{ ...card, assignees: localAssignees }}
                  boardColumns={boardColumns}
                  boardMembers={boardMembers}
                  openDropdown={openDropdown}
                  setOpenDropdown={setOpenDropdown}
                  onStatusChange={handleStatusChange}
                  onAssigneeChange={handleAssigneeChange}
                  onPriorityChange={handlePriorityChange}
                  onDateSave={handleAdvancedDateSave}
                  onDateRemove={handleAdvancedDateRemove}
                  onTagsChange={handleTagsChange}
                  canAssignAssignees={canAssignAssignees}
                />

                <section className="rounded-xl border border-border/60 bg-muted/10 p-4">
                  <div className="mb-4 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <LayoutGrid className="size-4 text-primary" />
                      <h2 className="text-sm font-semibold">Açıklama</h2>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 gap-1.5 text-xs"
                        onClick={async () => {
                          const tempDiv = document.createElement("div")
                          tempDiv.innerHTML = desc
                          await navigator.clipboard.writeText(tempDiv.innerText)
                          showAlert("Açıklama kopyalandı!")
                        }}
                      >
                        <Copy className="size-3.5" />
                        Kopyala
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 gap-1.5 text-xs"
                        onClick={handleViewHistory}
                      >
                        <History className="size-3.5" />
                        Geçmişi Gör
                      </Button>
                    </div>
                  </div>
                  <RichTextEditor content={desc} onChange={setDesc} />
                </section>

                <CardModalChecklist
                  items={card.checklists || []}
                  newItem={newChecklistItem}
                  onNewItemChange={setNewChecklistItem}
                  onAddItem={handleAddChecklist}
                  onToggle={handleToggleChecklist}
                  onDelete={handleDeleteChecklist}
                  onEdit={handleEditChecklist}
                />

                <CardModalAttachments
                  cardId={card.id}
                  cardTitle={card.title}
                  attachments={card.attachments || []}
                  coverAttachmentId={card.coverAttachmentId}
                  onPreview={setPreviewImage}
                  onCopyLink={handleCopyLink}
                  onDelete={handleDeleteAttachment}
                  onMakeCover={handleMakeCover}
                  onDownloadAll={handleDownloadAll}
                />

                <div className="mt-8 block lg:hidden">
                  <CardModalActivity
                    activities={card.activities || []}
                    comments={card.comments || []}
                    commentText={commentText}
                    isSubmittingComment={isSubmittingComment}
                    onCommentChange={setCommentText}
                    onCommentSubmit={handleCommentSubmit}
                    inlineMobile
                  />
                </div>
              </div>
            </ScrollArea>

            <CardModalActivity
              activities={card.activities || []}
              comments={card.comments || []}
              commentText={commentText}
              isSubmittingComment={isSubmittingComment}
              onCommentChange={setCommentText}
              onCommentSubmit={handleCommentSubmit}
            />
          </div>

          <footer className="flex shrink-0 items-center justify-end border-t border-border/80 bg-card/80 px-5 py-3 backdrop-blur-sm sm:px-6">
            <Button onClick={handleSaveDesc} disabled={isSaving}>
              {isSaving ? "Kaydediliyor..." : "Kaydet"}
            </Button>
          </footer>
        </div>
      </FileUploader>

      {previewImage ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90"
          onClick={(e) => {
            if (e.target === e.currentTarget) setPreviewImage(null)
          }}
        >
          <Button
            type="button"
            variant="secondary"
            size="icon"
            className="absolute top-4 right-4 rounded-full"
            onClick={(e) => {
              e.stopPropagation()
              setPreviewImage(null)
            }}
          >
            <X className="size-5" />
          </Button>
          <p className="absolute top-4 left-4 rounded-lg bg-black/50 px-4 py-2 text-sm font-medium backdrop-blur-md">
            {previewImage.name}
          </p>
          {(() => {
            const imageAttachments =
              card.attachments?.filter((f: any) =>
                f.mimeType?.startsWith("image/"),
              ) || []
            const hasMultiple = imageAttachments.length > 1
            const currentIndex = imageAttachments.findIndex(
              (f: any) => f.id === previewImage.id,
            )
            return (
              <>
                {hasMultiple ? (
                  <Button
                    type="button"
                    variant="secondary"
                    size="icon"
                    className="absolute top-1/2 left-4 -translate-y-1/2 rounded-full"
                    onClick={(e) => {
                      e.stopPropagation()
                      const prev =
                        imageAttachments[
                          (currentIndex - 1 + imageAttachments.length) %
                            imageAttachments.length
                        ]
                      setPreviewImage({
                        id: prev.id,
                        name: prev.filename,
                        url: getAttachmentUrl(prev),
                      })
                    }}
                  >
                    <ChevronLeft className="size-6" />
                  </Button>
                ) : null}
                <img
                  src={previewImage.url}
                  alt={previewImage.name}
                  className="max-h-[90vh] max-w-[90vw] rounded object-contain shadow-2xl"
                  onClick={(e) => e.stopPropagation()}
                />
                {hasMultiple ? (
                  <Button
                    type="button"
                    variant="secondary"
                    size="icon"
                    className="absolute top-1/2 right-4 -translate-y-1/2 rounded-full"
                    onClick={(e) => {
                      e.stopPropagation()
                      const next =
                        imageAttachments[
                          (currentIndex + 1) % imageAttachments.length
                        ]
                      setPreviewImage({
                        id: next.id,
                        name: next.filename,
                        url: getAttachmentUrl(next),
                      })
                    }}
                  >
                    <ChevronRight className="size-6" />
                  </Button>
                ) : null}
              </>
            )
          })()}
        </div>
      ) : null}

      {showHistory ? (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowHistory(false)
          }}
        >
          <div
            className="flex max-h-[80vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <h2 className="flex items-center gap-2 text-lg font-bold">
                <History className="size-5 text-primary" />
                Açıklama Sürüm Geçmişi
              </h2>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => setShowHistory(false)}
              >
                <X className="size-5" />
              </Button>
            </div>
            <ScrollArea className="flex-1 p-6">
              {isLoadingHistory ? (
                <p className="py-4 text-center text-muted-foreground">
                  Yükleniyor...
                </p>
              ) : historyData.length === 0 ? (
                <p className="py-4 text-center text-muted-foreground">
                  Henüz bir geçmiş kaydı yok.
                </p>
              ) : (
                <div className="space-y-4">
                  {historyData.map((hist) => (
                    <div
                      key={hist.id}
                      className="rounded-xl border border-border bg-muted/30 p-4"
                    >
                      <div className="mb-3 flex items-center justify-between border-b border-border pb-2">
                        <span className="text-sm font-semibold">
                          {getUserDisplayName(hist.user, "Bilinmeyen")}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="size-3.5" />
                          {new Date(hist.createdAt).toLocaleString("tr-TR")}
                        </span>
                      </div>
                      {hist.content ? (
                        <div
                          className="prose prose-invert max-w-none text-sm"
                          dangerouslySetInnerHTML={{ __html: hist.content }}
                        />
                      ) : (
                        <span className="text-sm italic text-muted-foreground">
                          Boş içerik
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
      ) : null}

      {showShareDialog ? (
        <ShareCardToChatDialog
          cardId={card.id}
          boardId={boardId}
          boardIdentifier={boardIdentifier}
          sequenceId={card.sequenceId}
          cardTitle={title}
          onClose={() => setShowShareDialog(false)}
        />
      ) : null}

      <AttachmentShareLinkDialog
        open={
          shareLinkDialog.loading ||
          Boolean(shareLinkDialog.url) ||
          Boolean(shareLinkDialog.error)
        }
        onOpenChange={(open) => {
          if (!open) {
            setShareLinkDialog({
              url: null,
              filename: null,
              loading: false,
              error: null,
            })
          }
        }}
        url={shareLinkDialog.url}
        filename={shareLinkDialog.filename}
        loading={shareLinkDialog.loading}
        error={shareLinkDialog.error}
      />

      <ConfirmModal
        isOpen={!!confirmDeleteAttachmentId}
        title="Dosyayı Sil"
        message="Bu dosyayı silmek istediğinize emin misiniz? Bu işlem geri alınamaz."
        confirmText="Sil"
        isDestructive
        onConfirm={async () => {
          if (confirmDeleteAttachmentId) {
            await deleteAttachment(confirmDeleteAttachmentId)
            setConfirmDeleteAttachmentId(null)
            router.refresh()
          }
        }}
        onCancel={() => setConfirmDeleteAttachmentId(null)}
      />
    </div>
  )
}
