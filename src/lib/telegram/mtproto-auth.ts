import { TelegramClient } from "telegram"
import { StringSession } from "telegram/sessions"
import { Api } from "telegram/tl"
import { prisma } from "@/lib/prisma"
import { isMtprotoConfigured } from "./mtproto"

const AUTH_TTL_MS = 15 * 60 * 1000

function getApiCredentials() {
  const apiId = Number(process.env.TELEGRAM_API_ID)
  const apiHash = process.env.TELEGRAM_API_HASH?.trim()
  if (!apiId || !apiHash) return null
  return { apiId, apiHash }
}

function normalizePhone(phone: string) {
  return phone.replace(/\s+/g, "").trim()
}

export async function startTelegramMtprotoAuth(userId: string, phone: string) {
  if (!isMtprotoConfigured()) {
    throw new Error(
      "TELEGRAM_API_ID ve TELEGRAM_API_HASH .env dosyasında tanımlı olmalı.",
    )
  }

  const creds = getApiCredentials()
  if (!creds) {
    throw new Error("MTProto API kimlik bilgileri eksik")
  }

  const phoneNumber = normalizePhone(phone)
  if (!phoneNumber.startsWith("+")) {
    throw new Error("Telefon numarası +90... formatında olmalı")
  }

  const client = new TelegramClient(
    new StringSession(""),
    creds.apiId,
    creds.apiHash,
    { connectionRetries: 3 },
  )

  try {
    await client.connect()
    const sendResult = await client.sendCode(creds, phoneNumber)
    const authSession = client.session.save() as unknown as string
    const expiresAt = new Date(Date.now() + AUTH_TTL_MS)

    await prisma.user.update({
      where: { id: userId },
      data: {
        telegramMtprotoPendingPhone: phoneNumber,
        telegramMtprotoPhoneCodeHash: sendResult.phoneCodeHash,
        telegramMtprotoAuthSession: authSession,
        telegramMtprotoAuthExpiresAt: expiresAt,
      },
    })

    return {
      isCodeViaApp: sendResult.isCodeViaApp,
      expiresAt: expiresAt.toISOString(),
    }
  } finally {
    await client.disconnect().catch(() => undefined)
  }
}

export async function completeTelegramMtprotoAuth(
  userId: string,
  code: string,
  password?: string,
) {
  const creds = getApiCredentials()
  if (!creds) {
    throw new Error("MTProto API kimlik bilgileri eksik")
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      telegramMtprotoPendingPhone: true,
      telegramMtprotoPhoneCodeHash: true,
      telegramMtprotoAuthSession: true,
      telegramMtprotoAuthExpiresAt: true,
    },
  })

  if (
    !user?.telegramMtprotoPendingPhone ||
    !user.telegramMtprotoPhoneCodeHash ||
    !user.telegramMtprotoAuthSession
  ) {
    throw new Error("Önce telefon numaranızı doğrulayın")
  }

  if (
    user.telegramMtprotoAuthExpiresAt &&
    user.telegramMtprotoAuthExpiresAt.getTime() < Date.now()
  ) {
    throw new Error("Doğrulama kodunun süresi doldu. Yeniden kod isteyin.")
  }

  const client = new TelegramClient(
    new StringSession(user.telegramMtprotoAuthSession),
    creds.apiId,
    creds.apiHash,
    { connectionRetries: 3 },
  )

  try {
    await client.connect()

    try {
      await client.invoke(
        new Api.auth.SignIn({
          phoneNumber: user.telegramMtprotoPendingPhone,
          phoneCodeHash: user.telegramMtprotoPhoneCodeHash,
          phoneCode: code.trim(),
        }),
      )
    } catch (error) {
      const message =
        error instanceof Error ? error.message : String(error)

      if (message.includes("SESSION_PASSWORD_NEEDED")) {
        if (!password?.trim()) {
          return { needsPassword: true as const }
        }

        await client.signInWithPassword(creds, {
          password: async () => password.trim(),
          onError: async () => false,
        })
      } else {
        throw error
      }
    }

    if (!(await client.checkAuthorization())) {
      throw new Error("Telegram oturumu oluşturulamadı")
    }

    const session = client.session.save() as unknown as string

    await prisma.user.update({
      where: { id: userId },
      data: {
        telegramMtprotoSession: session,
        telegramMtprotoPendingPhone: null,
        telegramMtprotoPhoneCodeHash: null,
        telegramMtprotoAuthSession: null,
        telegramMtprotoAuthExpiresAt: null,
      },
    })

    return { needsPassword: false as const, success: true as const }
  } finally {
    await client.disconnect().catch(() => undefined)
  }
}

export async function clearTelegramMtprotoAuth(userId: string) {
  await prisma.user.update({
    where: { id: userId },
    data: {
      telegramMtprotoPendingPhone: null,
      telegramMtprotoPhoneCodeHash: null,
      telegramMtprotoAuthSession: null,
      telegramMtprotoAuthExpiresAt: null,
    },
  })
}
