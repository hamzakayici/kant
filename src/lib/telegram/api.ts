import { getTelegramApiUrl, getTelegramBotToken, isTelegramEnabled } from "./config"

type TelegramApiResponse<T> = {
  ok: boolean
  result?: T
  description?: string
}

async function callTelegramApi<T>(
  method: string,
  body?: Record<string, unknown>,
): Promise<T> {
  const res = await fetch(getTelegramApiUrl(method), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  })

  const data = (await res.json()) as TelegramApiResponse<T>
  if (!data.ok) {
    throw new Error(data.description || `Telegram API hatası: ${method}`)
  }

  return data.result as T
}

export type ForumTopic = {
  message_thread_id: number
  name: string
  icon_color?: number
  icon_custom_emoji_id?: string
}

export async function getForumTopic(
  chatId: string,
  topicId: number,
): Promise<ForumTopic | null> {
  try {
    return await callTelegramApi<ForumTopic>("getForumTopic", {
      chat_id: chatId,
      message_thread_id: topicId,
    })
  } catch {
    return null
  }
}

export async function createForumTopic(
  chatId: string,
  name: string,
): Promise<ForumTopic> {
  return callTelegramApi<ForumTopic>("createForumTopic", {
    chat_id: chatId,
    name: name.slice(0, 128),
  })
}

export async function editForumTopic(
  chatId: string,
  topicId: number,
  name: string,
): Promise<boolean> {
  return callTelegramApi<boolean>("editForumTopic", {
    chat_id: chatId,
    message_thread_id: topicId,
    name: name.slice(0, 128),
  })
}

export async function sendTelegramMessage(params: {
  chatId: string
  text: string
  topicId?: number | null
  replyToMessageId?: number | null
  replyMarkup?: Record<string, unknown>
  entities?: Array<Record<string, unknown>>
  parseMode?: "HTML" | "none"
  disableLinkPreview?: boolean
}): Promise<{ message_id: number }> {
  const body: Record<string, unknown> = {
    chat_id: params.chatId,
    text: params.text,
  }

  if (params.parseMode !== "none") {
    body.parse_mode = params.parseMode ?? "HTML"
  }

  if (params.entities?.length) {
    delete body.parse_mode
    body.entities = params.entities
  }

  if (params.disableLinkPreview) {
    body.link_preview_options = { is_disabled: true }
  }

  if (params.topicId) {
    body.message_thread_id = params.topicId
  }

  if (params.replyToMessageId) {
    body.reply_parameters = {
      message_id: params.replyToMessageId,
      allow_sending_without_reply: true,
    }
  }

  if (params.replyMarkup) {
    body.reply_markup = params.replyMarkup
  }

  return callTelegramApi<{ message_id: number }>("sendMessage", body)
}

export type TelegramFile = {
  file_id: string
  file_unique_id: string
  file_size?: number
  file_path?: string
}

export async function getTelegramFile(fileId: string): Promise<TelegramFile> {
  return callTelegramApi<TelegramFile>("getFile", { file_id: fileId })
}

export async function downloadTelegramFile(fileId: string): Promise<{
  buffer: Buffer
  filePath: string
}> {
  const file = await getTelegramFile(fileId)
  if (!file.file_path) {
    throw new Error("Telegram dosya yolu alınamadı")
  }

  const url = `https://api.telegram.org/file/bot${getTelegramBotToken()}/${file.file_path}`
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`Telegram dosyası indirilemedi: ${res.status}`)
  }

  const arrayBuffer = await res.arrayBuffer()
  return {
    buffer: Buffer.from(arrayBuffer),
    filePath: file.file_path,
  }
}

type TelegramMediaSendMethod =
  | "sendPhoto"
  | "sendDocument"
  | "sendVideo"
  | "sendVoice"
  | "sendAudio"
  | "sendAnimation"

export async function sendTelegramMediaFile(params: {
  method: TelegramMediaSendMethod
  chatId: string
  topicId?: number | null
  replyToMessageId?: number | null
  fileField: string
  buffer: Buffer
  filename: string
  mimeType: string
  caption?: string
  parseMode?: "HTML" | "none"
}): Promise<{ message_id: number }> {
  const form = new FormData()

  form.append("chat_id", params.chatId)
  if (params.topicId) {
    form.append("message_thread_id", String(params.topicId))
  }
  if (params.replyToMessageId) {
    form.append(
      "reply_parameters",
      JSON.stringify({
        message_id: params.replyToMessageId,
        allow_sending_without_reply: true,
      }),
    )
  }
  if (params.caption) {
    form.append("caption", params.caption)
    if (params.parseMode !== "none") {
      form.append("parse_mode", params.parseMode ?? "HTML")
    }
  }

  form.append(
    params.fileField,
    new Blob([new Uint8Array(params.buffer)], { type: params.mimeType }),
    params.filename,
  )

  const res = await fetch(getTelegramApiUrl(params.method), {
    method: "POST",
    body: form,
  })

  const data = (await res.json()) as TelegramApiResponse<{ message_id: number }>
  if (!data.ok) {
    throw new Error(data.description || `Telegram API hatası: ${params.method}`)
  }

  return data.result as { message_id: number }
}

export async function deleteTelegramMessage(
  chatId: string,
  messageId: number,
): Promise<boolean> {
  return callTelegramApi<boolean>("deleteMessage", {
    chat_id: chatId,
    message_id: messageId,
  })
}

export async function editTelegramMessage(params: {
  chatId: string
  messageId: number
  text: string
  topicId?: number | null
}): Promise<boolean> {
  const body: Record<string, unknown> = {
    chat_id: params.chatId,
    message_id: params.messageId,
    text: params.text,
  }

  if (params.topicId) {
    body.message_thread_id = params.topicId
  }

  return callTelegramApi<boolean>("editMessageText", body)
}

export async function setTelegramWebhook(
  url: string,
  secretToken?: string,
): Promise<boolean> {
  const body: Record<string, unknown> = {
    url,
    allowed_updates: [
      "message",
      "edited_message",
      "forum_topic_created",
      "forum_topic_edited",
      "forum_topic_closed",
      "forum_topic_reopened",
    ],
    drop_pending_updates: true,
  }

  if (secretToken) {
    body.secret_token = secretToken
  }

  return callTelegramApi<boolean>("setWebhook", body)
}

export type TelegramBotInfo = {
  id: number
  username: string
  first_name: string
  can_read_all_group_messages?: boolean
  can_join_groups?: boolean
}

export async function getTelegramBotInfo(): Promise<TelegramBotInfo> {
  return callTelegramApi("getMe")
}

export type TelegramChatInfo = {
  id: number
  type: "private" | "group" | "supergroup" | "channel"
  title?: string
  username?: string
  is_forum?: boolean
}

export async function getTelegramChat(chatId: string): Promise<TelegramChatInfo> {
  return callTelegramApi<TelegramChatInfo>("getChat", { chat_id: chatId })
}

export type TelegramChatMember = {
  status: "creator" | "administrator" | "member" | "restricted" | "left" | "kicked"
  user: { id: number; is_bot: boolean }
  can_manage_topics?: boolean
}

export async function getTelegramChatMember(
  chatId: string,
  userId: number,
): Promise<TelegramChatMember> {
  return callTelegramApi<TelegramChatMember>("getChatMember", {
    chat_id: chatId,
    user_id: userId,
  })
}

export type TelegramWebhookInfo = {
  url: string
  has_custom_certificate: boolean
  pending_update_count: number
  last_error_date?: number
  last_error_message?: string
  max_connections?: number
  ip_address?: string
}

export async function getTelegramWebhookInfo(): Promise<TelegramWebhookInfo> {
  return callTelegramApi<TelegramWebhookInfo>("getWebhookInfo")
}

export async function deleteTelegramWebhook(): Promise<boolean> {
  return callTelegramApi<boolean>("deleteWebhook", {
    drop_pending_updates: true,
  })
}

export type TelegramPhotoSize = {
  file_id: string
  file_unique_id: string
  width: number
  height: number
  file_size?: number
}

export type TelegramFileRef = {
  file_id: string
  file_unique_id?: string
  file_name?: string
  mime_type?: string
  file_size?: number
  width?: number
  height?: number
  duration?: number
}

export type TelegramMessage = {
  message_id: number
  message_thread_id?: number
  text?: string
  caption?: string
  chat: { id: number; type: string; title?: string; is_forum?: boolean }
  from?: {
    id: number
    username?: string
    first_name?: string
    is_bot?: boolean
  }
  migrate_to_chat_id?: number
  forum_topic_created?: {
    name: string
    icon_color?: number
  }
  forum_topic_edited?: {
    name: string
    icon_custom_emoji_id?: string
  }
  forum_topic_closed?: Record<string, never>
  forum_topic_reopened?: Record<string, never>
  is_topic_message?: boolean
  reply_to_message?: TelegramMessage
  edit_date?: number
  photo?: TelegramPhotoSize[]
  document?: TelegramFileRef
  video?: TelegramFileRef
  voice?: TelegramFileRef
  audio?: TelegramFileRef
  animation?: TelegramFileRef
  video_note?: TelegramFileRef
}

export type TelegramUpdate = {
  update_id: number
  message?: TelegramMessage
  edited_message?: TelegramMessage
}

export async function getTelegramUpdates(params?: {
  offset?: number
  timeout?: number
}): Promise<TelegramUpdate[]> {
  const body: Record<string, unknown> = {
    allowed_updates: [
      "message",
      "edited_message",
      "forum_topic_created",
      "forum_topic_edited",
      "forum_topic_closed",
      "forum_topic_reopened",
    ],
    timeout: params?.timeout ?? 25,
  }

  if (params?.offset !== undefined) {
    body.offset = params.offset
  }

  return callTelegramApi<TelegramUpdate[]>("getUpdates", body)
}

export async function safeTelegramCall<T>(
  fn: () => Promise<T>,
): Promise<T | null> {
  if (!isTelegramEnabled()) return null
  try {
    return await fn()
  } catch (error) {
    console.error("Telegram API hatası:", error)
    return null
  }
}
