export class TelegramSenderNotReadyError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "TelegramSenderNotReadyError"
  }
}

export type TelegramOutboundSender =
  | { mode: "mtproto"; session: string }
  | { mode: "bot" }

export async function resolveTelegramOutboundSender(
  authorId?: string,
): Promise<TelegramOutboundSender> {
  if (!authorId) return { mode: "bot" }

  const { prisma } = await import("@/lib/prisma")
  const { isMtprotoConfigured } = await import("./mtproto")

  const user = await prisma.user.findUnique({
    where: { id: authorId },
    select: { telegramUserId: true, telegramMtprotoSession: true },
  })

  if (!user?.telegramUserId) {
    return { mode: "bot" }
  }

  const session = user.telegramMtprotoSession?.trim()
  if (session && isMtprotoConfigured()) {
    return { mode: "mtproto", session }
  }

  if (isMtprotoConfigured()) {
    throw new TelegramSenderNotReadyError(
      "Telegram'da kendi adınızla göndermek için Ayarlar → Telegram bölümünden «Kendi adımla göndermeyi etkinleştir» adımını tamamlayın.",
    )
  }

  throw new TelegramSenderNotReadyError(
    "Telegram'da bot adıyla mesaj göndermek devre dışı. Yönetici .env dosyasına TELEGRAM_API_ID ve TELEGRAM_API_HASH eklemeli; ardından Ayarlar → Telegram üzerinden kendi adınızla göndermeyi etkinleştirin.",
  )
}
