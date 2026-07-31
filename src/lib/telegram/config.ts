export function isTelegramEnabled(): boolean {
  return Boolean(process.env.TELEGRAM_BOT_TOKEN?.trim())
}

export function getTelegramBotToken(): string {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim()
  if (!token) {
    throw new Error("TELEGRAM_BOT_TOKEN yapılandırılmamış")
  }
  return token
}

export function getTelegramWebhookSecret(): string | undefined {
  return process.env.TELEGRAM_WEBHOOK_SECRET?.trim() || undefined
}

export function getTelegramBotUsername(): string | undefined {
  return process.env.TELEGRAM_BOT_USERNAME?.trim().replace(/^@/, "") || undefined
}

export function getTelegramApiUrl(method: string): string {
  return `https://api.telegram.org/bot${getTelegramBotToken()}/${method}`
}
