import { prisma } from "@/lib/prisma"
import {
  createForumTopic,
  getForumTopic,
  getTelegramChat,
  getTelegramUpdates,
  safeTelegramCall,
  sendTelegramMessage,
  sendTelegramMediaFile,
  downloadTelegramFile,
  type TelegramMessage,
} from "./api"
import { isTelegramEnabled } from "./config"
import { storeFile, readStoredFile, ensureBoardOpenCloudStructure } from "@/lib/storage"
import {
  extractTelegramMedia,
  isAudioMimeType,
  isImageMimeType,
  isVideoMimeType,
} from "./media"
import { getTelegramSupergroupId, setTelegramSupergroupId, GENERAL_FORUM_TOPIC_ID, getTelegramGeneralTopicName, setTelegramGeneralTopicName } from "./settings"
import { sendUserForumMessage, sendUserForumFiles } from "./mtproto"
import { resolveUserReplyTelegramMessageId } from "./reply"
import { resolveTelegramOutboundSender } from "./outbound-sender"
import {
  cardShareInclude,
  buildCardShareTelegramPayload,
  type CardShareSnapshot,
} from "@/lib/card-share"
import { stripMentionTokens } from "@/lib/chat-mentions"

export { GENERAL_FORUM_TOPIC_ID } from "./settings"
export { resolveUserReplyTelegramMessageId } from "./reply"
export { TelegramSenderNotReadyError } from "./outbound-sender"

type ForumTopicMessage = {
  message_thread_id?: number
  chat: { is_forum?: boolean }
  reply_to_message?: { message_thread_id?: number }
}

/** Forum mesajından Kant topic ID'si (Genel konu = 1). */
export function resolveForumTopicId(message: ForumTopicMessage): number | undefined {
  if (message.message_thread_id) return message.message_thread_id
  if (message.chat.is_forum) return GENERAL_FORUM_TOPIC_ID
  return undefined
}

/**
 * Gelen Telegram mesajı için konu ID'si.
 * Genel konuda message_thread_id olmayabilir; is_forum da güncellemede eksik gelebilir.
 */
export async function resolveInboundForumTopicId(
  chatId: string,
  message: ForumTopicMessage,
): Promise<number | undefined> {
  const direct = resolveForumTopicId(message)
  if (direct) return direct

  const fromReply = message.reply_to_message?.message_thread_id
  if (fromReply) return fromReply

  const supergroupId = await getTelegramSupergroupId()
  if (!supergroupId || chatId !== supergroupId) return undefined

  if (message.chat.is_forum) return GENERAL_FORUM_TOPIC_ID

  const isForum = await isTelegramChatForum(chatId)
  return isForum ? GENERAL_FORUM_TOPIC_ID : undefined
}

export function toTelegramThreadId(topicId?: number | null): number | undefined {
  if (!topicId || topicId === GENERAL_FORUM_TOPIC_ID) return undefined
  return topicId
}

async function getDefaultBoardId(): Promise<string | null> {
  const board = await prisma.board.findFirst({
    orderBy: { order: "asc" },
    select: { id: true },
  })
  return board?.id ?? null
}

async function ensureGroupMembers(chatGroupId: string) {
  const users = await prisma.user.findMany({
    where: { isActive: true },
    select: { id: true },
  })

  await prisma.chatGroupMember.createMany({
    data: users.map((user) => ({
      chatGroupId,
      userId: user.id,
    })),
    skipDuplicates: true,
  })
}

export function isPlaceholderTopicName(name: string, topicId?: number) {
  if (/^Konu #\d+$/.test(name.trim())) return true
  if (topicId !== undefined && name.trim() === `Konu #${topicId}`) return true
  return false
}

type TopicNameMessage = {
  text?: string
  caption?: string
  message_thread_id?: number
  forum_topic_created?: { name: string }
  forum_topic_edited?: { name: string }
  reply_to_message?: {
    message_thread_id?: number
    text?: string
    caption?: string
    forum_topic_created?: { name: string }
    forum_topic_edited?: { name: string }
  }
}

export function parseTopicNameFromMessage(message: TopicNameMessage): string | null {
  if (message.forum_topic_edited?.name) {
    return message.forum_topic_edited.name.trim()
  }
  if (message.forum_topic_created?.name) {
    return message.forum_topic_created.name.trim()
  }

  const text = message.text?.trim() || message.caption?.trim()
  if (!text) return null

  const patterns = [
    /Konu adını ['"](.+?)['"] olarak değiştirdiniz/i,
    /Topic .+? renamed to ['"](.+?)['"]/i,
    /['"](.+?)['"] konusu oluşturuldu/i,
    /Topic ['"](.+?)['"] created/i,
  ]

  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match?.[1]) return match[1].trim()
  }

  return null
}

/** Telegram'daki gerçek konu adını mesajdan çıkarır (reply_to_message dahil). */
export function resolveTopicNameFromMessage(
  message: TopicNameMessage,
): string | null {
  const direct = parseTopicNameFromMessage(message)
  if (direct && !isPlaceholderTopicName(direct, message.message_thread_id)) {
    return direct
  }

  const reply = message.reply_to_message
  if (!reply) return direct

  if (reply.forum_topic_edited?.name) {
    return reply.forum_topic_edited.name.trim()
  }

  if (reply.forum_topic_created?.name) {
    const sameTopic =
      !message.message_thread_id ||
      !reply.message_thread_id ||
      reply.message_thread_id === message.message_thread_id

    if (sameTopic) {
      return reply.forum_topic_created.name.trim()
    }
  }

  const replyParsed = parseTopicNameFromMessage(reply)
  if (replyParsed && !isPlaceholderTopicName(replyParsed, message.message_thread_id)) {
    return replyParsed
  }

  return direct
}

function collectTopicNamesFromUpdate(
  message: TopicNameMessage & { chat: { id: number; is_forum?: boolean } },
  supergroupId: string,
  topicNames: Map<number, string>,
) {
  if (String(message.chat.id) !== supergroupId) return

  const topicId =
    message.message_thread_id ??
    (message.chat.is_forum ? GENERAL_FORUM_TOPIC_ID : undefined)

  if (message.forum_topic_created && topicId) {
    topicNames.set(topicId, message.forum_topic_created.name)
  }

  if (message.forum_topic_edited && topicId) {
    topicNames.set(topicId, message.forum_topic_edited.name)
  }

  const resolved = resolveTopicNameFromMessage(message)
  if (resolved && topicId) {
    topicNames.set(topicId, resolved)
  }

  const reply = message.reply_to_message
  if (reply?.forum_topic_created?.name && message.message_thread_id) {
    topicNames.set(message.message_thread_id, reply.forum_topic_created.name)
  }
}

/** Telegram konusunu Kant sohbet grubuna yansıtır (Telegram kaynak). */
export async function ensureTelegramTopicImported(
  topicId: number,
  fallbackName?: string,
  contextMessage?: TopicNameMessage,
) {
  const supergroupId = await getTelegramSupergroupId()
  if (!supergroupId) return null

  const existing = await prisma.chatGroup.findFirst({
    where: { telegramTopicId: topicId },
    include: { board: true },
  })

  let name =
    fallbackName?.trim() ||
    (contextMessage ? resolveTopicNameFromMessage(contextMessage) : null) ||
    undefined

  if (!name || isPlaceholderTopicName(name, topicId)) {
    if (topicId === GENERAL_FORUM_TOPIC_ID) {
      const generalName = await getTelegramGeneralTopicName()
      if (generalName) name = generalName
    }

    const topic = await getForumTopic(supergroupId, topicId)
    if (topic?.name) name = topic.name
  }

  if (
    name &&
    !isPlaceholderTopicName(name, topicId) &&
    topicId === GENERAL_FORUM_TOPIC_ID
  ) {
    await setTelegramGeneralTopicName(name)
  }

  if (existing) {
    if (
      name &&
      !isPlaceholderTopicName(name, topicId) &&
      (existing.name !== name || isPlaceholderTopicName(existing.name, topicId))
    ) {
      await importTelegramTopicToKant(topicId, name)
      return prisma.chatGroup.findFirst({
        where: { id: existing.id },
        include: { board: true },
      })
    }
    return existing
  }

  if (!name || isPlaceholderTopicName(name, topicId)) {
    return null
  }

  const groupId = await importTelegramTopicToKant(topicId, name)
  if (!groupId) return null

  return prisma.chatGroup.findFirst({
    where: { id: groupId },
    include: { board: true },
  })
}

export async function ensureGeneralForumTopicImported(chatTitle?: string) {
  const stored = await getTelegramGeneralTopicName()
  return ensureTelegramTopicImported(
    GENERAL_FORUM_TOPIC_ID,
    stored ?? (chatTitle ? `${chatTitle} — Genel` : "Genel"),
  )
}

export async function importTelegramTopicToKant(
  topicId: number,
  name: string,
) {
  const trimmedName = name.trim().slice(0, 128)
  if (!trimmedName) return null

  const existing = await prisma.chatGroup.findFirst({
    where: { telegramTopicId: topicId },
  })

  if (existing) {
    const newIsPlaceholder = isPlaceholderTopicName(trimmedName, topicId)
    const oldIsPlaceholder = isPlaceholderTopicName(existing.name, topicId)
    const shouldUpdate =
      trimmedName !== existing.name &&
      (!newIsPlaceholder || oldIsPlaceholder)

    if (shouldUpdate) {
      await prisma.chatGroup.update({
        where: { id: existing.id },
        data: { name: trimmedName, updatedAt: new Date() },
      })
    }
    return existing.id
  }

  const boardId = await getDefaultBoardId()
  if (!boardId) return null

  const group = await prisma.chatGroup.create({
    data: {
      name: trimmedName,
      boardId,
      telegramTopicId: topicId,
    },
  })

  await ensureGroupMembers(group.id)
  return group.id
}

export async function importTelegramTopicsFromUpdates(chatId?: string) {
  const supergroupId = chatId ?? (await getTelegramSupergroupId())
  if (!supergroupId || !isTelegramEnabled()) {
    return { imported: 0, updated: 0 }
  }

  const updates = await getTelegramUpdates({ timeout: 0 })
  const topicNames = new Map<number, string>()
  let imported = 0
  let updated = 0

  for (const update of updates) {
    const message = update.message
    if (!message) continue
    collectTopicNamesFromUpdate(message, supergroupId, topicNames)
  }

  for (const [topicId, name] of topicNames) {
    if (isPlaceholderTopicName(name, topicId)) continue

    if (topicId === GENERAL_FORUM_TOPIC_ID) {
      await setTelegramGeneralTopicName(name)
    }

    const existing = await prisma.chatGroup.findFirst({
      where: { telegramTopicId: topicId },
    })
    await importTelegramTopicToKant(topicId, name)
    if (existing) updated++
    else imported++
  }

  const generalName = await getTelegramGeneralTopicName()
  if (generalName && !topicNames.has(GENERAL_FORUM_TOPIC_ID)) {
    const existing = await prisma.chatGroup.findFirst({
      where: { telegramTopicId: GENERAL_FORUM_TOPIC_ID },
    })
    await importTelegramTopicToKant(GENERAL_FORUM_TOPIC_ID, generalName)
    if (existing) updated++
    else imported++
  }

  const scanned = await scanForumTopicsInChat(supergroupId)
  for (const { topicId, name } of scanned) {
    if (topicNames.has(topicId) || isPlaceholderTopicName(name, topicId)) continue

    const existing = await prisma.chatGroup.findFirst({
      where: { telegramTopicId: topicId },
    })
    await importTelegramTopicToKant(topicId, name)
    if (existing) updated++
    else imported++
  }

  return { imported, updated }
}

/** Telegram API ile forum konularını tarar (yalnızca botun erişebildiği konular). */
export async function scanForumTopicsInChat(chatId: string) {
  const found: { topicId: number; name: string }[] = []
  const batch = 50

  for (let start = 2; start <= 5000; start += batch) {
    const results = await Promise.all(
      Array.from({ length: batch }, (_, index) => {
        const topicId = start + index
        return getForumTopic(chatId, topicId).then((topic) =>
          topic ? { topicId, name: topic.name } : null,
        )
      }),
    )

    for (const result of results) {
      if (result) found.push(result)
    }
  }

  return found
}

export async function syncAllForumTopicsInChat(chatId: string) {
  await setTelegramSupergroupId(chatId)
  return importTelegramTopicsFromUpdates(chatId)
}

export async function pruneUnmappedChatGroups() {
  if (!isTelegramEnabled()) return { deleted: 0 }

  const result = await prisma.chatGroup.deleteMany({
    where: { telegramTopicId: null },
  })

  return { deleted: result.count }
}

export async function isTelegramChatForum(chatId: string): Promise<boolean> {
  const chat = await safeTelegramCall(() => getTelegramChat(chatId))
  return Boolean(chat?.is_forum)
}

export async function ensureTelegramTopicForGroup(chatGroupId: string) {
  if (!isTelegramEnabled()) return null

  const supergroupId = await getTelegramSupergroupId()
  if (!supergroupId) return null

  const group = await prisma.chatGroup.findUnique({
    where: { id: chatGroupId },
    include: { board: true },
  })

  if (!group) return null
  if (group.telegramTopicId) {
    await pullTelegramTopicNameForGroup(chatGroupId)
    return group.telegramTopicId
  }

  const isForum = await isTelegramChatForum(supergroupId)
  if (!isForum) return null

  try {
    const topic = await createForumTopic(supergroupId, group.name)

    await prisma.chatGroup.update({
      where: { id: chatGroupId },
      data: { telegramTopicId: topic.message_thread_id },
    })

    return topic.message_thread_id
  } catch (error) {
    console.error(
      `Telegram konusu oluşturulamadı (${group.name}):`,
      error instanceof Error ? error.message : error,
    )
    return null
  }
}

export async function createTelegramTopicForKantGroup(
  name: string,
  boardId?: string,
) {
  if (!isTelegramEnabled()) {
    throw new Error("Telegram yapılandırılmamış")
  }

  const supergroupId = await getTelegramSupergroupId()
  if (!supergroupId) {
    throw new Error("Telegram süper grup tanımlı değil")
  }

  const trimmedName = name.trim().slice(0, 128)
  if (!trimmedName) {
    throw new Error("Konu adı boş olamaz")
  }

  const topic = await createForumTopic(supergroupId, trimmedName)
  const resolvedBoardId = boardId ?? (await getDefaultBoardId())
  if (!resolvedBoardId) {
    throw new Error("Pano bulunamadı")
  }

  const group = await prisma.chatGroup.create({
    data: {
      name: trimmedName,
      boardId: resolvedBoardId,
      telegramTopicId: topic.message_thread_id,
    },
  })

  await ensureGroupMembers(group.id)
  return group
}

/** Telegram'daki konu adını Kant'a çeker (Telegram kaynak; Telegram'a yazmaz). */
export async function pullTelegramTopicNameForGroup(chatGroupId: string) {
  if (!isTelegramEnabled()) return

  const supergroupId = await getTelegramSupergroupId()
  if (!supergroupId) return

  const group = await prisma.chatGroup.findUnique({
    where: { id: chatGroupId },
  })

  if (!group?.telegramTopicId) return

  const topic = await getForumTopic(supergroupId, group.telegramTopicId)
  if (topic?.name && !isPlaceholderTopicName(topic.name, group.telegramTopicId)) {
    await importTelegramTopicToKant(group.telegramTopicId, topic.name)
  }
}

export async function syncTelegramTopicNameForGroup(chatGroupId: string) {
  await pullTelegramTopicNameForGroup(chatGroupId)
}

export async function syncAllTelegramTopics() {
  if (!isTelegramEnabled()) {
    return { synced: 0, total: 0, errors: [] as string[] }
  }

  const supergroupId = await getTelegramSupergroupId()
  if (!supergroupId) {
    return {
      synced: 0,
      total: 0,
      errors: ["Telegram süper grup ID tanımlı değil"],
    }
  }

  const importResult = await importTelegramTopicsFromUpdates()
  await pruneUnmappedChatGroups()

  const telegramGroups = await prisma.chatGroup.findMany({
    where: { telegramTopicId: { not: null } },
    orderBy: { name: "asc" },
  })

  return {
    synced: telegramGroups.length,
    total: telegramGroups.length,
    imported: importResult.imported,
    updated: importResult.updated,
    errors: [] as string[],
  }
}

export async function setChatGroupTelegramTopicId(
  chatGroupId: string,
  topicId: number | null,
) {
  await prisma.chatGroup.update({
    where: { id: chatGroupId },
    data: { telegramTopicId: topicId },
  })

  if (topicId) {
    await pullTelegramTopicNameForGroup(chatGroupId)
  }
}

export async function discoverTelegramTopicIds(chatId?: string) {
  const supergroupId = chatId ?? (await getTelegramSupergroupId())
  if (!supergroupId) return []

  const updates = await getTelegramUpdates({ timeout: 0 })
  const topics = new Map<number, string>()

  for (const update of updates) {
    const message = update.message
    if (!message?.message_thread_id) continue
    if (String(message.chat.id) !== supergroupId) continue

    topics.set(
      message.message_thread_id,
      message.text?.slice(0, 80) ?? message.caption?.slice(0, 80) ?? "",
    )
  }

  return Array.from(topics.entries())
    .map(([topicId, preview]) => ({ topicId, preview }))
    .sort((a, b) => a.topicId - b.topicId)
}

async function resolveKantReplyToId(
  chatGroupId: string,
  telegramMessageId: number | null | undefined,
): Promise<string | null> {
  if (!telegramMessageId) return null

  const parent = await prisma.chatMessage.findFirst({
    where: {
      chatGroupId,
      telegramMessageId: String(telegramMessageId),
      deletedAt: null,
    },
    select: { id: true },
  })

  return parent?.id ?? null
}

export async function resolveInboundReplyToId(
  chatGroupId: string,
  message: TelegramMessage,
): Promise<string | null> {
  const telegramReplyId = resolveUserReplyTelegramMessageId(message)
  return resolveKantReplyToId(chatGroupId, telegramReplyId)
}

async function resolveOutboundReplyTelegramMessageId(
  replyToId?: string | null,
): Promise<number | null> {
  if (!replyToId) return null

  const parent = await prisma.chatMessage.findUnique({
    where: { id: replyToId },
    select: { telegramMessageId: true, deletedAt: true },
  })

  if (!parent?.telegramMessageId || parent.deletedAt) return null
  const parsed = Number.parseInt(parent.telegramMessageId, 10)
  return Number.isNaN(parsed) ? null : parsed
}

export async function addTelegramUserToAllChatGroups(userId: string) {
  const groups = await prisma.chatGroup.findMany({ select: { id: true } })

  await prisma.chatGroupMember.createMany({
    data: groups.map((group) => ({
      chatGroupId: group.id,
      userId,
    })),
    skipDuplicates: true,
  })
}

export async function importTelegramMediaAttachment(
  chatGroupId: string,
  message: TelegramMessage,
) {
  const media = extractTelegramMedia(message)
  if (!media) return null

  const group = await prisma.chatGroup.findUnique({
    where: { id: chatGroupId },
    select: { boardId: true },
  })
  if (!group) return null

  if (process.env.OPENCLOUD_ENABLED === "true") {
    await ensureBoardOpenCloudStructure(group.boardId)
  }

  const { buffer } = await downloadTelegramFile(media.fileId)
  const filename = media.filename ?? "dosya"
  const mimeType = media.mimeType ?? "application/octet-stream"

  const stored = await storeFile(filename, buffer, mimeType, {
    type: "chat",
    chatGroupId,
  })

  return prisma.attachment.create({
    data: {
      filename,
      path: stored.path,
      remotePath: stored.remotePath,
      storageProvider: stored.storageProvider,
      mimeType,
      size: buffer.length,
      width: media.width ?? null,
      height: media.height ?? null,
    },
  })
}

function buildTelegramCaption(_authorName: string, content: string): string | undefined {
  const trimmed = stripMentionTokens(content).trim()
  return trimmed ? escapeHtml(trimmed) : undefined
}

type OutboundTelegramMessage = {
  text: string
  parseMode?: "HTML" | "none"
  replyMarkup?: Record<string, unknown>
  buttonUrl?: { label: string; url: string }
  disableLinkPreview?: boolean
}

async function resolveOutboundTelegramMessage(params: {
  content: string
  cardId?: string | null
}): Promise<OutboundTelegramMessage> {
  if (!params.cardId) {
    const text = stripMentionTokens(params.content).trim()
    return text ? { text: escapeHtml(text), parseMode: "HTML" } : { text: "", parseMode: "HTML" }
  }

  const card = await prisma.card.findUnique({
    where: { id: params.cardId },
    include: cardShareInclude,
  })

  if (!card) {
    return { text: params.content, parseMode: "HTML" }
  }

  const payload = buildCardShareTelegramPayload(
    card as CardShareSnapshot,
    params.content,
  )

  return {
    text: payload.text,
    parseMode: payload.parseMode,
    replyMarkup: payload.replyMarkup,
    buttonUrl: payload.buttonUrl,
    disableLinkPreview: payload.disableLinkPreview,
  }
}

type OutboundAttachment = {
  filename: string
  mimeType: string
  path: string
  remotePath?: string | null
}

function resolveTelegramMediaSend(
  mimeType: string,
  filename: string,
): {
  method: "sendPhoto" | "sendDocument" | "sendVideo" | "sendVoice" | "sendAudio" | "sendAnimation"
  fileField: string
} {
  const lower = filename.toLowerCase()
  if (lower.endsWith(".gif") || mimeType === "image/gif") {
    return { method: "sendAnimation", fileField: "animation" }
  }
  if (isImageMimeType(mimeType)) {
    return { method: "sendPhoto", fileField: "photo" }
  }
  if (isVideoMimeType(mimeType)) {
    return { method: "sendVideo", fileField: "video" }
  }
  if (mimeType === "audio/ogg" || lower.endsWith(".ogg") || lower === "voice.ogg") {
    return { method: "sendVoice", fileField: "voice" }
  }
  if (
    lower === "voice.webm" ||
    (lower.startsWith("voice.") && isAudioMimeType(mimeType))
  ) {
    return { method: "sendAudio", fileField: "audio" }
  }
  if (isAudioMimeType(mimeType)) {
    return { method: "sendAudio", fileField: "audio" }
  }
  return { method: "sendDocument", fileField: "document" }
}

async function pushAttachmentsToTelegram(params: {
  chatId: string
  topicId?: number | null
  replyToMessageId?: number | null
  authorName: string
  content: string
  parseMode?: "HTML" | "none"
  attachments: OutboundAttachment[]
}) {
  let lastMessageId: number | null = null

  for (const [index, attachment] of params.attachments.entries()) {
    const buffer = await readStoredFile(attachment)
    const { method, fileField } = resolveTelegramMediaSend(
      attachment.mimeType,
      attachment.filename,
    )
    const trimmed = params.content.trim()
    const caption =
      index === 0 && trimmed
        ? params.parseMode === "HTML"
          ? trimmed
          : buildTelegramCaption(params.authorName, trimmed)
        : undefined

    const sent = await safeTelegramCall(() =>
      sendTelegramMediaFile({
        method,
        chatId: params.chatId,
        topicId: params.topicId,
        replyToMessageId:
          index === 0 ? params.replyToMessageId : undefined,
        fileField,
        buffer,
        filename: attachment.filename,
        mimeType: attachment.mimeType,
        caption,
        parseMode: params.parseMode,
      }),
    )

    if (sent?.message_id) {
      lastMessageId = sent.message_id
    }
  }

  return lastMessageId
}

export async function pushMessageToTelegram(params: {
  chatGroupId: string
  content: string
  authorName: string
  authorId?: string
  replyToId?: string | null
  cardId?: string | null
  attachments?: OutboundAttachment[]
}) {
  if (!isTelegramEnabled()) return null

  const outbound = await resolveOutboundTelegramMessage({
    content: params.content,
    cardId: params.cardId,
  })

  const supergroupId = await getTelegramSupergroupId()
  if (!supergroupId) return null

  const group = await prisma.chatGroup.findUnique({
    where: { id: params.chatGroupId },
  })

  if (!group) return null

  const isForum = await isTelegramChatForum(supergroupId)

  const topicId = isForum
    ? (group.telegramTopicId ??
      (await ensureTelegramTopicForGroup(params.chatGroupId)))
    : null

  const threadId = toTelegramThreadId(topicId)

  const mtprotoTopicId = threadId ?? topicId ?? null
  const replyToTelegramMessageId = await resolveOutboundReplyTelegramMessageId(
    params.replyToId,
  )

  const sender = await resolveTelegramOutboundSender(params.authorId)

  if (sender.mode === "mtproto") {
    if (params.attachments?.length) {
      const files = []
      for (const attachment of params.attachments) {
        const buffer = await readStoredFile(attachment)
        files.push({
          buffer,
          filename: attachment.filename,
          mimeType: attachment.mimeType,
        })
      }

      const mtprotoId = await sendUserForumFiles({
        session: sender.session,
        chatId: supergroupId,
        topicId: mtprotoTopicId,
        replyToMessageId: replyToTelegramMessageId,
        text: outbound.text.trim() || undefined,
        parseMode: outbound.parseMode === "HTML" ? "html" : undefined,
        buttonUrl: outbound.buttonUrl,
        files,
      })
      if (mtprotoId) return mtprotoId
    } else if (outbound.text.trim()) {
      const mtprotoId = await sendUserForumMessage({
        session: sender.session,
        chatId: supergroupId,
        topicId: mtprotoTopicId,
        replyToMessageId: replyToTelegramMessageId,
        text: outbound.text,
        parseMode: outbound.parseMode === "HTML" ? "html" : undefined,
        buttonUrl: outbound.buttonUrl,
      })
      if (mtprotoId) return mtprotoId
    }

    throw new Error(
      "Telegram'a mesaj gönderilemedi. MTProto oturumunuzu Ayarlar → Telegram'dan yenileyin.",
    )
  }

  if (params.attachments?.length) {
    return pushAttachmentsToTelegram({
      chatId: supergroupId,
      topicId: threadId,
      replyToMessageId: replyToTelegramMessageId,
      authorName: params.authorName,
      content: outbound.text,
      parseMode: outbound.parseMode,
      attachments: params.attachments,
    })
  }

  const text = params.cardId
    ? outbound.text.trim()
    : buildTelegramCaption(params.authorName, outbound.text)
  if (!text) return null

  const result = await safeTelegramCall(() =>
    sendTelegramMessage({
      chatId: supergroupId,
      text,
      topicId: threadId,
      replyToMessageId: replyToTelegramMessageId,
      parseMode: outbound.parseMode,
      replyMarkup: outbound.replyMarkup,
      disableLinkPreview: outbound.disableLinkPreview,
    }),
  )

  return result?.message_id ?? null
}

export async function createChatMessageWithTelegram(params: {
  chatGroupId: string
  authorId: string
  content: string
  source?: "web" | "telegram"
  telegramMessageId?: string | null
  pushToTelegram?: boolean
  authorEmail?: string
  replyToId?: string | null
  cardId?: string | null
  attachmentIds?: string[]
  mentionedUserIds?: string[]
  attachments?: Array<{
    filename: string
    mimeType: string
    path: string
    remotePath?: string | null
    size?: number
    width?: number | null
    height?: number | null
    storageProvider?: string
  }>
}) {
  const message = await prisma.chatMessage.create({
    data: {
      chatGroupId: params.chatGroupId,
      authorId: params.authorId,
      content: params.content,
      source: params.source ?? "web",
      telegramMessageId: params.telegramMessageId ?? null,
      replyToId: params.replyToId ?? null,
      cardId: params.cardId ?? null,
      mentionedUserIds: params.mentionedUserIds ?? [],
      attachments: params.attachments?.length
        ? {
            create: params.attachments.map((attachment) => ({
              filename: attachment.filename,
              path: attachment.path,
              remotePath: attachment.remotePath ?? null,
              storageProvider: attachment.storageProvider ?? "OPENCLOUD",
              mimeType: attachment.mimeType,
              size: attachment.size ?? 0,
              width: attachment.width ?? null,
              height: attachment.height ?? null,
            })),
          }
        : undefined,
    },
    include: {
      author: true,
      attachments: true,
      replyTo: {
        include: {
          author: {
            select: { id: true, email: true, firstName: true, lastName: true },
          },
          attachments: true,
        },
      },
    },
  })

  if (params.attachmentIds?.length) {
    await prisma.attachment.updateMany({
      where: {
        id: { in: params.attachmentIds },
        chatMessageId: null,
      },
      data: { chatMessageId: message.id },
    })
  }

  const fullMessage = await prisma.chatMessage.findUnique({
    where: { id: message.id },
    include: {
      author: true,
      attachments: true,
      replyTo: {
        include: {
          author: {
            select: { id: true, email: true, firstName: true, lastName: true },
          },
          attachments: true,
        },
      },
    },
  })

  await prisma.chatGroup.update({
    where: { id: params.chatGroupId },
    data: { updatedAt: new Date() },
  })

  const resolved = fullMessage ?? message

  if (params.mentionedUserIds?.length) {
    const group = await prisma.chatGroup.findUnique({
      where: { id: params.chatGroupId },
      select: { name: true },
    })

    if (group) {
      const { notifyMentionedUsersOnTelegram } = await import(
        "@/lib/telegram/mention-notify"
      )
      void notifyMentionedUsersOnTelegram({
        mentionedUserIds: params.mentionedUserIds,
        authorId: params.authorId,
        authorName: params.authorEmail ?? "Bir kullanıcı",
        groupId: params.chatGroupId,
        groupName: group.name,
        messagePreview: params.content,
      }).catch((error) => {
        console.error("Telegram etiket bildirimi gönderilemedi:", error)
      })
    }
  }

  if (
    params.pushToTelegram !== false &&
    params.source !== "telegram" &&
    params.authorEmail
  ) {
    const tgMessageId = await pushMessageToTelegram({
      chatGroupId: params.chatGroupId,
      content: params.content,
      authorName: params.authorEmail,
      authorId: params.authorId,
      replyToId: params.replyToId,
      cardId: params.cardId,
      attachments: resolved.attachments.map((attachment) => ({
        filename: attachment.filename,
        mimeType: attachment.mimeType,
        path: attachment.path,
        remotePath: attachment.remotePath,
      })),
    })

    if (tgMessageId) {
      await prisma.chatMessage.update({
        where: { id: message.id },
        data: { telegramMessageId: String(tgMessageId) },
      })
    }
  }

  return resolved
}

export async function findChatGroupByTelegramTopic(topicId: number) {
  return prisma.chatGroup.findFirst({
    where: { telegramTopicId: topicId },
    include: { board: true },
  })
}

export async function findChatGroupForInboundMessage(
  chatId: string,
  topicId?: number,
  contextMessage?: TopicNameMessage & ForumTopicMessage,
) {
  const supergroupId = await getTelegramSupergroupId()
  const resolvedTopicId =
    topicId ??
    (contextMessage
      ? await resolveInboundForumTopicId(chatId, contextMessage)
      : undefined)

  if (!resolvedTopicId) return null

  const chat = await safeTelegramCall(() => getTelegramChat(chatId))
  const isForum = Boolean(chat?.is_forum)

  const resolvedName = contextMessage
    ? resolveTopicNameFromMessage(contextMessage)
    : undefined

  if (isForum) {
    if (supergroupId && chatId !== supergroupId) {
      await setTelegramSupergroupId(chatId)
    }
    return ensureTelegramTopicImported(
      resolvedTopicId,
      resolvedName ?? undefined,
      contextMessage,
    )
  }

  if (!supergroupId || chatId !== supergroupId) return null

  return ensureTelegramTopicImported(
    resolvedTopicId,
    resolvedName ?? undefined,
    contextMessage,
  )
}

export { migrateTelegramSupergroupId } from "./settings"

export async function resolveTelegramAuthor(
  telegramUserId: number,
  username?: string,
) {
  const user = await prisma.user.findUnique({
    where: { telegramUserId: String(telegramUserId) },
  })

  if (!user) return null

  return user
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
}
