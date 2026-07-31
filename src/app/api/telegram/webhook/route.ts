import { NextRequest, NextResponse } from "next/server"
import { getTelegramWebhookSecret, isTelegramEnabled } from "@/lib/telegram/config"
import { handleTelegramUpdate } from "@/lib/telegram/webhook"

export async function POST(req: NextRequest) {
  if (!isTelegramEnabled()) {
    return NextResponse.json({ error: "Telegram devre dışı" }, { status: 503 })
  }

  const secret = getTelegramWebhookSecret()
  if (secret) {
    const headerSecret = req.headers.get("x-telegram-bot-api-secret-token")
    if (headerSecret !== secret) {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 401 })
    }
  }

  try {
    const update = await req.json()
    await handleTelegramUpdate(update)
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Telegram webhook hatası:", error)
    return NextResponse.json({ ok: true })
  }
}
