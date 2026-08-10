export type StorageProvider = "LOCAL" | "OPENCLOUD" | "DUAL"

export function isOpenCloudEnabled(): boolean {
  return process.env.OPENCLOUD_ENABLED === "true"
}

export function isOpenCloudInsecure(): boolean {
  return process.env.OPENCLOUD_INSECURE === "true"
}

/** Next.js .env interpolates `$` in double-quoted values — store `%24` and decode here. */
function normalizeWebDavBase(path: string): string {
  return path.replace(/%24/g, "$")
}

export function getOpenCloudConfig() {
  const url = process.env.OPENCLOUD_URL?.replace(/\/$/, "")
  const username = process.env.OPENCLOUD_USERNAME
  const password = process.env.OPENCLOUD_PASSWORD
  const root = process.env.OPENCLOUD_ROOT || "Zubee"
  const webdavBase = process.env.OPENCLOUD_WEBDAV_BASE

  if (!url || !username || !password) {
    return null
  }

  const rawBasePath =
    webdavBase ||
    (process.env.OPENCLOUD_SPACE_ID
      ? `/dav/spaces/${process.env.OPENCLOUD_SPACE_ID}`
      : `/remote.php/dav/files/${encodeURIComponent(username)}`)

  const basePath = normalizeWebDavBase(
    rawBasePath.startsWith("/") ? rawBasePath : `/${rawBasePath}`,
  )

  return {
    url,
    publicUrl: getOpenCloudPublicUrl(url),
    username,
    password,
    root,
    basePath,
  }
}

/** Tarayıcıda açılacak OpenCloud adresi (Docker'da iç/dış URL ayrımı için). */
export function getOpenCloudPublicUrl(internalUrl?: string): string {
  const fallback = internalUrl || process.env.OPENCLOUD_URL?.replace(/\/$/, "") || ""
  return (process.env.OPENCLOUD_PUBLIC_URL || fallback).replace(/\/$/, "")
}

export function getStorageProvider(): StorageProvider {
  if (!isOpenCloudEnabled() || !getOpenCloudConfig()) {
    return "LOCAL"
  }

  const mode = process.env.STORAGE_MODE
  if (mode === "local") return "LOCAL"
  if (mode === "dual") return "DUAL"
  // OpenCloud etkinse varsayılan: yalnızca OpenCloud
  return "OPENCLOUD"
}

export function requireOpenCloudStorage(): void {
  if (!isOpenCloudEnabled() || !getOpenCloudConfig()) {
    throw new Error(
      "Dosya yönetimi için OpenCloud yapılandırması gerekli. OPENCLOUD_ENABLED=true ve bağlantı bilgilerini ayarlayın.",
    )
  }
}
