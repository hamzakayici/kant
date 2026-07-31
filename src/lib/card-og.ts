import { getTelegramPublicAppUrl } from "@/lib/public-app-url"

export function getCardOgImageUrl(boardId: string, cardId: string) {
  const base = getTelegramPublicAppUrl()
  if (!base) return null
  const params = new URLSearchParams({ boardId, cardId })
  return `${base}/api/og/card?${params.toString()}`
}
