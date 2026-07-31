/**
 * Kant'tan Telegram'a kendi adınızla mesaj göndermek için MTProto oturumu oluşturur.
 *
 * Önkoşullar:
 * 1. https://my.telegram.org → API development tools → api_id + api_hash
 * 2. .env dosyasına TELEGRAM_API_ID ve TELEGRAM_API_HASH ekleyin
 *
 * Kullanım: npm run telegram:user-session -- hamzakayc@gmail.com
 */
import * as readline from "readline/promises"
import { stdin as input, stdout as output } from "process"
import { TelegramClient } from "telegram"
import { StringSession } from "telegram/sessions"
import { prisma } from "../src/lib/prisma"

async function main() {
  const email = process.argv[2]?.trim()
  if (!email) {
    console.error("Kullanım: npm run telegram:user-session -- kullanici@email.com")
    process.exit(1)
  }

  const apiId = Number(process.env.TELEGRAM_API_ID)
  const apiHash = process.env.TELEGRAM_API_HASH?.trim()
  if (!apiId || !apiHash) {
    console.error(
      "TELEGRAM_API_ID ve TELEGRAM_API_HASH .env dosyasında tanımlı olmalı.\n" +
        "https://my.telegram.org/apps adresinden alın.",
    )
    process.exit(1)
  }

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    console.error(`Kullanıcı bulunamadı: ${email}`)
    process.exit(1)
  }

  const rl = readline.createInterface({ input, output })
  const existing = user.telegramMtprotoSession?.trim()
  const client = new TelegramClient(
    new StringSession(existing ?? ""),
    apiId,
    apiHash,
    { connectionRetries: 5 },
  )

  console.log(`Telegram oturumu: ${email}`)
  if (existing) {
    console.log("Mevcut oturum yenileniyor...")
  }

  await client.start({
    phoneNumber: async () => rl.question("Telefon (+90...): "),
    password: async () => rl.question("2FA şifresi (yoksa boş): "),
    phoneCode: async () => rl.question("Telegram kodu: "),
    onError: (error) => console.error(error),
  })

  const session = client.session.save() as unknown as string
  await prisma.user.update({
    where: { id: user.id },
    data: { telegramMtprotoSession: session },
  })

  await client.disconnect()
  rl.close()

  console.log("\n✅ MTProto oturumu kaydedildi.")
  console.log("Artık Kant'tan gönderdiğiniz mesajlar Telegram'da kendi adınızla görünür.")
  await prisma.$disconnect()
}

main().catch(async (error) => {
  console.error(error)
  await prisma.$disconnect()
  process.exit(1)
})
