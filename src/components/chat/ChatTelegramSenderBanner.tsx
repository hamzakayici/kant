"use client"

import Link from "next/link"
import { AlertTriangle } from "lucide-react"

export function ChatTelegramSenderBanner({
  telegramEnabled,
  telegramLinked,
  mtprotoConfigured,
  mtprotoLinked,
}: {
  telegramEnabled: boolean
  telegramLinked: boolean
  mtprotoConfigured: boolean
  mtprotoLinked: boolean
}) {
  if (!telegramEnabled || !telegramLinked || mtprotoLinked) return null

  return (
    <div className="mx-4 mt-3 flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-900 dark:text-amber-100 md:mx-6">
      <AlertTriangle className="mt-0.5 size-4 shrink-0" />
      <div>
        <p className="font-medium">
          Kant&apos;tan Telegram&apos;a mesaj göndermek için kendi hesabınızı
          doğrulamanız gerekiyor.
        </p>
        <p className="mt-1 text-xs opacity-90">
          Aksi halde mesajlar Telegram&apos;da &quot;Size Yakın&quot; botu
          adıyla solda görünür; doğrudan yazdıklarınız sağda kalır.
        </p>
        <p className="mt-2 text-xs opacity-90">
          {mtprotoConfigured ? (
            <>
              Kendi adınızla göndermek için{" "}
              <Link href="/settings/telegram" className="underline">
                Ayarlar → Telegram
              </Link>
              bölümünden &quot;Kendi adımla göndermeyi etkinleştir&quot; adımını
              tamamlayın.
            </>
          ) : (
            <>
              Yönetici:{" "}
              <code className="text-[11px]">TELEGRAM_API_ID</code> ve{" "}
              <code className="text-[11px]">TELEGRAM_API_HASH</code> değerlerini
              .env dosyasına ekleyin, ardından{" "}
              <Link href="/settings/telegram" className="underline">
                Ayarlar → Telegram
              </Link>
              üzerinden hesabınızı doğrulayın.
            </>
          )}
        </p>
      </div>
    </div>
  )
}
