/**
 * Geliştirme ortamında webhook olmadan Telegram güncellemelerini dinler.
 * Production'da webhook kullanın.
 *
 * Kullanım: npm run telegram:poll
 */
import { isTelegramEnabled } from "../src/lib/telegram/config"
import {
  deleteTelegramWebhook,
  getTelegramUpdates,
  type TelegramUpdate,
} from "../src/lib/telegram/api"
import { handleTelegramUpdate } from "../src/lib/telegram/webhook"
import { syncAllTelegramTopics } from "../src/lib/telegram/sync"

async function main() {
  if (!isTelegramEnabled()) {
    console.error("TELEGRAM_BOT_TOKEN tanımlı değil. .env dosyasını kontrol edin.")
    process.exit(1)
  }

  console.log("Telegram long polling başlatılıyor...")
  console.log("Durdurmak için Ctrl+C")

  try {
    await deleteTelegramWebhook()
    console.log("Mevcut webhook kaldırıldı (polling modu).")
  } catch (error) {
    console.warn("Webhook kaldırılamadı:", error)
  }

  const syncResult = await syncAllTelegramTopics()
  if (syncResult.total > 0 || syncResult.imported || syncResult.updated) {
    console.log(
      `Telegram konuları: ${syncResult.synced} konu (${syncResult.imported ?? 0} yeni, ${syncResult.updated ?? 0} güncellendi)`,
    )
  }

  let offset = 0

  while (true) {
    try {
      const updates = await getTelegramUpdates({ offset, timeout: 25 })

      for (const update of updates) {
        offset = update.update_id + 1
        await processUpdate(update)
      }
    } catch (error) {
      console.error("Polling hatası:", error)
      await sleep(3000)
    }
  }
}

async function processUpdate(update: TelegramUpdate) {
  try {
    await handleTelegramUpdate(update)
    console.log(`✓ update #${update.update_id} işlendi`)
  } catch (error) {
    console.error(`✗ update #${update.update_id} hatası:`, error)
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
