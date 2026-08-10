"use server"

import { auth } from "@/auth"
import { getTelegramPublicAppUrlStatus } from "@/lib/public-app-url"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { randomBytes } from "crypto"
import {
  getTelegramBotInfo,
  getTelegramChat,
  getTelegramChatMember,
  getTelegramUpdates,
  getTelegramWebhookInfo,
  setTelegramWebhook,
  deleteTelegramWebhook,
} from "@/lib/telegram/api"
import { isTelegramEnabled } from "@/lib/telegram/config"
import {
  ensureTelegramTopicForGroup,
  isTelegramChatForum,
  syncAllTelegramTopics,
  setChatGroupTelegramTopicId,
  discoverTelegramTopicIds,
  addTelegramUserToAllChatGroups,
  importTelegramTopicsFromUpdates,
  pruneUnmappedChatGroups,
} from "@/lib/telegram/sync"
import { isMtprotoConfigured } from "@/lib/telegram/mtproto"
import {
  startTelegramMtprotoAuth,
  completeTelegramMtprotoAuth,
  clearTelegramMtprotoAuth,
} from "@/lib/telegram/mtproto-auth"
import {
  getTelegramSupergroupId,
  setTelegramSupergroupId,
  getTelegramDefaultTopicIdFromEnv,
} from "@/lib/telegram/settings"

function generateLinkCode(): string {
  return randomBytes(3).toString("hex").toUpperCase()
}

export async function generateTelegramLinkCode() {
  const session = await auth()
  if (!session) throw new Error("Yetkisiz")

  const code = generateLinkCode()
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000)

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      telegramLinkCode: code,
      telegramLinkCodeExpiresAt: expiresAt,
    },
  })

  return { code, expiresAt: expiresAt.toISOString() }
}

export async function startMtprotoSenderSetup(phone: string) {
  const session = await auth()
  if (!session) throw new Error("Yetkisiz")

  const result = await startTelegramMtprotoAuth(session.user.id, phone)
  revalidatePath("/settings/telegram")
  return result
}

export async function completeMtprotoSenderSetup(code: string, password?: string) {
  const session = await auth()
  if (!session) throw new Error("Yetkisiz")

  const result = await completeTelegramMtprotoAuth(
    session.user.id,
    code,
    password,
  )

  if (result.needsPassword) {
    return { needsPassword: true as const }
  }

  revalidatePath("/settings/telegram")
  return { needsPassword: false as const, success: true as const }
}

export async function cancelMtprotoSenderSetup() {
  const session = await auth()
  if (!session) throw new Error("Yetkisiz")

  await clearTelegramMtprotoAuth(session.user.id)
  revalidatePath("/settings/telegram")
}

export async function unlinkTelegramAccount() {
  const session = await auth()
  if (!session) throw new Error("Yetkisiz")

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      telegramUserId: null,
      telegramUsername: null,
      telegramLinkCode: null,
      telegramLinkCodeExpiresAt: null,
      telegramMtprotoSession: null,
      telegramMtprotoPendingPhone: null,
      telegramMtprotoPhoneCodeHash: null,
      telegramMtprotoAuthSession: null,
      telegramMtprotoAuthExpiresAt: null,
    },
  })

  revalidatePath("/settings/telegram")
}

export async function getTelegramStatus() {
  const session = await auth()
  if (!session) throw new Error("Yetkisiz")

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      telegramUserId: true,
      telegramUsername: true,
    },
  })

  let botInfo = null
  if (isTelegramEnabled()) {
    try {
      botInfo = await getTelegramBotInfo()
    } catch {
      botInfo = null
    }
  }

  return {
    enabled: isTelegramEnabled(),
    linked: Boolean(user?.telegramUserId),
    username: user?.telegramUsername,
    botUsername: botInfo?.username ?? process.env.TELEGRAM_BOT_USERNAME?.replace(/^@/, ""),
  }
}

export async function updateTelegramSupergroup(supergroupId: string | null) {
  const session = await auth()
  if (!session) throw new Error("Yetkisiz")
  if (session.user.role !== "ADMIN") {
    throw new Error("Sadece yöneticiler Telegram ayarlarını değiştirebilir")
  }

  await setTelegramSupergroupId(supergroupId)
  revalidatePath("/settings/telegram")
}

/** @deprecated Pano bazlı ayar kaldırıldı — updateTelegramSupergroup kullanın */
export async function updateBoardTelegramSupergroup(
  boardId: string,
  supergroupId: string | null,
) {
  return updateTelegramSupergroup(supergroupId)
}

export async function importTelegramTopicsToZubee() {
  const session = await auth()
  if (!session) throw new Error("Yetkisiz")
  if (session.user.role !== "ADMIN") {
    throw new Error("Sadece yöneticiler içe aktarabilir")
  }

  const result = await importTelegramTopicsFromUpdates()
  const pruned = await pruneUnmappedChatGroups()
  revalidatePath("/settings/telegram")
  revalidatePath("/chat")
  return { ...result, pruned: pruned.deleted }
}

export async function syncAllChatGroupsToTelegram() {
  const session = await auth()
  if (!session) throw new Error("Yetkisiz")
  if (session.user.role !== "ADMIN") {
    throw new Error("Sadece yöneticiler senkronizasyon başlatabilir")
  }

  const supergroupId = await getTelegramSupergroupId()
  if (!supergroupId) {
    throw new Error(
      "TELEGRAM_SUPERGROUP_ID .env dosyasında tanımlı olmalı",
    )
  }

  const result = await syncAllTelegramTopics()

  revalidatePath("/settings/telegram")
  return result
}

export async function updateChatGroupTelegramTopic(
  chatGroupId: string,
  topicId: string | null,
) {
  const session = await auth()
  if (!session) throw new Error("Yetkisiz")
  if (session.user.role !== "ADMIN") {
    throw new Error("Sadece yöneticiler konu eşlemesi yapabilir")
  }

  const parsed =
    topicId?.trim() === "" || topicId === null
      ? null
      : Number.parseInt(topicId.trim(), 10)

  if (topicId?.trim() && Number.isNaN(parsed)) {
    throw new Error("Geçersiz konu ID")
  }

  await setChatGroupTelegramTopicId(chatGroupId, parsed)
  revalidatePath("/settings/telegram")
}

export async function discoverTelegramTopics() {
  const session = await auth()
  if (!session) throw new Error("Yetkisiz")
  if (session.user.role !== "ADMIN") {
    throw new Error("Sadece yöneticiler konu keşfi yapabilir")
  }

  if (!isTelegramEnabled()) {
    throw new Error("TELEGRAM_BOT_TOKEN yapılandırılmamış")
  }

  return discoverTelegramTopicIds()
}

export async function ensureTelegramMembershipForLinkedUsers() {
  const session = await auth()
  if (!session) throw new Error("Yetkisiz")
  if (session.user.role !== "ADMIN") {
    throw new Error("Sadece yöneticiler bu işlemi yapabilir")
  }

  const linkedUsers = await prisma.user.findMany({
    where: { telegramUserId: { not: null } },
    select: { id: true },
  })

  for (const user of linkedUsers) {
    await addTelegramUserToAllChatGroups(user.id)
  }

  return { count: linkedUsers.length }
}

/** @deprecated syncAllChatGroupsToTelegram kullanın */
export async function syncBoardChatGroupsToTelegram(_boardId: string) {
  return syncAllChatGroupsToTelegram()
}

export async function registerTelegramWebhook() {
  const session = await auth()
  if (!session) throw new Error("Yetkisiz")
  if (session.user.role !== "ADMIN") {
    throw new Error("Sadece yöneticiler webhook kaydedebilir")
  }

  if (!isTelegramEnabled()) {
    throw new Error("TELEGRAM_BOT_TOKEN yapılandırılmamış")
  }

  const baseUrl =
    process.env.AUTH_URL ||
    process.env.NEXTAUTH_URL ||
    process.env.NEXT_PUBLIC_APP_URL

  if (!baseUrl) {
    throw new Error("AUTH_URL veya NEXTAUTH_URL tanımlı değil")
  }

  const webhookUrl = `${baseUrl.replace(/\/$/, "")}/api/telegram/webhook`
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET?.trim()

  await setTelegramWebhook(webhookUrl, secret)
  return { webhookUrl }
}

export async function getTelegramIntegrationStatus() {
  const session = await auth()
  if (!session) throw new Error("Yetkisiz")

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      telegramUserId: true,
      telegramUsername: true,
      telegramMtprotoSession: true,
    },
  })

  const enabled = isTelegramEnabled()
  let botInfo = null
  let webhookInfo = null

  if (enabled) {
    try {
      botInfo = await getTelegramBotInfo()
    } catch {
      botInfo = null
    }

    if (session.user.role === "ADMIN") {
      try {
        webhookInfo = await getTelegramWebhookInfo()
      } catch {
        webhookInfo = null
      }
    }
  }

  const supergroupId =
    session.user.role === "ADMIN" ? await getTelegramSupergroupId() : null

  const chatGroups =
    session.user.role === "ADMIN"
      ? await prisma.chatGroup.findMany({
          where: enabled ? { telegramTopicId: { not: null } } : {},
          select: {
            id: true,
            name: true,
            telegramTopicId: true,
            board: {
              select: { name: true, identifier: true },
            },
          },
          orderBy: [{ name: "asc" }],
        })
      : []

  const baseUrl =
    process.env.AUTH_URL ||
    process.env.NEXTAUTH_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    null

  const isAdmin = session.user.role === "ADMIN"

  const userMappings = isAdmin
    ? await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
          color: true,
          isActive: true,
          telegramUserId: true,
          telegramUsername: true,
          telegramMtprotoSession: true,
          telegramLinkCode: true,
          telegramLinkCodeExpiresAt: true,
        },
        orderBy: [{ isActive: "desc" }, { email: "asc" }],
      })
    : []

  return {
    enabled,
    linked: Boolean(user?.telegramUserId),
    mtprotoLinked: Boolean(user?.telegramMtprotoSession),
    mtprotoConfigured: isMtprotoConfigured(),
    username: user?.telegramUsername,
    botUsername:
      botInfo?.username ??
      process.env.TELEGRAM_BOT_USERNAME?.replace(/^@/, ""),
    botName: botInfo?.first_name ?? null,
    botHealth: enabled && isAdmin ? await getTelegramBotHealth() : null,
    publicAppUrlStatus: getTelegramPublicAppUrlStatus(),
    webhook: webhookInfo
      ? {
          url: webhookInfo.url || null,
          pendingUpdates: webhookInfo.pending_update_count,
          lastError: webhookInfo.last_error_message ?? null,
          isActive: Boolean(webhookInfo.url),
        }
      : null,
    expectedWebhookUrl: baseUrl
      ? `${baseUrl.replace(/\/$/, "")}/api/telegram/webhook`
      : null,
    supergroupConfigured: Boolean(supergroupId),
    defaultTopicConfigured: getTelegramDefaultTopicIdFromEnv() != null,
    chatGroups: chatGroups.map((group) => ({
      id: group.id,
      name: group.name,
      boardName: group.board.name,
      boardIdentifier: group.board.identifier,
      telegramTopicId: group.telegramTopicId,
    })),
    isAdmin,
    userMappings: userMappings.map((row) => ({
      id: row.id,
      email: row.email,
      firstName: row.firstName,
      lastName: row.lastName,
      avatarUrl: row.avatarUrl,
      color: row.color,
      isActive: row.isActive,
      telegramUserId: row.telegramUserId,
      telegramUsername: row.telegramUsername,
      mtprotoLinked: Boolean(row.telegramMtprotoSession),
      pendingLinkCode:
        row.telegramLinkCode &&
        row.telegramLinkCodeExpiresAt &&
        row.telegramLinkCodeExpiresAt > new Date()
          ? {
              code: row.telegramLinkCode,
              expiresAt: row.telegramLinkCodeExpiresAt.toISOString(),
            }
          : null,
    })),
  }
}

export type TelegramUserMapping = {
  id: string
  email: string
  firstName: string | null
  lastName: string | null
  avatarUrl: string | null
  color: string | null
  isActive: boolean
  telegramUserId: string | null
  telegramUsername: string | null
  mtprotoLinked: boolean
  pendingLinkCode: { code: string; expiresAt: string } | null
}

async function requireTelegramAdmin() {
  const session = await auth()
  if (!session) throw new Error("Yetkisiz")
  if (session.user.role !== "ADMIN") {
    throw new Error("Sadece yöneticiler bu işlemi yapabilir")
  }
  return session
}

export async function adminGenerateTelegramLinkCodeForUser(userId: string) {
  await requireTelegramAdmin()

  const code = generateLinkCode()
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000)

  await prisma.user.update({
    where: { id: userId },
    data: {
      telegramLinkCode: code,
      telegramLinkCodeExpiresAt: expiresAt,
    },
  })

  revalidatePath("/settings/telegram")
  return { code, expiresAt: expiresAt.toISOString() }
}

export async function adminUnlinkTelegramAccount(userId: string) {
  await requireTelegramAdmin()

  await prisma.user.update({
    where: { id: userId },
    data: {
      telegramUserId: null,
      telegramUsername: null,
      telegramLinkCode: null,
      telegramLinkCodeExpiresAt: null,
      telegramMtprotoSession: null,
      telegramMtprotoPendingPhone: null,
      telegramMtprotoPhoneCodeHash: null,
      telegramMtprotoAuthSession: null,
      telegramMtprotoAuthExpiresAt: null,
    },
  })

  revalidatePath("/settings/telegram")
}

export async function adminLinkTelegramAccount(
  userId: string,
  telegramUserId: string,
  telegramUsername?: string | null,
) {
  await requireTelegramAdmin()

  const normalizedId = telegramUserId.trim()
  if (!/^\d+$/.test(normalizedId)) {
    throw new Error("Geçerli bir Telegram kullanıcı ID'si girin")
  }

  const existing = await prisma.user.findUnique({
    where: { telegramUserId: normalizedId },
    select: { id: true },
  })

  if (existing && existing.id !== userId) {
    throw new Error("Bu Telegram hesabı başka bir Zubee kullanıcısına bağlı")
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      telegramUserId: normalizedId,
      telegramUsername: telegramUsername?.replace(/^@/, "") ?? null,
      telegramLinkCode: null,
      telegramLinkCodeExpiresAt: null,
    },
  })

  await addTelegramUserToAllChatGroups(userId)
  revalidatePath("/settings/telegram")
}

export async function adminLookupTelegramUser(query: string) {
  await requireTelegramAdmin()

  if (!isTelegramEnabled()) {
    throw new Error("TELEGRAM_BOT_TOKEN yapılandırılmamış")
  }

  const trimmed = query.trim().replace(/^@/, "")
  if (!trimmed) {
    throw new Error("Kullanıcı adı veya ID girin")
  }

  let telegramUserId: number
  let username: string | null = null

  if (/^\d+$/.test(trimmed)) {
    telegramUserId = Number.parseInt(trimmed, 10)
  } else {
    const chat = await getTelegramChat(`@${trimmed}`)
    if (chat.type !== "private") {
      throw new Error("Geçerli bir Telegram kullanıcı adı değil")
    }
    telegramUserId = chat.id
    username = chat.username ?? trimmed
  }

  const supergroupId = await getTelegramSupergroupId()
  if (supergroupId) {
    const member = await getTelegramChatMember(supergroupId, telegramUserId)
    if (member.status === "left" || member.status === "kicked") {
      throw new Error("Bu kullanıcı Telegram süper grubunda değil")
    }
    if (member.user.is_bot) {
      throw new Error("Bot hesapları bağlanamaz")
    }
  }

  const alreadyLinkedTo = await prisma.user.findUnique({
    where: { telegramUserId: String(telegramUserId) },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
    },
  })

  return {
    telegramUserId: String(telegramUserId),
    username,
    alreadyLinkedTo,
  }
}

/** @deprecated syncAllChatGroupsToTelegram kullanın */
export async function syncAllBoardsChatGroupsToTelegram() {
  const result = await syncAllChatGroupsToTelegram()
  return {
    synced: result.synced,
    total: result.total,
    boardCount: 1,
  }
}

export async function clearTelegramWebhook() {
  const session = await auth()
  if (!session) throw new Error("Yetkisiz")
  if (session.user.role !== "ADMIN") {
    throw new Error("Sadece yöneticiler webhook kaldırabilir")
  }

  if (!isTelegramEnabled()) {
    throw new Error("TELEGRAM_BOT_TOKEN yapılandırılmamış")
  }

  await deleteTelegramWebhook()
  revalidatePath("/settings/telegram")
}

export type TelegramDiscoveredChat = {
  id: string
  title: string
  type: string
  isForum: boolean
  botStatus: string | null
}

export async function discoverTelegramChats(): Promise<TelegramDiscoveredChat[]> {
  const session = await auth()
  if (!session) throw new Error("Yetkisiz")
  if (session.user.role !== "ADMIN") {
    throw new Error("Sadece yöneticiler sohbet keşfi yapabilir")
  }

  if (!isTelegramEnabled()) {
    throw new Error("TELEGRAM_BOT_TOKEN yapılandırılmamış")
  }

  const updates = await getTelegramUpdates({ timeout: 0 })
  const botInfo = await getTelegramBotInfo()
  const seen = new Map<string, TelegramDiscoveredChat>()

  for (const update of updates) {
    const chat = update.message?.chat
    if (!chat || chat.type === "private") continue

    const chatId = String(chat.id)
    if (seen.has(chatId)) continue

    let chatInfo = null
    let botStatus = null

    try {
      chatInfo = await getTelegramChat(chatId)
      const member = await getTelegramChatMember(chatId, botInfo.id)
      botStatus = member.status
    } catch {
      // getChat başarısız olabilir (bot gruptan çıkarılmış)
    }

    seen.set(chatId, {
      id: chatId,
      title: chatInfo?.title ?? chat.title ?? chatId,
      type: chatInfo?.type ?? chat.type,
      isForum: Boolean(chatInfo?.is_forum),
      botStatus,
    })
  }

  return Array.from(seen.values())
}

export async function getTelegramBotHealth() {
  if (!isTelegramEnabled()) return null

  try {
    const bot = await getTelegramBotInfo()
    const webhook = await getTelegramWebhookInfo()

    const warnings: string[] = []

    if (bot.can_read_all_group_messages === false) {
      warnings.push(
        "Bot gizlilik modu açık — grup mesajlarını okuyamaz. BotFather'da /setprivacy → Disable yapın ve botu gruba yeniden ekleyin.",
      )
    }

    const baseUrl =
      process.env.AUTH_URL ||
      process.env.NEXTAUTH_URL ||
      process.env.NEXT_PUBLIC_APP_URL

    if (!baseUrl) {
      warnings.push(
        "AUTH_URL tanımlı değil — webhook kaydı ve bağlantı kodları çalışmayabilir.",
      )
    }

    if (!webhook.url) {
      warnings.push(
        "Webhook kayıtlı değil — geliştirme için npm run telegram:poll çalıştırın.",
      )
    }

    const publicUrlStatus = getTelegramPublicAppUrlStatus()
    if (!publicUrlStatus.configured) {
      warnings.push(
        "TELEGRAM_PUBLIC_APP_URL tanımlı değil — Telegram kart linkleri mobilde açılmayabilir. ngrok veya production HTTPS URL ekleyin.",
      )
    } else if (!publicUrlStatus.mobileReady) {
      warnings.push(
        "TELEGRAM_PUBLIC_APP_URL HTTPS ve erişilebilir bir adres olmalı (localhost çalışmaz).",
      )
    }

    return {
      canReadGroupMessages: bot.can_read_all_group_messages ?? true,
      privacyModeEnabled: bot.can_read_all_group_messages === false,
      webhookActive: Boolean(webhook.url),
      webhookUrl: webhook.url || null,
      webhookLastError: webhook.last_error_message ?? null,
      pendingUpdates: webhook.pending_update_count,
      hasAuthUrl: Boolean(baseUrl),
      publicAppUrlConfigured: publicUrlStatus.mobileReady,
      telegramPublicAppUrl: publicUrlStatus.resolved,
      warnings,
    }
  } catch {
    return null
  }
}

export async function validateTelegramSupergroup(supergroupId: string) {
  const session = await auth()
  if (!session) throw new Error("Yetkisiz")
  if (session.user.role !== "ADMIN") {
    throw new Error("Sadece yöneticiler doğrulama yapabilir")
  }

  if (!isTelegramEnabled()) {
    throw new Error("TELEGRAM_BOT_TOKEN yapılandırılmamış")
  }

  const chatId = supergroupId.trim()
  const chat = await getTelegramChat(chatId)
  const bot = await getTelegramBotInfo()
  const member = await getTelegramChatMember(chatId, bot.id)

  const issues: string[] = []

  if (chat.type === "group") {
    issues.push(
      "Bu grup henüz süper gruba dönüşmemiş. Telegram'da Konular (Topics) özelliğini açın.",
    )
  }

  if (!chat.is_forum) {
    issues.push(
      "Forum (Konular) özelliği kapalı. Grup ayarlarından Konular'ı etkinleştirin.",
    )
  }

  if (member.status !== "administrator" && member.status !== "creator") {
    issues.push(
      `Bot yönetici değil (durum: ${member.status}). Botu yönetici yapın.`,
    )
  }

  if (
    member.status === "administrator" &&
    chat.is_forum &&
    member.can_manage_topics === false
  ) {
    issues.push(
      "Botun «Konuları yönetme» izni kapalı — konu adları otomatik alınamayabilir. Yönetici izinlerinden açın.",
    )
  }

  if (bot.can_read_all_group_messages === false) {
    issues.push(
      "Bot gizlilik modu açık. BotFather → /setprivacy → Disable yapın.",
    )
  }

  return {
    id: String(chat.id),
    title: chat.title ?? chatId,
    type: chat.type,
    isForum: Boolean(chat.is_forum),
    botStatus: member.status,
    issues,
    ok: issues.length === 0,
  }
}
