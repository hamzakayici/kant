import { TelegramClient } from "telegram"
import { StringSession } from "telegram/sessions"
import { Api } from "telegram/tl"
import { Button } from "telegram/tl/custom/button"

function getApiCredentials() {
  const apiId = Number(process.env.TELEGRAM_API_ID)
  const apiHash = process.env.TELEGRAM_API_HASH?.trim()
  if (!apiId || !apiHash) return null
  return { apiId, apiHash }
}

export function isMtprotoConfigured() {
  return Boolean(getApiCredentials())
}

function buildForumSendParams(options: {
  topicId?: number | null
  replyToMessageId?: number | null
}) {
  const params: { replyTo?: number; topMsgId?: number } = {}

  if (options.replyToMessageId) {
    params.replyTo = options.replyToMessageId
    if (options.topicId) {
      params.topMsgId = options.topicId
    }
  } else if (options.topicId) {
    params.replyTo = options.topicId
    params.topMsgId = options.topicId
  }

  return params
}

async function withTelegramClient<T>(
  session: string,
  fn: (client: TelegramClient) => Promise<T>,
): Promise<T> {
  const creds = getApiCredentials()
  if (!creds) throw new Error("MTProto yapılandırılmamış")

  const client = new TelegramClient(
    new StringSession(session),
    creds.apiId,
    creds.apiHash,
    { connectionRetries: 3 },
  )

  try {
    await client.connect()
    return await fn(client)
  } finally {
    await client.disconnect().catch(() => undefined)
  }
}

/** Forum konusuna kullanıcı hesabıyla mesaj gönderir (bot adı görünmez). */
export async function sendUserForumMessage(params: {
  session: string
  chatId: string
  topicId?: number | null
  replyToMessageId?: number | null
  text: string
  parseMode?: "html" | "md"
  buttonUrl?: { label: string; url: string }
}): Promise<number | null> {
  if (!params.session.trim() || !params.text.trim()) return null

  try {
    return await withTelegramClient(params.session, async (client) => {
      if (!(await client.checkAuthorization())) return null

      const peer = await client.getInputEntity(params.chatId)
      const result = await client.sendMessage(peer, {
        message: params.text,
        parseMode: params.parseMode,
        linkPreview: false,
        buttons: params.buttonUrl
          ? [[Button.url(params.buttonUrl.label, params.buttonUrl.url)]]
          : undefined,
        ...buildForumSendParams({
          topicId: params.topicId,
          replyToMessageId: params.replyToMessageId,
        }),
      })

      return result.id ?? null
    })
  } catch (error) {
    console.error(
      "MTProto mesaj gönderilemedi:",
      error instanceof Error ? error.message : error,
    )
    return null
  }
}

export type UserForumFile = {
  buffer: Buffer
  filename: string
  mimeType: string
}

/** Forum konusuna kullanıcı hesabıyla dosya gönderir. */
export async function sendUserForumFiles(params: {
  session: string
  chatId: string
  topicId?: number | null
  replyToMessageId?: number | null
  text?: string
  parseMode?: "html" | "md"
  buttonUrl?: { label: string; url: string }
  files: UserForumFile[]
}): Promise<number | null> {
  if (!params.session.trim() || !params.files.length) return null

  try {
    return await withTelegramClient(params.session, async (client) => {
      if (!(await client.checkAuthorization())) return null

      const peer = await client.getInputEntity(params.chatId)
      const topic = buildForumSendParams({
        topicId: params.topicId,
        replyToMessageId: params.replyToMessageId,
      })
      let lastId: number | null = null

      for (const [index, file] of params.files.entries()) {
        const caption =
          index === 0 && params.text?.trim() ? params.text.trim() : undefined
        const lower = file.filename.toLowerCase()
        const isVoice =
          file.mimeType === "audio/ogg" || lower.endsWith(".ogg")
        const isVideoNote = lower.endsWith("video-note.mp4")

        const result = await client.sendFile(peer, {
          file: file.buffer,
          caption,
          parseMode: index === 0 ? params.parseMode : undefined,
          buttons:
            index === 0 && params.buttonUrl
              ? [[Button.url(params.buttonUrl.label, params.buttonUrl.url)]]
              : undefined,
          forceDocument:
            !file.mimeType.startsWith("image/") &&
            !file.mimeType.startsWith("video/") &&
            !isVoice,
          voiceNote: isVoice,
          videoNote: isVideoNote,
          attributes: file.filename
            ? [new Api.DocumentAttributeFilename({ fileName: file.filename })]
            : undefined,
          ...topic,
        })

        if (result.id) lastId = result.id
      }

      return lastId
    })
  } catch (error) {
    console.error(
      "MTProto dosya gönderilemedi:",
      error instanceof Error ? error.message : error,
    )
    return null
  }
}
