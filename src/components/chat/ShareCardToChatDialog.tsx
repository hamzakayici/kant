"use client"

import { useEffect, useMemo, useState } from "react"
import { Loader2, MessageSquare, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { getUserChatGroups, shareCardToChat } from "@/app/actions/chatActions"
import { formatCardIdentifier } from "@/lib/card-share"
import {
  getLastShareChatGroupId,
  rememberLastShareChatGroupId,
} from "@/lib/card-share-preferences"

type ShareCardToChatDialogProps = {
  cardId: string
  boardId: string
  boardIdentifier: string
  sequenceId: number
  cardTitle: string
  onClose: () => void
}

export function ShareCardToChatDialog({
  cardId,
  boardId,
  boardIdentifier,
  sequenceId,
  cardTitle,
  onClose,
}: ShareCardToChatDialogProps) {
  const [groups, setGroups] = useState<
    Array<{ id: string; name: string; boardId: string }>
  >([])
  const [selectedGroupId, setSelectedGroupId] = useState("")
  const [note, setNote] = useState("")
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const cardLabel = formatCardIdentifier(boardIdentifier, sequenceId)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      try {
        const result = await getUserChatGroups()
        if (cancelled) return
        const mapped = result.map((group) => ({
          id: group.id,
          name: group.name,
          boardId: group.board.id,
        }))
        setGroups(mapped)

        const remembered = getLastShareChatGroupId(boardId)
        const preferred =
          mapped.find((group) => group.id === remembered)?.id ??
          mapped.find((group) => group.boardId === boardId)?.id ??
          mapped[0]?.id ??
          ""
        setSelectedGroupId(preferred)
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Sohbet grupları yüklenemedi")
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [boardId])

  const sortedGroups = useMemo(() => {
    return [...groups].sort((a, b) => {
      if (a.boardId === boardId && b.boardId !== boardId) return -1
      if (b.boardId === boardId && a.boardId !== boardId) return 1
      return a.name.localeCompare(b.name, "tr")
    })
  }, [groups, boardId])

  const handleSubmit = async () => {
    if (!selectedGroupId) return
    setSubmitting(true)
    setError(null)
    try {
      await shareCardToChat(cardId, selectedGroupId, note)
      rememberLastShareChatGroupId(boardId, selectedGroupId)
      const groupName =
        sortedGroups.find((group) => group.id === selectedGroupId)?.name ??
        "Sohbet"
      toast.success(`Kart ${groupName} konusuna iletildi`)
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Paylaşım başarısız")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4"
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => {
        e.stopPropagation()
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="w-full max-w-md rounded-xl border border-border bg-card p-5 shadow-2xl"
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h3 className="flex items-center gap-2 font-semibold text-foreground">
              <MessageSquare className="size-4" />
              Sohbete ilet
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {cardLabel} · {cardTitle}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : sortedGroups.length === 0 ? (
          <p className="py-6 text-sm text-muted-foreground">
            Paylaşılacak sohbet konusu bulunamadı.
          </p>
        ) : (
          <div className="space-y-4">
            <div>
              <Label htmlFor="share-chat-group">Sohbet konusu</Label>
              <select
                id="share-chat-group"
                value={selectedGroupId}
                onChange={(e) => setSelectedGroupId(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground outline-none"
              >
                {sortedGroups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                    {group.boardId === boardId ? " (bu proje)" : ""}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="share-note">Not (isteğe bağlı)</Label>
              <Input
                id="share-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Kartla birlikte gönderilecek kısa not"
                className="mt-1.5"
              />
            </div>
          </div>
        )}

        {error ? (
          <p className="mt-3 text-sm text-destructive">{error}</p>
        ) : null}

        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            İptal
          </Button>
          <Button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={submitting || loading || !selectedGroupId}
          >
            {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
            İlet
          </Button>
        </div>
      </div>
    </div>
  )
}
