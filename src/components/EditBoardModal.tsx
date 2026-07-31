"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Image as ImageIcon,
  Loader2,
  Upload,
  Folder,
  Briefcase,
  Layout,
  Activity,
  Star,
  Heart,
  Target,
  Compass,
  Rocket,
  Map,
  Download,
  Pencil,
  Trash2,
} from "lucide-react"
import { deleteBoard, updateBoard } from "@/app/actions"
import { useModal } from "@/components/providers/ModalProvider"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { getBoardCoverUrl } from "@/lib/attachment-url"
import { resolveBoardIconId } from "@/lib/board-icons"

const AVAILABLE_ICONS = [
  { id: "Folder", icon: Folder },
  { id: "Briefcase", icon: Briefcase },
  { id: "Layout", icon: Layout },
  { id: "Activity", icon: Activity },
  { id: "Star", icon: Star },
  { id: "Heart", icon: Heart },
  { id: "Target", icon: Target },
  { id: "Compass", icon: Compass },
  { id: "Rocket", icon: Rocket },
  { id: "Map", icon: Map },
]

const COVER_PRESETS = [
  "",
  "https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=800&q=80",
  "https://images.unsplash.com/photo-1557683316-973673baf926?w=800&q=80",
  "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800&q=80",
  "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&q=80",
  "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=800&q=80",
]

export default function EditBoardModal({
  board,
  onClose,
}: {
  board: any
  onClose: () => void
}) {
  const router = useRouter()
  const { showAlert, showConfirm } = useModal()
  const [name, setName] = useState(board.name)
  const [identifier, setIdentifier] = useState(board.identifier)
  const [coverImage, setCoverImage] = useState(board.coverImage || "")
  const [icon, setIcon] = useState(resolveBoardIconId(board.icon))
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  const SelectedIcon =
    AVAILABLE_ICONS.find((i) => i.id === icon)?.icon ?? Folder
  const previewCover = getBoardCoverUrl(coverImage)

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    const formData = new FormData()
    formData.append("file", file)
    formData.append("boardId", board.id)

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData })
      const data = await res.json()
      if (data.attachment) {
        setCoverImage(data.url || data.attachment.path)
      }
    } catch (err) {
      console.error("Upload error", err)
      await showAlert("Yükleme sırasında hata oluştu")
    } finally {
      setIsUploading(false)
      e.target.value = ""
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await updateBoard(board.id, { name, identifier, coverImage, icon })
      onClose()
    } catch (err) {
      console.error(err)
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    const confirmed = await showConfirm(
      `"${board.name}" projesini ve içindeki tüm kartları, sohbetleri kalıcı olarak silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`,
    )
    if (!confirmed) return

    setIsDeleting(true)
    try {
      await deleteBoard(board.id)
      onClose()
      router.push("/")
      router.refresh()
    } catch (err) {
      console.error(err)
      await showAlert(
        err instanceof Error ? err.message : "Proje silinirken hata oluştu",
      )
      setIsDeleting(false)
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Pencil className="size-5" />
            </div>
            <div>
              <DialogTitle>Projeyi Düzenle</DialogTitle>
              <DialogDescription>
                Proje adı, ikon, tanımlayıcı ve kapak görselini güncelleyin
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Önizleme */}
          <div className="overflow-hidden rounded-2xl border border-border bg-linear-to-t from-primary/5 to-card">
            <div
              className={cn(
                "relative h-24 w-full",
                previewCover ? "bg-cover bg-center" : "bg-muted",
              )}
              style={
                previewCover
                  ? { backgroundImage: `url(${previewCover})` }
                  : undefined
              }
            >
              {previewCover ? (
                <div className="absolute inset-0 bg-linear-to-t from-card via-card/60 to-transparent" />
              ) : null}
            </div>
            <div className="flex items-center gap-3 px-4 py-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                <SelectedIcon className="size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-foreground">
                  {name || "Proje adı"}
                </p>
                <p className="font-mono text-xs text-muted-foreground">
                  {identifier || "ID"}
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-4 sm:items-center">
            <Label htmlFor="name" className="sm:text-right">
              Proje adı
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="sm:col-span-3"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-4 sm:items-start">
            <Label className="pt-2 sm:text-right">İkon</Label>
            <div className="flex flex-wrap gap-2 sm:col-span-3">
              {AVAILABLE_ICONS.map((item) => (
                <Button
                  key={item.id}
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setIcon(item.id)}
                  className={cn(
                    "size-10 rounded-xl",
                    icon === item.id &&
                      "border-primary/50 bg-primary/15 text-primary ring-2 ring-primary/20",
                  )}
                >
                  <item.icon className="size-4" />
                </Button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-4 sm:items-center">
            <div className="sm:text-right">
              <Label htmlFor="identifier">Tanımlayıcı</Label>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Görev ID&apos;lerinde kullanılır
              </p>
            </div>
            <Input
              id="identifier"
              value={identifier}
              onChange={(e) =>
                setIdentifier(
                  e.target.value
                    .toUpperCase()
                    .replace(/[^A-Z0-9]/g, "")
                    .substring(0, 5),
                )
              }
              required
              maxLength={5}
              className="w-full font-mono uppercase sm:col-span-3 sm:max-w-[120px]"
            />
          </div>

          <Separator />

          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <ImageIcon className="size-4 text-muted-foreground" />
              Kapak görseli
            </Label>

            <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
              {COVER_PRESETS.map((url, i) => {
                const isSelected = coverImage === url
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setCoverImage(url)}
                    className={cn(
                      "relative aspect-video overflow-hidden rounded-xl border-2 transition-all",
                      isSelected
                        ? "border-primary ring-2 ring-primary/20"
                        : "border-border hover:border-primary/40",
                      !url &&
                        "flex items-center justify-center bg-muted text-xs text-muted-foreground",
                    )}
                  >
                    {url ? (
                      <img
                        src={url}
                        alt=""
                        className="size-full object-cover"
                      />
                    ) : (
                      "Yok"
                    )}
                    {isSelected ? (
                      <span className="absolute inset-0 bg-primary/10" />
                    ) : null}
                  </button>
                )
              })}
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Input
                value={coverImage}
                onChange={(e) => setCoverImage(e.target.value)}
                placeholder="Özel görsel URL'si..."
                className="flex-1 text-sm"
              />
              <Button
                type="button"
                variant="outline"
                disabled={isUploading}
                onClick={() =>
                  document.getElementById(`cover-upload-${board.id}`)?.click()
                }
              >
                {isUploading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Upload className="size-4" />
                )}
                {isUploading ? "Yükleniyor..." : "Dosya Yükle"}
              </Button>
              <input
                id={`cover-upload-${board.id}`}
                type="file"
                onChange={handleFileUpload}
                accept="image/*"
                className="hidden"
              />
            </div>
          </div>

          <DialogFooter className="flex-col gap-2 border-t border-border pt-4 sm:flex-col">
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Kaydediliyor...
                </>
              ) : (
                "Değişiklikleri Kaydet"
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              render={
                <a
                  href={`/api/export/trello?boardId=${board.id}`}
                  download
                  title="Projeyi Trello JSON formatında indir"
                />
              }
            >
              <Download className="size-4" />
              Trello (JSON) Dışa Aktar
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="w-full"
              disabled={isDeleting || isSubmitting}
              onClick={handleDelete}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Siliniyor...
                </>
              ) : (
                <>
                  <Trash2 className="size-4" />
                  Projeyi Sil
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={onClose}
            >
              İptal
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
