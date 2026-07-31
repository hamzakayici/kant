import { getOpenCloudConfig } from "./config"

export function buildOpenCloudDavUrl(remotePath: string): string {
  const config = getOpenCloudConfig()
  if (!config) {
    throw new Error("OpenCloud yapılandırması eksik")
  }

  const encodedSegments = remotePath
    .split("/")
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))

  return `${config.publicUrl}${config.basePath}/${encodedSegments.join("/")}`
}

export function buildOpenCloudFilesAppUrl(remotePath: string): string {
  const config = getOpenCloudConfig()
  if (!config) {
    throw new Error("OpenCloud yapılandırması eksik")
  }

  const dirPath = remotePath.split("/").slice(0, -1).join("/")
  const fileName = remotePath.split("/").pop() || ""

  const params = new URLSearchParams({
    dir: `/${dirPath}`,
    openfile: fileName,
  })

  return `${config.publicUrl}/index.php/apps/files/?${params.toString()}`
}

/**
 * Tarayıcıda kullanılacak OpenCloud dosya URL'si.
 * OPENCLOUD_LINK_MODE=files → Files uygulaması linki
 * OPENCLOUD_LINK_MODE=dav (varsayılan) → WebDAV doğrudan link
 */
export function buildOpenCloudFileUrl(remotePath: string): string {
  const linkMode = process.env.OPENCLOUD_LINK_MODE || "dav"

  if (linkMode === "files") {
    return buildOpenCloudFilesAppUrl(remotePath)
  }

  return buildOpenCloudDavUrl(remotePath)
}

export function resolveRemotePath(attachment: {
  path: string
  remotePath?: string | null
}): string | null {
  if (attachment.remotePath) return attachment.remotePath

  if (attachment.path.startsWith("opencloud://")) {
    return attachment.path.replace("opencloud://", "")
  }

  return null
}
