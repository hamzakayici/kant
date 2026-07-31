function stripTrailingSlash(url: string) {
  return url.replace(/\/$/, "")
}

export function getAppBaseUrl() {
  return stripTrailingSlash(
    process.env.AUTH_URL ||
      process.env.NEXTAUTH_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      "",
  )
}

/** Telegram kart linkleri için — mobilde tıklanabilir HTTPS adres. */
export function getTelegramPublicAppUrl() {
  return stripTrailingSlash(
    process.env.TELEGRAM_PUBLIC_APP_URL ||
      process.env.AUTH_URL ||
      process.env.NEXTAUTH_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      "",
  )
}

export function isLocalhostHostname(hostname: string) {
  return ["localhost", "127.0.0.1", "0.0.0.0"].includes(hostname)
}

export function isClickableHttpUrl(url: string) {
  return /^https?:\/\//i.test(url)
}

export function isPublicHttpsUrl(url: string) {
  try {
    const parsed = new URL(url)
    if (parsed.protocol !== "https:") return false
    return !isLocalhostHostname(parsed.hostname)
  } catch {
    return false
  }
}

/** Telegram inline butonları localhost kabul etmez. */
export function isTelegramInlineButtonUrl(url: string) {
  try {
    const parsed = new URL(url)
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return false
    }
    return !isLocalhostHostname(parsed.hostname)
  } catch {
    return false
  }
}

export function getTelegramPublicAppUrlStatus() {
  const configured = Boolean(process.env.TELEGRAM_PUBLIC_APP_URL?.trim())
  const resolved = getTelegramPublicAppUrl()
  const mobileReady =
    configured && isPublicHttpsUrl(resolved) && isTelegramInlineButtonUrl(resolved)

  return {
    configured,
    resolved: resolved || null,
    mobileReady,
  }
}
