"use client"

import { useState, useEffect, useRef } from "react"
import { Search, Loader2, X } from "lucide-react"
import { searchCards } from "@/app/actions"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { getUserDisplayName, getUserInitial } from "@/lib/user"
import { getAttachmentExternalUrl } from "@/lib/attachment-url"

export default function GlobalSearch({ boardId }: { boardId?: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [hoveredCard, setHoveredCard] = useState<any>(null)
  const router = useRouter()
  const searchRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
        setHoveredCard(null)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault()
        setIsOpen(true)
        const input = searchRef.current?.querySelector("input")
        input?.focus()
      }
      if (event.key === "Escape") {
        setIsOpen(false)
        setHoveredCard(null)
      }
    }
    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [])

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (isOpen && query.trim().length >= 2) {
        setIsSearching(true)
        try {
          const cards = await searchCards(query, boardId)
          setResults(cards)
          setHoveredCard((prev: any) => {
            if (!prev) return null
            return cards.find((c: any) => c.id === prev.id) || prev
          })
        } catch (error) {
          console.error("Search error:", error)
        } finally {
          setIsSearching(false)
        }
      } else if (!isOpen && query.trim().length < 2) {
        setResults([])
      }
    }, 400)

    return () => clearTimeout(delayDebounceFn)
  }, [query, boardId, isOpen])

  const getCoverUrl = (card: any) => {
    if (!card.attachments) return null
    let coverImage = null
    if (card.coverAttachmentId) {
      coverImage = card.attachments.find((a: any) => a.id === card.coverAttachmentId)
    }
    if (!coverImage) {
      coverImage = card.attachments.find(
        (att: any) =>
          att.mimeType?.startsWith("image/") ||
          /\.(jpg|jpeg|png|gif|webp|avif)$/i.test(att.filename ?? ""),
      )
    }
    if (coverImage) return getAttachmentExternalUrl(coverImage)
    return null
  }

  return (
    <div className="relative" ref={searchRef}>
      <div
        className={cn(
          "flex h-9 items-center overflow-hidden rounded-lg border border-border bg-card transition-all duration-300",
          isOpen
            ? "absolute inset-x-2 top-1.5 z-50 w-auto border-primary/50 md:static md:w-[360px]"
            : boardId
              ? "w-[140px] md:w-[240px]"
              : "w-[160px] md:w-[320px]",
        )}
      >
        <Search className="ml-3 size-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder={
            boardId ? "Bu panoda ara... (⌘K)" : "Tüm panolarda ara... (⌘K)"
          }
          className="border-0 bg-transparent shadow-none focus-visible:ring-0"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setIsOpen(true)
          }}
          onFocus={() => setIsOpen(true)}
        />
        {query ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="mr-1"
            onClick={() => {
              setQuery("")
              setResults([])
            }}
          >
            <X className="size-4" />
          </Button>
        ) : null}
      </div>

      {isOpen && query.trim().length >= 2 ? (
        <div className="absolute top-full right-0 z-50 mt-2 flex w-[calc(100vw-16px)] rounded-lg border border-border bg-popover shadow-2xl md:w-[480px]">
          {hoveredCard ? (
            <div className="pointer-events-none absolute top-0 right-[calc(100%+8px)] hidden w-[300px] flex-col overflow-hidden rounded-lg border border-border bg-popover shadow-2xl md:flex">
              {getCoverUrl(hoveredCard) ? (
                <div
                  className="h-32 w-full bg-cover bg-center"
                  style={{
                    backgroundImage: `url(${getCoverUrl(hoveredCard)})`,
                  }}
                />
              ) : (
                <div className="h-8 w-full bg-muted" />
              )}
              <div className="flex flex-col gap-2 p-4">
                <div className="flex flex-wrap gap-1.5">
                  {hoveredCard.tags?.map((t: string, i: number) => (
                    <Badge key={i} variant="secondary" className="text-[10px]">
                      {t}
                    </Badge>
                  ))}
                </div>
                <h4 className="text-sm leading-tight font-semibold text-foreground">
                  {hoveredCard.title}
                </h4>
                <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span
                    className="size-2 rounded-full"
                    style={{
                      backgroundColor:
                        hoveredCard.column.color || "var(--muted-foreground)",
                    }}
                  />
                  <span>
                    {hoveredCard.column.board.name} (
                    {hoveredCard.column.name})
                  </span>
                </div>
                {hoveredCard.assignees?.length > 0 ? (
                  <div className="mt-2 flex items-center gap-1">
                    {hoveredCard.assignees.map((user: any) => (
                      <Avatar key={user.id} className="size-6">
                        <AvatarFallback className="bg-primary text-[10px] font-bold text-primary-foreground">
                          {getUserInitial(user)}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}

          <div className="relative w-full">
            {isSearching ? (
              <div className="flex items-center justify-center gap-2 p-4 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                Aranıyor...
              </div>
            ) : results.length > 0 ? (
              <div className="custom-scrollbar max-h-[500px] overflow-y-auto p-2">
                <div className="mb-2 px-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                  Sonuçlar ({results.length})
                </div>
                <div className="flex flex-col gap-1">
                  {results.map((card) => (
                    <button
                      key={card.id}
                      type="button"
                      onClick={() => {
                        setIsOpen(false)
                        setHoveredCard(null)
                        router.push(
                          `/b/${card.column.boardId}?card=${card.id}`,
                        )
                      }}
                      onMouseEnter={() => setHoveredCard(card)}
                      onMouseLeave={() => setHoveredCard(null)}
                      className="flex w-full items-start gap-3 rounded-md p-2 text-left transition-colors hover:bg-accent"
                    >
                      <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded bg-muted">
                        {getCoverUrl(card) ? (
                          <img
                            src={getCoverUrl(card) || undefined}
                            className="size-full object-cover"
                            alt="kapak"
                          />
                        ) : (
                          <div className="relative size-5 rounded-sm border-2 border-muted-foreground">
                            <div className="absolute top-0.5 left-0.5 size-1 rounded-[1px] bg-muted-foreground" />
                          </div>
                        )}
                      </div>

                      <div className="flex min-w-0 flex-1 flex-col gap-1 pt-0.5">
                        <div className="flex items-start justify-between gap-2">
                          <span className="pr-2 text-sm font-medium break-words text-foreground">
                            {card.title}
                          </span>
                          <Badge
                            variant="secondary"
                            className="mt-0.5 shrink-0 text-[10px]"
                          >
                            {card.column.board.identifier}-{card.sequenceId}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <span
                            className="size-1.5 rounded-full"
                            style={{
                              backgroundColor:
                                card.column.color || "var(--muted-foreground)",
                            }}
                          />
                          {card.column.name} • {card.column.board.name}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-4 text-center text-sm text-muted-foreground">
                Sonuç bulunamadı.
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}
