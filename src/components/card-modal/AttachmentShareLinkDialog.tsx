"use client"

import { useEffect, useState } from "react"
import { Check, Copy, Loader2 } from "lucide-react"
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

type AttachmentShareLinkDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  url: string | null
  filename?: string | null
  loading?: boolean
  error?: string | null
}

export function AttachmentShareLinkDialog({
  open,
  onOpenChange,
  url,
  filename,
  loading = false,
  error = null,
}: AttachmentShareLinkDialogProps) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!open) {
      setCopied(false)
    }
  }, [open, url])

  const handleCopy = async () => {
    if (!url) return
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Dosya bağlantısı</DialogTitle>
          <DialogDescription>
            {filename
              ? `${filename} için paylaşılabilir bağlantı`
              : "Bu bağlantıyı kopyalayıp paylaşabilirsiniz."}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Bağlantı oluşturuluyor...
          </div>
        ) : error ? (
          <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        ) : url ? (
          <div className="space-y-2">
            <Input
              readOnly
              value={url}
              className="font-mono text-xs"
              onFocus={(e) => e.currentTarget.select()}
            />
            <p className="text-xs text-muted-foreground">
              Bağlantı panoya kopyalandı. Gerekirse tekrar kopyalayabilirsiniz.
            </p>
          </div>
        ) : null}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Kapat
          </Button>
          <Button
            type="button"
            disabled={!url || loading}
            onClick={() => void handleCopy()}
          >
            {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
            {copied ? "Kopyalandı" : "Kopyala"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
