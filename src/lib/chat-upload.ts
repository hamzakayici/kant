export type PendingChatAttachment = {
  id: string
  filename: string
  mimeType: string
}

export function getVoiceRecordingMimeType(): string {
  const candidates = [
    "audio/ogg; codecs=opus",
    "audio/webm; codecs=opus",
    "audio/webm",
    "audio/mp4",
  ]

  for (const type of candidates) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(type)) {
      return type
    }
  }

  return "audio/webm"
}

export function voiceFilenameForMime(mimeType: string): string {
  return mimeType.includes("ogg") ? "voice.ogg" : "voice.webm"
}

async function appendImageDimensions(formData: FormData, file: File) {
  if (!file.type.startsWith("image/")) return

  const dimensions = await new Promise<{ width: number; height: number }>(
    (resolve) => {
      const img = new Image()
      img.onload = () =>
        resolve({ width: img.naturalWidth, height: img.naturalHeight })
      img.onerror = () => resolve({ width: 0, height: 0 })
      img.src = URL.createObjectURL(file)
    },
  )

  if (dimensions.width > 0) {
    formData.append("width", String(dimensions.width))
    formData.append("height", String(dimensions.height))
  }
}

export async function uploadChatAttachment(
  file: File,
  chatGroupId: string,
): Promise<PendingChatAttachment> {
  const formData = new FormData()
  formData.append("file", file)
  formData.append("chatGroupId", chatGroupId)
  await appendImageDimensions(formData, file)

  const res = await fetch("/api/upload", { method: "POST", body: formData })
  if (!res.ok) {
    const data = await res.json().catch(() => null)
    throw new Error(
      data && typeof data.error === "string" ? data.error : "Dosya yüklenemedi",
    )
  }

  const data = await res.json()
  return {
    id: data.attachment.id,
    filename: data.attachment.filename,
    mimeType: data.attachment.mimeType,
  }
}

export function extractFilesFromClipboard(
  clipboardData: DataTransfer | null,
): File[] {
  if (!clipboardData) return []

  const files: File[] = []
  for (const item of Array.from(clipboardData.items)) {
    if (item.kind === "file") {
      const file = item.getAsFile()
      if (file) files.push(file)
    }
  }
  return files
}
