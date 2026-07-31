import { prisma } from "@/lib/prisma"
import { stripMentionTokens } from "@/lib/chat-mentions"
import { getAppBaseUrl, getTelegramPublicAppUrl } from "@/lib/public-app-url"
import { sendTelegramMessage } from "@/lib/telegram/api"
import { isTelegramEnabled } from "@/lib/telegram/config"

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
}

export async function notifyMentionedUsersOnTelegram(params: {
  mentionedUserIds: string[]
  authorId: string
  authorName: string
  groupId: string
  groupName: string
  messagePreview: string
}) {
  if (!isTelegramEnabled()) return

  const targetIds = params.mentionedUserIds.filter(
    (userId) => userId !== params.authorId,
  )
  if (targetIds.length === 0) return

  const users = await prisma.user.findMany({
    where: {
      id: { in: targetIds },
      telegramUserId: { not: null },
      isActive: true,
    },
    select: { telegramUserId: true },
  })

  if (users.length === 0) return

  const preview = stripMentionTokens(params.messagePreview).trim().slice(0, 160)
  const baseUrl = getTelegramPublicAppUrl() || getAppBaseUrl()
  const chatUrl = baseUrl
    ? `${baseUrl}/chat?group=${encodeURIComponent(params.groupId)}`
    : null

  const text = chatUrl
    ? `📌 <b>${escapeHtml(params.authorName)}</b> sizi <b>${escapeHtml(params.groupName)}</b> grubunda etiketledi:\n\n<i>${escapeHtml(preview || "Mesaj")}</i>\n\n<a href="${chatUrl}">Sohbete git</a>`
    : `📌 <b>${escapeHtml(params.authorName)}</b> sizi <b>${escapeHtml(params.groupName)}</b> grubunda etiketledi:\n\n<i>${escapeHtml(preview || "Mesaj")}</i>`

  await Promise.allSettled(
    users.map((user) =>
      sendTelegramMessage({
        chatId: user.telegramUserId!,
        text,
        parseMode: "HTML",
        disableLinkPreview: true,
      }),
    ),
  )
}
