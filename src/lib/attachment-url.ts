/**
 * Client-safe attachment URL resolver.
 * OpenCloud URL'leri path alanında https:// olarak saklanır.
 */
export type AttachmentLike = {
  id: string
  path?: string | null
  remotePath?: string | null
}

export function isOpenCloudHttpUrl(url: string | null | undefined): boolean {
  return !!url && (url.startsWith("https://") || url.startsWith("http://"))
}

export function isOpenCloudShareUrl(url: string | null | undefined): boolean {
  return !!url && /\/s\/[A-Za-z0-9]+/.test(url)
}

/** Kant proxy veya paylaşım token linki — OpenCloud değil. */
export function isKantShareOrProxyUrl(url: string | null | undefined): boolean {
  if (!url) return false
  if (url.startsWith("/api/") || url.startsWith("/public/share/")) return true

  try {
    const parsed = new URL(url)
    const path = parsed.pathname
    return (
      path.includes("/api/s/") ||
      path.includes("/api/attachments/") ||
      path.includes("/public/share/")
    )
  } catch {
    return false
  }
}

export function isOpenCloudDirectUrl(url: string | null | undefined): boolean {
  return (
    isOpenCloudHttpUrl(url) &&
    !isKantShareOrProxyUrl(url) &&
    !isOpenCloudShareUrl(url)
  )
}

/** Uygulama içi görüntüleme/indirme — her zaman Kant proxy üzerinden. */
export function getAttachmentUrl(attachment: AttachmentLike): string {
  if (!attachment?.id) return ""

  return `/api/attachments/${attachment.id}`
}

/** Göreli veya mutlak URL'yi tam adres haline getirir (panoya kopyalama için). */
export function toAbsoluteUrl(url: string): string {
  if (!url) return ""
  if (/^https?:\/\//i.test(url)) return url
  if (typeof window !== "undefined") {
    return new URL(url, window.location.origin).href
  }
  return url
}

/** Harici paylaşım linki (OpenCloud /s/...); img src için kullanılmamalı. */
export function getAttachmentExternalUrl(attachment: AttachmentLike): string {
  if (!attachment) return ""
  if (isOpenCloudHttpUrl(attachment.path) && !isOpenCloudShareUrl(attachment.path)) {
    return attachment.path!
  }
  return getAttachmentUrl(attachment)
}

export function getBoardCoverUrl(coverImage: string | null | undefined): string | null {
  if (!coverImage) return null
  if (coverImage.startsWith("/api/attachments/")) return coverImage
  if (isOpenCloudShareUrl(coverImage)) return null
  if (isOpenCloudHttpUrl(coverImage)) return coverImage
  return coverImage
}
