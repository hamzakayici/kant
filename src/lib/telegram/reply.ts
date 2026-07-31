import type { TelegramMessage } from "./api"

/** Kullanıcının başka bir mesaja yanıt verdiği Telegram message_id (konu servis mesajları hariç). */
export function resolveUserReplyTelegramMessageId(
  message: TelegramMessage,
): number | null {
  const reply = message.reply_to_message
  if (!reply?.message_id) return null

  if (
    reply.forum_topic_created ||
    reply.forum_topic_edited ||
    reply.forum_topic_closed ||
    reply.forum_topic_reopened
  ) {
    return null
  }

  return reply.message_id
}
