import type { TelegramMessage } from "./api"

export type TelegramMediaKind =
  | "photo"
  | "document"
  | "video"
  | "voice"
  | "audio"
  | "animation"
  | "video_note"

export type ExtractedTelegramMedia = {
  kind: TelegramMediaKind
  fileId: string
  mimeType?: string
  filename?: string
  width?: number
  height?: number
  duration?: number
}

type TelegramPhotoSize = {
  file_id: string
  file_unique_id: string
  width: number
  height: number
  file_size?: number
}

type TelegramFileRef = {
  file_id: string
  file_unique_id?: string
  file_name?: string
  mime_type?: string
  file_size?: number
  width?: number
  height?: number
  duration?: number
}

export function extractTelegramMedia(
  message: TelegramMessage,
): ExtractedTelegramMedia | null {
  if (message.photo?.length) {
    const largest = message.photo[message.photo.length - 1]
    return {
      kind: "photo",
      fileId: largest.file_id,
      mimeType: "image/jpeg",
      filename: "photo.jpg",
      width: largest.width,
      height: largest.height,
    }
  }

  if (message.animation) {
    return fileRefToMedia("animation", message.animation, "animation.gif")
  }

  if (message.video) {
    return fileRefToMedia("video", message.video, "video.mp4")
  }

  if (message.video_note) {
    return {
      kind: "video_note",
      fileId: message.video_note.file_id,
      mimeType: "video/mp4",
      filename: "video-note.mp4",
      duration: message.video_note.duration,
    }
  }

  if (message.voice) {
    return {
      kind: "voice",
      fileId: message.voice.file_id,
      mimeType: message.voice.mime_type ?? "audio/ogg",
      filename: "voice.ogg",
      duration: message.voice.duration,
    }
  }

  if (message.audio) {
    return fileRefToMedia(
      "audio",
      message.audio,
      message.audio.file_name ?? "audio.mp3",
    )
  }

  if (message.document) {
    return fileRefToMedia(
      "document",
      message.document,
      message.document.file_name ?? "document",
    )
  }

  return null
}

function fileRefToMedia(
  kind: TelegramMediaKind,
  file: TelegramFileRef,
  fallbackName: string,
): ExtractedTelegramMedia {
  return {
    kind,
    fileId: file.file_id,
    mimeType: file.mime_type,
    filename: file.file_name ?? fallbackName,
    width: file.width,
    height: file.height,
    duration: file.duration,
  }
}

export function getTelegramMessageBody(message: TelegramMessage): string | null {
  const text = message.text?.trim() || message.caption?.trim()
  if (text) return text

  const media = extractTelegramMedia(message)
  if (!media) return null

  switch (media.kind) {
    case "photo":
      return "📷 Fotoğraf"
    case "video":
      return "🎬 Video"
    case "video_note":
      return "🎥 Video notu"
    case "voice":
      return "🎤 Sesli mesaj"
    case "audio":
      return "🎵 Ses dosyası"
    case "animation":
      return "GIF"
    default:
      return media.filename ? `📎 ${media.filename}` : "📎 Dosya"
  }
}

/** Kant veritabanına kaydedilecek metin (medya varsa yalnızca caption). */
export function getTelegramInboundContent(message: TelegramMessage): string {
  return message.text?.trim() || message.caption?.trim() || ""
}

export function isImageMimeType(mimeType: string) {
  return mimeType.startsWith("image/")
}

export function isVideoMimeType(mimeType: string) {
  return mimeType.startsWith("video/")
}

export function isAudioMimeType(mimeType: string) {
  return (
    mimeType.startsWith("audio/") || mimeType === "application/ogg"
  )
}
