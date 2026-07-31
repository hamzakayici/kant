/**
 * Telegram entegrasyonu kurulum ve tanılama aracı.
 *
 * Kullanım: npm run telegram:setup
 */
import { prisma } from "../src/lib/prisma"
import { isTelegramEnabled } from "../src/lib/telegram/config"
import { getTelegramSupergroupId, getTelegramDefaultChatGroupId } from "../src/lib/telegram/settings"
import {
  deleteTelegramWebhook,
  getTelegramBotInfo,
  getTelegramChat,
  getTelegramChatMember,
  getTelegramUpdates,
  getTelegramWebhookInfo,
} from "../src/lib/telegram/api"

async function main() {
  console.log("=== Kant Telegram Kurulum ===\n")

  if (!isTelegramEnabled()) {
    console.error("❌ TELEGRAM_BOT_TOKEN tanımlı değil (.env)")
    process.exit(1)
  }

  const baseUrl =
    process.env.AUTH_URL ||
    process.env.NEXTAUTH_URL ||
    process.env.NEXT_PUBLIC_APP_URL

  if (!baseUrl) {
    console.warn("⚠️  AUTH_URL tanımlı değil — .env dosyasına AUTH_URL ekleyin")
  } else {
    console.log(`✓ AUTH_URL: ${baseUrl}`)
  }

  const bot = await getTelegramBotInfo()
  console.log(`✓ Bot: @${bot.username} (${bot.first_name})`)

  if (bot.can_read_all_group_messages === false) {
    console.error(
      "\n❌ Gizlilik modu AÇIK — bot grup mesajlarını okuyamaz!",
    )
    console.log("   BotFather → /setprivacy → Disable → botu gruba yeniden ekleyin\n")
  } else {
    console.log("✓ Gizlilik modu kapalı (grup mesajları okunabilir)")
  }

  const webhook = await getTelegramWebhookInfo()
  if (webhook.url) {
    console.log(`✓ Webhook: ${webhook.url}`)
    if (webhook.last_error_message) {
      console.warn(`⚠️  Webhook hatası: ${webhook.last_error_message}`)
    }
  } else {
    console.log("ℹ️  Webhook kayıtlı değil — geliştirme için: npm run telegram:poll")
    try {
      await deleteTelegramWebhook()
      console.log("   (Polling için webhook temizlendi)")
    } catch {
      // ignore
    }
  }

  const supergroupId = await getTelegramSupergroupId()
  const defaultChatGroupId = await getTelegramDefaultChatGroupId()
  console.log("\n--- Kant Telegram grubu ---")
  if (!supergroupId) {
    console.log(
      "Süper grup atanmamış. .env dosyasına TELEGRAM_SUPERGROUP_ID ekleyin.",
    )
  } else {
    try {
      const info = await getTelegramChat(supergroupId)
      const member = await getTelegramChatMember(supergroupId, bot.id)
      const forum = info.is_forum ? "forum" : "konu yok"
      const admin =
        member.status === "administrator" || member.status === "creator"
          ? "yönetici"
          : member.status

      console.log(`\n• ${info.title ?? supergroupId}`)
      console.log(`  ID: ${supergroupId}`)
      console.log(`  Tür: ${info.type} | ${forum} | Bot: ${admin}`)

      if (!info.is_forum) {
        console.log("  ⚠️  Forum/Konular özelliğini açın")
      }
      if (member.status !== "administrator" && member.status !== "creator") {
        console.log("  ⚠️  Botu yönetici yapın")
      }
    } catch (error) {
      console.log(`\n• ${supergroupId} (detay alınamadı)`)
      console.log(`  ${error instanceof Error ? error.message : error}`)
    }
  }

  if (defaultChatGroupId) {
    const defaultGroup = await prisma.chatGroup.findUnique({
      where: { id: defaultChatGroupId },
      select: { name: true, telegramTopicId: true },
    })
    if (defaultGroup) {
      console.log(
        `\nVarsayılan Kant sohbeti: ${defaultGroup.name} (konu #${defaultGroup.telegramTopicId ?? "?"})`,
      )
      console.log("  TELEGRAM_DEFAULT_TOPIC_ID ile .env üzerinden ayarlanır.")
    }
  } else if (process.env.TELEGRAM_DEFAULT_TOPIC_ID?.trim()) {
    console.log(
      `\n⚠️  TELEGRAM_DEFAULT_TOPIC_ID tanımlı ama eşleşen Kant grubu yok — önce içe aktarın.`,
    )
  }

  console.log("\n--- Keşfedilen gruplar (getUpdates) ---")
  const updates = await getTelegramUpdates({ timeout: 0 })
  const seen = new Set<string>()

  for (const update of updates) {
    const chat = update.message?.chat
    if (!chat || chat.type === "private") continue

    const chatId = String(chat.id)
    if (seen.has(chatId)) continue
    seen.add(chatId)

    try {
      const info = await getTelegramChat(chatId)
      const member = await getTelegramChatMember(chatId, bot.id)
      const forum = info.is_forum ? "forum" : "konu yok"
      const admin =
        member.status === "administrator" || member.status === "creator"
          ? "yönetici"
          : member.status

      console.log(`\n• ${info.title ?? chatId}`)
      console.log(`  ID: ${chatId}`)
      console.log(`  Tür: ${info.type} | ${forum} | Bot: ${admin}`)
    } catch (error) {
      console.log(`\n• ${chatId} (detay alınamadı)`)
      console.log(`  ${error instanceof Error ? error.message : error}`)
    }
  }

  if (seen.size === 0) {
    console.log("Grup bulunamadı. Botu gruba ekleyin ve grupta mesaj gönderin.")
  }

  console.log("\n--- Sohbet grupları ---")
  const chatGroups = await prisma.chatGroup.findMany({
    select: {
      name: true,
      telegramTopicId: true,
      board: { select: { identifier: true, name: true } },
    },
    orderBy: [{ board: { order: "asc" } }, { name: "asc" }],
  })

  if (chatGroups.length === 0) {
    console.log("Sohbet grubu yok.")
  }

  for (const group of chatGroups) {
    const topic = group.telegramTopicId
      ? `konu #${group.telegramTopicId}`
      : "eşlenmedi"
    console.log(
      `\n• ${group.board.identifier} / ${group.name}`,
    )
    console.log(`  Telegram: ${topic}`)
  }

  const linkedUsers = await prisma.user.count({
    where: { telegramUserId: { not: null } },
  })
  console.log(`\n--- Bağlı kullanıcılar: ${linkedUsers} ---`)

  console.log("\n=== Sonraki adımlar ===")
  console.log("1. .env: TELEGRAM_SUPERGROUP_ID ve TELEGRAM_DEFAULT_TOPIC_ID")
  console.log("2. Ayarlar → Telegram → Telegram'dan İçe Aktar")
  console.log("3. Kullanıcılar hesaplarını /start KOD ile bağlasın")
  console.log("4. Geliştirmede: npm run telegram:poll (ayrı terminal)")
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
