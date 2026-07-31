export const TELEGRAM_SENDER_NOT_READY_MESSAGE =
  "Telegram'da kendi adınızla göndermek için Ayarlar → Telegram bölümünden «Kendi adımla göndermeyi etkinleştir» adımını tamamlayın."

export function formatChatActionError(error: unknown): string {
  if (error instanceof Error) {
    if (
      error.name === "TelegramSenderNotReadyError" ||
      error.message.includes("Kendi adımla göndermeyi")
    ) {
      return error.message || TELEGRAM_SENDER_NOT_READY_MESSAGE
    }
    if (error.message) return error.message
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    (error as { name: string }).name === "TelegramSenderNotReadyError"
  ) {
    return TELEGRAM_SENDER_NOT_READY_MESSAGE
  }

  return "Mesaj gönderilemedi"
}
