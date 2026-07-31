import { Agent, fetch as undiciFetch } from "undici"

export type OpenCloudBootstrapConfig = {
  url: string
  username: string
  password: string
  root: string
}

function authHeader(username: string, password: string): string {
  return `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`
}

export function openCloudFetch(
  url: string,
  username: string,
  password: string,
  init?: RequestInit,
): Promise<Response> {
  const headers = new Headers(init?.headers)
  headers.set("Authorization", authHeader(username, password))

  if (url.startsWith("https://")) {
    return undiciFetch(url, {
      ...init,
      headers,
      dispatcher: new Agent({ connect: { rejectUnauthorized: false } }),
    } as Parameters<typeof undiciFetch>[1]) as unknown as Promise<Response>
  }

  return fetch(url, { ...init, headers })
}

export async function waitForOpenCloud(
  config: OpenCloudBootstrapConfig,
  maxAttempts = 30,
): Promise<void> {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const res = await openCloudFetch(
        `${config.url}/status.php`,
        config.username,
        config.password,
        { signal: AbortSignal.timeout(3000) },
      )
      if (res.ok) return
    } catch {
      // henüz hazır değil
    }
    await new Promise((resolve) => setTimeout(resolve, 2000))
  }

  throw new Error("OpenCloud yanıt vermiyor.")
}

export async function discoverSpaceId(
  config: OpenCloudBootstrapConfig,
): Promise<string> {
  const endpoints = [
    `${config.url}/graph/v1.0/me/drives`,
    `${config.url}/ocs/v1.php/cloud/capabilities`,
  ]

  for (const url of endpoints) {
    try {
      const res = await openCloudFetch(url, config.username, config.password, {
        headers: { "OCS-APIRequest": "true" },
        signal: AbortSignal.timeout(10000),
      })

      if (!res.ok) continue

      const contentType = res.headers.get("content-type") || ""
      if (!contentType.includes("application/json")) continue

      const data = await res.json()
      const drives = data.value || data.drives
      if (!Array.isArray(drives) || drives.length === 0) continue

      const personal =
        drives.find((drive: { driveType?: string }) => drive.driveType === "personal") ||
        drives[0]
      if (personal?.id) {
        return personal.id as string
      }
    } catch {
      // sonraki endpoint
    }
  }

  const propfindBody = `<?xml version="1.0" encoding="UTF-8"?>
<d:propfind xmlns:d="DAV:">
  <d:prop><d:resourcetype/></d:prop>
</d:propfind>`

  const res = await openCloudFetch(
    `${config.url}/dav/spaces/`,
    config.username,
    config.password,
    {
      method: "PROPFIND",
      headers: {
        Depth: "1",
        "Content-Type": "application/xml",
      },
      body: propfindBody,
      signal: AbortSignal.timeout(10000),
    },
  )

  if (!res.ok) {
    throw new Error(`Space keşfi başarısız (${res.status})`)
  }

  const xml = await res.text()
  const match = xml.match(/storage-users[^<"'\s]+/)
  if (match) {
    return decodeURIComponent(match[0])
  }

  const hrefMatch = xml.match(/<d:href>([^<]+)<\/d:href>/g)
  if (hrefMatch && hrefMatch.length > 1) {
    const href = hrefMatch[1].replace(/<\/?d:href>/g, "")
    const parts = href.split("/").filter(Boolean)
    const spacePart = parts.find((part) => part.includes("storage-users"))
    if (spacePart) return decodeURIComponent(spacePart)
  }

  throw new Error("Space ID bulunamadı.")
}

export function encodeWebDavBaseForEnv(webdavBase: string): string {
  return webdavBase.replace(/\$/g, "%24")
}

export async function ensureOpenCloudRoot(
  config: OpenCloudBootstrapConfig,
  webdavBase: string,
): Promise<void> {
  const testPath = `${webdavBase}/${encodeURIComponent(config.root)}`
  const res = await openCloudFetch(
    `${config.url}${testPath}`,
    config.username,
    config.password,
    {
      method: "MKCOL",
      signal: AbortSignal.timeout(10000),
    },
  )

  if (![201, 405, 409].includes(res.status)) {
    const body = await res.text().catch(() => "")
    throw new Error(`WebDAV testi başarısız (${res.status}): ${body.slice(0, 200)}`)
  }
}

export async function bootstrapOpenCloud(
  config: OpenCloudBootstrapConfig,
): Promise<{ webdavBase: string; webdavBaseEnv: string }> {
  await waitForOpenCloud(config)
  const spaceId = await discoverSpaceId(config)
  const webdavBase = `/dav/spaces/${spaceId}`
  await ensureOpenCloudRoot(config, webdavBase)

  return {
    webdavBase,
    webdavBaseEnv: encodeWebDavBaseForEnv(webdavBase),
  }
}
