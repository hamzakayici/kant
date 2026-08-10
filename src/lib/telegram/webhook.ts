import { prisma } from "@/lib/prisma"
import { sendTelegramMessage, type TelegramMessage } from "./api"
import type { TelegramUpdate } from "./api"
import { getTelegramBotUsername } from "./config"
import {
  getTelegramSupergroupId,
  setTelegramSupergroupId,
  setTelegramGeneralTopicName,
} from "./settings"
import { getUserDisplayName } from "@/lib/user"
import {
  createChatMessageWithTelegram,
  findChatGroupForInboundMessage,
  migrateTelegramSupergroupId,
  resolveTelegramAuthor,
  addTelegramUserToAllChatGroups,
  importTelegramTopicToKant,
  ensureTelegramTopicImported,
  syncAllForumTopicsInChat,
  resolveTopicNameFromMessage,
  isPlaceholderTopicName,
  resolveInboundForumTopicId,
  isTelegramChatForum,
  GENERAL_FORUM_TOPIC_ID,
  toTelegramThreadId,
  importTelegramMediaAttachment,
  resolveInboundReplyToId,
} from "./sync"
import { extractTelegramMedia, getTelegramInboundContent } from "./media"

async function registerForumSupergroupIfNeeded(chatId: string) {
  const current = await getTelegramSupergroupId()
  if (current === chatId) return

  await setTelegramSupergroupId(chatId)
}

export async function handleTelegramUpdate(update: TelegramUpdate) {
  if (update.edited_message) {
    await handleEditedTelegramMessage(update.edited_message)
    return
  }

  const message = update.message
  if (!message) return

  const chatId = String(message.chat.id)
  const supergroupId = await getTelegramSupergroupId()

  if (message.migrate_to_chat_id) {
    await migrateTelegramSupergroupId(
      String(message.chat.id),
      String(message.migrate_to_chat_id),
    )
    return
  }

  const isForum = await isForumMessageChat(chatId, message)

  if (isForum) {
    await registerForumSupergroupIfNeeded(chatId)
    const topicId = await resolveInboundForumTopicId(chatId, message)

    if (message.forum_topic_created && message.message_thread_id) {
      await importTelegramTopicToKant(
        message.message_thread_id,
        message.forum_topic_created.name,
      )
      return
    }

    if (message.forum_topic_edited) {
      const editedTopicId = message.message_thread_id ?? GENERAL_FORUM_TOPIC_ID
      if (editedTopicId === GENERAL_FORUM_TOPIC_ID) {
        await setTelegramGeneralTopicName(message.forum_topic_edited.name)
      }
      await importTelegramTopicToKant(
        editedTopicId,
        message.forum_topic_edited.name,
      )
      if (!message.text?.startsWith("/")) return
    }

    if (topicId) {
      const resolvedName = resolveTopicNameFromMessage(message)
      if (resolvedName) {
        await importTelegramTopicToKant(topicId, resolvedName)
      } else {
        await ensureTelegramTopicImported(topicId, undefined, message)
      }
    }
  } else if (supergroupId && chatId === supergroupId) {
    if (message.message_thread_id) {
      await ensureTelegramTopicImported(
        message.message_thread_id,
        undefined,
        message,
      )
    }
  }

  if (!message.from || message.from.is_bot) {
    const topicId = await resolveMessageTopicId(message)
    const renameName = resolveTopicNameFromMessage(message)
    if (isForum && topicId && renameName) {
      await registerForumSupergroupIfNeeded(chatId)
      await importTelegramTopicToKant(topicId, renameName)
    }
    return
  }

  const textContent = getTelegramInboundContent(message)
  const hasMedia = Boolean(extractTelegramMedia(message))
  if (!textContent && !hasMedia) return

  const topicId = await resolveMessageTopicId(message)

  if (textContent.startsWith("/")) {
    await handleBotCommand(message, textContent, isForum)
    return
  }

  const group = await findChatGroupForInboundMessage(chatId, topicId, message)
  if (!group) return

  const existing = await prisma.chatMessage.findFirst({
    where: {
      chatGroupId: group.id,
      telegramMessageId: String(message.message_id),
    },
  })
  if (existing) return

  const author = await resolveTelegramAuthor(
    message.from.id,
    message.from.username,
  )

  if (!author) {
    await sendTelegramMessage({
      chatId,
      text:
        "Zubee hesabınız bağlı değil. Ayarlar → Telegram bölümünden bağlantı kodu alın ve bota /start KOD gönderin.",
      topicId: toTelegramThreadId(topicId),
    })
    return
  }

  const isMember = await prisma.chatGroupMember.findUnique({
    where: {
      chatGroupId_userId: {
        chatGroupId: group.id,
        userId: author.id,
      },
    },
  })

  if (!isMember && author.role !== "ADMIN") {
    await sendTelegramMessage({
      chatId,
      text: "Bu gruba mesaj göndermek için Zubee'de bu sohbet grubunun üyesi olmalısınız.",
      topicId: toTelegramThreadId(topicId),
    })
    return
  }

  // Zubee'den MTProto ile gönderilen mesajın Telegram yankısı — çift kayıt önle
  const echoedWebMessage = await prisma.chatMessage.findFirst({
    where: {
      chatGroupId: group.id,
      authorId: author.id,
      source: "web",
      deletedAt: null,
      telegramMessageId: String(message.message_id),
    },
  })
  if (echoedWebMessage) return

  const recentWebEcho = textContent
    ? await prisma.chatMessage.findFirst({
        where: {
          chatGroupId: group.id,
          authorId: author.id,
          source: "web",
          content: textContent,
          deletedAt: null,
          createdAt: { gte: new Date(Date.now() - 2 * 60 * 1000) },
          OR: [
            { telegramMessageId: null },
            { telegramMessageId: String(message.message_id) },
          ],
        },
        orderBy: { createdAt: "desc" },
      })
    : null

  if (recentWebEcho) {
    await prisma.chatMessage.update({
      where: { id: recentWebEcho.id },
      data: { telegramMessageId: String(message.message_id) },
    })
    return
  }

  let attachmentIds: string[] | undefined
  if (hasMedia) {
    try {
      const attachment = await importTelegramMediaAttachment(group.id, message)
      if (attachment) {
        attachmentIds = [attachment.id]
      }
    } catch (error) {
      console.error("Telegram medya içe aktarılamadı:", error)
    }
  }

  const replyToId = await resolveInboundReplyToId(group.id, message)

  await createChatMessageWithTelegram({
    chatGroupId: group.id,
    authorId: author.id,
    content: textContent,
    source: "telegram",
    telegramMessageId: String(message.message_id),
    pushToTelegram: false,
    attachmentIds,
    replyToId,
  })
}

async function handleEditedTelegramMessage(message: TelegramMessage) {
  const chatId = String(message.chat.id)
  const supergroupId = await getTelegramSupergroupId()
  if (!supergroupId || chatId !== supergroupId) return
  if (!message.from || message.from.is_bot) return

  const topicId = await resolveMessageTopicId(message)
  const group = await findChatGroupForInboundMessage(chatId, topicId, message)
  if (!group) return

  const content = getTelegramInboundContent(message)
  if (!content) return

  const existing = await prisma.chatMessage.findFirst({
    where: {
      chatGroupId: group.id,
      telegramMessageId: String(message.message_id),
      deletedAt: null,
    },
  })

  if (!existing) return

  await prisma.chatMessage.update({
    where: { id: existing.id },
    data: {
      content,
      editedAt: message.edit_date
        ? new Date(message.edit_date * 1000)
        : new Date(),
    },
  })
}

function parseBotCommand(text: string): { command: string; args: string } {
  const parts = text.trim().split(/\s+/)
  const commandPart = parts[0].split("@")[0].toLowerCase()
  const args = parts.slice(1).join(" ").trim()
  return { command: commandPart, args }
}

async function isForumMessageChat(
  chatId: string,
  message: TelegramMessage,
): Promise<boolean> {
  if (message.chat.is_forum) return true

  const supergroupId = await getTelegramSupergroupId()
  if (!supergroupId || chatId !== supergroupId) return false

  return isTelegramChatForum(chatId)
}

async function resolveMessageTopicId(
  message: TelegramMessage,
): Promise<number | undefined> {
  return resolveInboundForumTopicId(String(message.chat.id), message)
}

async function handleBotCommand(
  message: TelegramMessage,
  text: string,
  isForum: boolean,
) {
  const chatId = String(message.chat.id)
  const fromId = message.from!.id
  const { command, args } = parseBotCommand(text)
  const topicId = await resolveMessageTopicId(message)

  if (command === "/start") {
    if (args) {
      await linkTelegramAccount(fromId, message.from!.username, args, chatId)
      return
    }

    const botUsername = getTelegramBotUsername()
    const botMention = botUsername ? `@${botUsername}` : "bota"

    await sendTelegramMessage({
      chatId,
      text:
        "Merhaba! Zubee sohbet botuna hoş geldiniz.\n\n" +
        "Hesabınızı bağlamak için Zubee'de Ayarlar → Telegram bölümünden bağlantı kodunu alın, " +
        `ardından ${botMention} şu şekilde gönderin:\n\n` +
        "<code>/start KODUNUZ</code>",
      topicId: toTelegramThreadId(topicId),
    })
    return
  }

  if (command === "/link" && args) {
    await linkTelegramAccount(fromId, message.from!.username, args, chatId)
    return
  }

  if (command === "/kant_sync" || command === "/sync") {
    if (!isForum) {
      await sendTelegramMessage({
        chatId,
        text: "Bu komut yalnızca forum (konular açık) gruplarda çalışır.",
        topicId: toTelegramThreadId(topicId),
      })
      return
    }

    await registerForumSupergroupIfNeeded(chatId)

    if (topicId) {
      const resolvedName = resolveTopicNameFromMessage(message)
      const group = await ensureTelegramTopicImported(
        topicId,
        resolvedName ?? undefined,
        message,
      )
      const name = group?.name
      const hint =
        !name || isPlaceholderTopicName(name, topicId)
          ? "\n\nİsim görünmüyorsa konunun içinde herhangi bir mesaj gönderin veya konu adını Telegram'da bir kez düzenleyin."
          : ""
      await sendTelegramMessage({
        chatId,
        text: name
          ? `✅ "${name}" Zubee ile eşlendi. Sohbet sayfasını yenileyin.${hint}`
          : `✅ Konu #${topicId} eşlendi; ad henüz alınamadı. Bir mesaj gönderin veya konu adını düzenleyin.${hint}`,
        topicId: toTelegramThreadId(topicId),
      })
      return
    }

    const result = await syncAllForumTopicsInChat(chatId)
    const total = await prisma.chatGroup.count({
      where: { telegramTopicId: { not: null } },
    })

    if (result.imported + result.updated > 0) {
      await sendTelegramMessage({
        chatId,
        text:
          `✅ ${result.imported} yeni konu eklendi, ${result.updated} güncellendi. ` +
          `Zubee'de toplam ${total} konu görünüyor. Sayfayı yenileyin.`,
      })
      return
    }

    await sendTelegramMessage({
      chatId,
      text:
        "Genel kanaldan gönderdiniz; tek konu eşlenemedi.\n\n" +
        "Şunu deneyin:\n" +
        "1. Konu listesinden bir konuya girin (ör. Görsel İşler)\n" +
        "2. O konunun içinde /kant_sync yazın\n\n" +
        "Veya her konunun adını bir kez düzenleyin (Telegram bunu Zubee'ye aktarır).",
    })
    return
  }
}

async function linkTelegramAccount(
  telegramUserId: number,
  username: string | undefined,
  code: string,
  chatId: string,
) {
  const user = await prisma.user.findFirst({
    where: {
      telegramLinkCode: code.toUpperCase(),
      telegramLinkCodeExpiresAt: { gt: new Date() },
    },
  })

  if (!user) {
    await sendTelegramMessage({
      chatId,
      text: "Geçersiz veya süresi dolmuş bağlantı kodu. Zubee'den yeni kod oluşturun.",
    })
    return
  }

  const existing = await prisma.user.findUnique({
    where: { telegramUserId: String(telegramUserId) },
  })

  if (existing && existing.id !== user.id) {
    await sendTelegramMessage({
      chatId,
      text: "Bu Telegram hesabı başka bir Zubee kullanıcısına bağlı.",
    })
    return
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      telegramUserId: String(telegramUserId),
      telegramUsername: username ?? null,
      telegramLinkCode: null,
      telegramLinkCodeExpiresAt: null,
    },
  })

  await addTelegramUserToAllChatGroups(user.id)

  await sendTelegramMessage({
    chatId,
    text: `✅ Zubee hesabınız (${getUserDisplayName(user)}) başarıyla bağlandı. Artık Telegram mesajlarınız siteyle eşzamanlı görünecek.`,
  })
}
