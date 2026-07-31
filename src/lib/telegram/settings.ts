import { prisma } from "@/lib/prisma"

const SETTINGS_ID = "default"

type AppSettingsDelegate = {
  findUnique: (args: unknown) => Promise<{
    telegramSupergroupId?: string | null
    telegramDefaultChatGroupId?: string | null
    telegramGeneralTopicName?: string | null
  } | null>
  upsert: (args: unknown) => Promise<unknown>
}

/** Telegram forum gruplarında Genel konu (message_thread_id yok). */
export const GENERAL_FORUM_TOPIC_ID = 1

function getAppSettingsDelegate(): AppSettingsDelegate | null {
  const delegate = (
    prisma as unknown as { appSettings?: AppSettingsDelegate }
  ).appSettings

  if (!delegate?.findUnique || !delegate?.upsert) {
    return null
  }

  return delegate
}

export function isTelegramSupergroupConfiguredFromEnv(): boolean {
  return Boolean(process.env.TELEGRAM_SUPERGROUP_ID?.trim())
}

export async function getTelegramSupergroupId(): Promise<string | null> {
  const envId = process.env.TELEGRAM_SUPERGROUP_ID?.trim()
  if (envId) return envId

  return null
}

export function getTelegramDefaultTopicIdFromEnv(): number | null {
  const raw = process.env.TELEGRAM_DEFAULT_TOPIC_ID?.trim()
  if (!raw) return null

  const parsed = Number.parseInt(raw, 10)
  return Number.isNaN(parsed) ? null : parsed
}

export async function getTelegramDefaultChatGroupId(): Promise<string | null> {
  const topicId = getTelegramDefaultTopicIdFromEnv()
  if (topicId != null) {
    const byTopic = await prisma.chatGroup.findFirst({
      where: { telegramTopicId: topicId },
      select: { id: true },
    })
    if (byTopic) return byTopic.id
  }

  return null
}

export async function setTelegramSupergroupId(supergroupId: string | null) {
  if (isTelegramSupergroupConfiguredFromEnv()) {
    throw new Error(
      "TELEGRAM_SUPERGROUP_ID .env dosyasında tanımlı — arayüzden değiştirilemez.",
    )
  }

  const appSettings = getAppSettingsDelegate()
  if (!appSettings) return

  await appSettings.upsert({
    where: { id: SETTINGS_ID },
    create: {
      id: SETTINGS_ID,
      telegramSupergroupId: supergroupId?.trim() || null,
    },
    update: {
      telegramSupergroupId: supergroupId?.trim() || null,
    },
  })
}

export async function setTelegramDefaultChatGroupId(chatGroupId: string | null) {
  if (getTelegramDefaultTopicIdFromEnv() != null) {
    throw new Error(
      "TELEGRAM_DEFAULT_TOPIC_ID .env dosyasında tanımlı — arayüzden değiştirilemez.",
    )
  }

  const appSettings = getAppSettingsDelegate()
  if (!appSettings) return

  await appSettings.upsert({
    where: { id: SETTINGS_ID },
    create: {
      id: SETTINGS_ID,
      telegramDefaultChatGroupId: chatGroupId,
    },
    update: {
      telegramDefaultChatGroupId: chatGroupId,
    },
  })
}

export async function migrateTelegramSupergroupId(
  oldChatId: string,
  newChatId: string,
) {
  const current = await getTelegramSupergroupId()
  if (current === oldChatId) {
    await setTelegramSupergroupId(newChatId)
  }
}

export async function getTelegramGeneralTopicName(): Promise<string | null> {
  const appSettings = getAppSettingsDelegate()
  if (!appSettings) return null

  const settings = await appSettings.findUnique({
    where: { id: SETTINGS_ID },
    select: { telegramGeneralTopicName: true },
  })

  return settings?.telegramGeneralTopicName?.trim() || null
}

export async function setTelegramGeneralTopicName(name: string | null) {
  const appSettings = getAppSettingsDelegate()
  if (!appSettings) return

  const trimmed = name?.trim().slice(0, 128) || null

  await appSettings.upsert({
    where: { id: SETTINGS_ID },
    create: {
      id: SETTINGS_ID,
      telegramGeneralTopicName: trimmed,
    },
    update: {
      telegramGeneralTopicName: trimmed,
    },
  })
}
