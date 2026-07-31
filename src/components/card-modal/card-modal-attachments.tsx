"use client"

import {
  Copy,
  Download,
  ExternalLink,
  FileIcon,
  Image as ImageIcon,
  Paperclip,
  Plus,
  Trash2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { getAttachmentUrl } from "@/lib/attachment-url"

type CardModalAttachmentsProps = {
  cardId: string
  cardTitle: string
  attachments: any[]
  coverAttachmentId?: string | null
  onPreview: (file: { id: string; name: string; url: string }) => void
  onCopyLink: (file: any) => void
  onDelete: (attachmentId: string, e?: React.MouseEvent) => void
  onMakeCover: (attachmentId: string) => void
  onDownloadAll: () => void
}

export function CardModalAttachments({
  cardId,
  cardTitle,
  attachments,
  coverAttachmentId,
  onPreview,
  onCopyLink,
  onDelete,
  onMakeCover,
  onDownloadAll,
}: CardModalAttachmentsProps) {
  return (
    <section className="rounded-xl border border-border/60 bg-muted/10 p-4">
      <div className="mb-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Paperclip className="size-4 text-primary" />
          <h3 className="text-sm font-semibold">
            Dosyalar
            <span className="ml-1.5 font-normal text-muted-foreground">
              ({attachments.length})
            </span>
          </h3>
        </div>
        {attachments.length > 0 ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5 text-xs"
            onClick={onDownloadAll}
          >
            <Download className="size-3.5" />
            Topluca İndir
          </Button>
        ) : null}
      </div>

      {attachments.length > 0 ? (
        <div className="mb-3 space-y-2">
          {attachments.map((file) => {
            const isImage = file.mimeType?.startsWith("image/")
            const fileUrl = getAttachmentUrl(file)
            return (
              <div
                key={file.id}
                className="group relative flex items-center gap-3 rounded-xl border border-border/60 bg-card/60 p-2.5 transition-colors hover:bg-accent/40"
              >
                <button
                  type="button"
                  className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted"
                  onClick={() =>
                    isImage
                      ? onPreview({
                          id: file.id,
                          name: file.filename,
                          url: fileUrl,
                        })
                      : window.open(fileUrl, "_blank")
                  }
                >
                  {isImage ? (
                    <img
                      src={fileUrl}
                      alt={file.filename}
                      className="size-full object-cover"
                    />
                  ) : (
                    <FileIcon className="size-5 text-muted-foreground" />
                  )}
                </button>

                <button
                  type="button"
                  className="min-w-0 flex-1 pr-28 text-left"
                  onClick={() =>
                    isImage
                      ? onPreview({
                          id: file.id,
                          name: file.filename,
                          url: fileUrl,
                        })
                      : window.open(fileUrl, "_blank")
                  }
                >
                  <p className="truncate text-sm font-medium">
                    {file.filename || "İsimsiz Dosya"}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Ekleme:{" "}
                    {new Date(file.createdAt).toLocaleString("tr-TR", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </button>

                <div className="absolute top-1/2 right-2 flex -translate-y-1/2 items-center gap-0.5 rounded-lg border border-border/60 bg-card/95 p-0.5 opacity-0 shadow-sm backdrop-blur transition-opacity group-hover:opacity-100">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    render={
                      <a
                        href={fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                      />
                    }
                  >
                    <ExternalLink className="size-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      onCopyLink(file)
                    }}
                  >
                    <Copy className="size-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    render={
                      <a
                        href={fileUrl}
                        download={file.filename || "dosya"}
                        onClick={(e) => e.stopPropagation()}
                      />
                    }
                  >
                    <Download className="size-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="text-destructive hover:text-destructive"
                    onClick={(e) => onDelete(file.id, e)}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                  {isImage ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className={
                        coverAttachmentId === file.id
                          ? "text-primary"
                          : undefined
                      }
                      onClick={(e) => {
                        e.stopPropagation()
                        onMakeCover(file.id)
                      }}
                    >
                      <ImageIcon className="size-3.5" />
                    </Button>
                  ) : null}
                </div>
              </div>
            )
          })}
        </div>
      ) : null}

      <label
        htmlFor={`file-upload-${cardId}`}
        className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-primary/40 bg-primary/5 py-3 text-sm font-medium text-primary transition-colors hover:bg-primary/10"
      >
        <Plus className="size-4" />
        Dosya Ekle
      </label>
    </section>
  )
}
