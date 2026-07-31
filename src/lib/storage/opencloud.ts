import { getOpenCloudConfig, isOpenCloudInsecure } from "./config"
import { joinDavPath } from "./paths"
import { Agent, fetch as undiciFetch } from "undici"

function getAuthHeader(username: string, password: string): string {
  return `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`
}

const insecureDispatcher = new Agent({
  connect: { rejectUnauthorized: false },
})

async function openCloudFetch(
  url: string,
  init?: RequestInit,
): Promise<Response> {
  if (isOpenCloudInsecure() && url.startsWith("https://")) {
    return undiciFetch(url, {
      ...init,
      dispatcher: insecureDispatcher,
    } as Parameters<typeof undiciFetch>[1]) as unknown as Response
  }

  return fetch(url, init)
}

export function buildDavUrl(relativePath: string): string {
  const config = getOpenCloudConfig()
  if (!config) {
    throw new Error("OpenCloud yapılandırması eksik")
  }

  const encodedSegments = relativePath
    .split("/")
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))

  return `${config.url}${config.basePath}/${encodedSegments.join("/")}`
}

async function davRequest(
  relativePath: string,
  init: RequestInit & { method: string }
): Promise<Response> {
  const config = getOpenCloudConfig()
  if (!config) {
    throw new Error("OpenCloud yapılandırması eksik")
  }

  const url = buildDavUrl(relativePath)
  const headers = new Headers(init.headers)
  headers.set("Authorization", getAuthHeader(config.username, config.password))

  return openCloudFetch(url, {
    ...init,
    headers,
  })
}

export async function ensureOpenCloudDirectory(relativePath: string): Promise<void> {
  const segments = relativePath.split("/").filter(Boolean)
  let current = ""

  for (const segment of segments) {
    current = joinDavPath(current, segment)
    const response = await davRequest(current, {
      method: "MKCOL",
    })

    if (![201, 405, 409].includes(response.status)) {
      const body = await response.text().catch(() => "")
      throw new Error(`OpenCloud klasör oluşturulamadı (${response.status}): ${body}`)
    }
  }
}

export async function uploadToOpenCloud(
  relativePath: string,
  content: Buffer,
  mimeType: string
): Promise<void> {
  const directory = relativePath.split("/").slice(0, -1).join("/")
  if (directory) {
    await ensureOpenCloudDirectory(directory)
  }

  const response = await davRequest(relativePath, {
    method: "PUT",
    headers: {
      "Content-Type": mimeType || "application/octet-stream",
    },
    body: new Uint8Array(content),
  })

  if (![200, 201, 204].includes(response.status)) {
    const body = await response.text().catch(() => "")
    throw new Error(`OpenCloud yükleme başarısız (${response.status}): ${body}`)
  }
}

export async function downloadFromOpenCloud(relativePath: string): Promise<Buffer> {
  const response = await davRequest(relativePath, {
    method: "GET",
  })

  if (!response.ok) {
    const body = await response.text().catch(() => "")
    throw new Error(`OpenCloud indirme başarısız (${response.status}): ${body}`)
  }

  const arrayBuffer = await response.arrayBuffer()
  return Buffer.from(arrayBuffer)
}

export async function deleteFromOpenCloud(relativePath: string): Promise<void> {
  const response = await davRequest(relativePath, {
    method: "DELETE",
  })

  if (![200, 204, 404].includes(response.status)) {
    const body = await response.text().catch(() => "")
    throw new Error(`OpenCloud silme başarısız (${response.status}): ${body}`)
  }
}

export async function initializeOpenCloudRoot(): Promise<void> {
  const config = getOpenCloudConfig()
  if (!config) return

  await ensureOpenCloudDirectory(config.root)
  await ensureOpenCloudDirectory(joinDavPath(config.root, "boards"))
}

function parseOcsUrl(xml: string): string | null {
  const urlMatch = xml.match(/<url>([^<]+)<\/url>/)
  if (urlMatch?.[1]) {
    return urlMatch[1].replace(/&amp;/g, "&")
  }
  return null
}

/**
 * OpenCloud üzerinde herkese açık paylaşım linki oluşturur.
 * ownCloud/OpenCloud OCS Sharing API kullanır.
 */
export async function createOpenCloudPublicShare(
  remotePath: string,
): Promise<string | null> {
  const config = getOpenCloudConfig()
  if (!config) return null

  if (process.env.OPENCLOUD_PUBLIC_SHARES === "false") {
    return null
  }

  const sharePath = `/${remotePath}`
  const ocsUrl = `${config.url}/ocs/v1.php/apps/files_sharing/api/v1/shares`

  try {
    const response = await openCloudFetch(ocsUrl, {
      method: "POST",
      headers: {
        Authorization: getAuthHeader(config.username, config.password),
        "OCS-APIRequest": "true",
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        shareType: "3",
        path: sharePath,
        permissions: "1",
      }),
    })

    const body = await response.text()
    if (!response.ok) {
      console.error("OpenCloud share failed:", response.status, body)
      return null
    }

    return parseOcsUrl(body)
  } catch (error) {
    console.error("OpenCloud share error:", error)
    return null
  }
}

export async function getOrCreateOpenCloudPublicShare(
  remotePath: string,
): Promise<string | null> {
  const config = getOpenCloudConfig()
  if (!config) return null

  if (process.env.OPENCLOUD_PUBLIC_SHARES === "false") {
    return null
  }

  const sharePath = `/${remotePath}`
  const ocsUrl = `${config.url}/ocs/v1.php/apps/files_sharing/api/v1/shares?path=${encodeURIComponent(sharePath)}&reshares=true`

  try {
    const listResponse = await openCloudFetch(ocsUrl, {
      headers: {
        Authorization: getAuthHeader(config.username, config.password),
        "OCS-APIRequest": "true",
      },
    })

    if (listResponse.ok) {
      const listBody = await listResponse.text()
      const existingUrl = parseOcsUrl(listBody)
      if (existingUrl) return existingUrl
    }
  } catch {
    // Yeni paylaşım oluştur
  }

  return createOpenCloudPublicShare(remotePath)
}
