import { getUserDisplayName } from "@/lib/user"
import {
  getAppBaseUrl,
  getTelegramPublicAppUrl,
  isClickableHttpUrl,
  isTelegramInlineButtonUrl,
} from "@/lib/public-app-url"

const cardShareRelations = {
  column: {
    select: {
      name: true,
      board: { select: { id: true, name: true, identifier: true } },
    },
  },
  assignees: {
    select: { firstName: true, lastName: true, email: true, color: true },
  },
  checklists: {
    select: { isDone: true },
  },
  attachments: {
    select: {
      id: true,
      path: true,
      remotePath: true,
      mimeType: true,
      filename: true,
    },
    orderBy: { createdAt: "desc" as const },
    take: 8,
  },
  _count: {
    select: { comments: true },
  },
} as const

export const cardShareInclude = cardShareRelations

export const cardShareSelect = {
  id: true,
  sequenceId: true,
  title: true,
  description: true,
  priority: true,
  dueDate: true,
  tags: true,
  coverAttachmentId: true,
  coverMode: true,
  ...cardShareRelations,
} as const

export type CardShareAttachment = {
  id: string
  path?: string | null
  remotePath?: string | null
  mimeType?: string | null
  filename?: string | null
}

export type CardShareSnapshot = {
  id: string
  sequenceId: number
  title: string
  description?: string | null
  priority: string
  dueDate?: string | Date | null
  tags?: string[]
  coverAttachmentId?: string | null
  coverMode?: string | null
  column: { name: string; board: { id: string; name: string; identifier: string } }
  assignees: Array<{
    firstName?: string | null
    lastName?: string | null
    email?: string | null
  }>
  checklists?: Array<{ isDone: boolean }>
  attachments?: CardShareAttachment[]
  _count?: { comments: number }
}

const PRIORITY_LABELS: Record<string, string> = {
  NONE: "Öncelik yok",
  LOW: "Düşük",
  MEDIUM: "Orta",
  HIGH: "Yüksek",
  URGENT: "Acil",
}

const PRIORITY_EMOJI: Record<string, string> = {
  URGENT: "🔴",
  HIGH: "🟠",
  MEDIUM: "🟡",
  LOW: "🔵",
  NONE: "⚪",
}

export function formatCardIdentifier(
  boardIdentifier: string,
  sequenceId: number,
) {
  return `${boardIdentifier}-${sequenceId}`
}

export function getCardShareUrl(boardId: string, cardId: string) {
  const base = getAppBaseUrl()
  const path = `/b/${boardId}?card=${cardId}`
  return base ? `${base}${path}` : path
}

/** Telegram mesajlarındaki linkler için (ngrok / production URL). */
export function getTelegramCardShareUrl(boardId: string, cardId: string) {
  const base = getTelegramPublicAppUrl()
  const path = `/b/${boardId}?card=${cardId}`
  return base ? `${base}${path}` : path
}

export function isClickableTelegramUrl(url: string) {
  return isClickableHttpUrl(url)
}

export { isTelegramInlineButtonUrl }

export function isPublicCardShareUrl(url: string) {
  return isClickableTelegramUrl(url)
}

export function getCardShareCover(card: CardShareSnapshot) {
  if (card.coverAttachmentId) {
    const cover = card.attachments?.find(
      (attachment) => attachment.id === card.coverAttachmentId,
    )
    if (cover) return cover
  }

  return (
    card.attachments?.find(
      (attachment) =>
        attachment.mimeType?.startsWith("image/") ||
        /\.(jpg|jpeg|png|gif|webp|avif)$/i.test(attachment.filename ?? ""),
    ) ?? null
  )
}

export function getCardShareChecklistStats(card: CardShareSnapshot) {
  const total = card.checklists?.length ?? 0
  const done = card.checklists?.filter((item) => item.isDone).length ?? 0
  return { total, done }
}

function escapeTelegramHtmlAttribute(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
}

export function telegramHtmlLink(url: string, label: string) {
  if (!isClickableTelegramUrl(url)) return label
  return `<a href="${escapeTelegramHtmlAttribute(url)}">${label}</a>`
}

export function formatCardSharePreview(card: CardShareSnapshot) {
  const identifier = formatCardIdentifier(
    card.column.board.identifier,
    card.sequenceId,
  )
  const assignees = card.assignees
    .map((user) => getUserDisplayName(user))
    .filter(Boolean)
    .join(", ")
  const checklist = getCardShareChecklistStats(card)
  const description = card.description?.trim() ?? ""
  const attachmentCount = card.attachments?.length ?? 0
  const commentCount = card._count?.comments ?? 0

  return {
    identifier,
    title: card.title,
    boardName: card.column.board.name,
    columnName: card.column.name,
    priorityLabel: PRIORITY_LABELS[card.priority] ?? card.priority,
    assignees,
    descriptionSnippet:
      description.length > 120 ? `${description.slice(0, 117)}...` : description,
    tags: card.tags ?? [],
    checklist,
    attachmentCount,
    commentCount,
    cover: getCardShareCover(card),
    url: getCardShareUrl(card.column.board.id, card.id),
    telegramUrl: getTelegramCardShareUrl(card.column.board.id, card.id),
  }
}

export function escapeTelegramHtml(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
}

export function formatCardShareTelegramHtml(
  card: CardShareSnapshot,
  note?: string,
) {
  const preview = formatCardSharePreview(card)
  const url = preview.telegramUrl
  const priorityEmoji = PRIORITY_EMOJI[card.priority] ?? "⚪"
  const identifier = escapeTelegramHtml(preview.identifier)
  const title = escapeTelegramHtml(preview.title)

  const blockLines = [
    `📁 <i>${escapeTelegramHtml(preview.boardName)}</i>`,
    `📌 ${escapeTelegramHtml(preview.columnName)}`,
    `${priorityEmoji} ${escapeTelegramHtml(preview.priorityLabel)}`,
  ]

  if (preview.assignees) {
    blockLines.push(`👤 ${escapeTelegramHtml(preview.assignees)}`)
  }

  if (card.dueDate) {
    const dueLabel = new Date(card.dueDate).toLocaleDateString("tr-TR", {
      day: "numeric",
      month: "short",
    })
    blockLines.push(`📅 ${dueLabel}`)
  }

  if (preview.checklist.total > 0) {
    blockLines.push(
      `✅ ${preview.checklist.done}/${preview.checklist.total} kontrol listesi`,
    )
  }

  if (preview.tags.length > 0) {
    blockLines.push(`🏷 ${escapeTelegramHtml(preview.tags.slice(0, 4).join(", "))}`)
  }

  if (preview.attachmentCount > 0) {
    blockLines.push(`📎 ${preview.attachmentCount} dosya`)
  }

  if (preview.commentCount > 0) {
    blockLines.push(`💬 ${preview.commentCount} yorum`)
  }

  if (preview.descriptionSnippet) {
    blockLines.push(`📝 ${escapeTelegramHtml(preview.descriptionSnippet)}`)
  }

  if (isClickableTelegramUrl(url)) {
    blockLines.push(`🔗 ${telegramHtmlLink(url, "Kartı aç")}`)
  }

  const lines = [
    `<b>${telegramHtmlLink(url, `📋 ${identifier}`)}</b>`,
    `<b>${telegramHtmlLink(url, title)}</b>`,
    "",
    `<blockquote>${blockLines.join("\n")}</blockquote>`,
  ]

  if (!isClickableTelegramUrl(url)) {
    lines.push("", `<code>${escapeTelegramHtml(preview.url)}</code>`)
  }

  const trimmedNote = note?.trim()
  if (trimmedNote) {
    lines.push("", `💬 <i>${escapeTelegramHtml(trimmedNote)}</i>`)
  }

  return lines.join("\n")
}

export function buildCardShareTelegramReplyMarkup(
  card: CardShareSnapshot,
  url?: string,
) {
  const shareUrl =
    url ?? getTelegramCardShareUrl(card.column.board.id, card.id)
  if (!isTelegramInlineButtonUrl(shareUrl)) return undefined

  return {
    inline_keyboard: [[{ text: "📋 Kartı aç", url: shareUrl }]],
  }
}

export type CardShareTelegramPayload = {
  text: string
  parseMode: "HTML"
  replyMarkup?: { inline_keyboard: Array<Array<{ text: string; url: string }>> }
  buttonUrl?: { label: string; url: string }
  disableLinkPreview: boolean
}

export function buildCardShareTelegramPayload(
  card: CardShareSnapshot,
  note?: string,
): CardShareTelegramPayload {
  const shareUrl = getTelegramCardShareUrl(card.column.board.id, card.id)
  const hasInlineButton = isTelegramInlineButtonUrl(shareUrl)

  return {
    text: formatCardShareTelegramHtml(card, note),
    parseMode: "HTML",
    disableLinkPreview: hasInlineButton,
    replyMarkup: hasInlineButton
      ? buildCardShareTelegramReplyMarkup(card, shareUrl)
      : undefined,
    buttonUrl: hasInlineButton
      ? { label: "📋 Kartı aç", url: shareUrl }
      : undefined,
  }
}

/** @deprecated Use buildCardShareTelegramPayload for Telegram outbound. */
export function formatCardShareTelegramText(
  card: CardShareSnapshot,
  note?: string,
) {
  const preview = formatCardSharePreview(card)
  const lines = [
    `📋 ${preview.identifier} · ${preview.title}`,
    `Proje: ${preview.boardName} · ${preview.columnName}`,
    `Öncelik: ${preview.priorityLabel}`,
  ]

  if (preview.assignees) {
    lines.push(`Atanan: ${preview.assignees}`)
  }

  lines.push(preview.url)

  const trimmedNote = note?.trim()
  if (trimmedNote) {
    lines.push("", trimmedNote)
  }

  return lines.join("\n")
}
