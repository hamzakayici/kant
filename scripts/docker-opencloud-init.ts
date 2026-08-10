/**
 * Docker container başlangıcında OpenCloud WebDAV yolunu keşfeder ve
 * Next.js production env dosyasına yazar.
 */
import { existsSync, readFileSync, writeFileSync } from "fs"
import { resolve } from "path"
import { bootstrapOpenCloud } from "./opencloud-bootstrap"

const envFilePath = resolve(process.cwd(), ".env.production.local")

function upsertEnvFile(lines: Record<string, string>) {
  let content = existsSync(envFilePath) ? readFileSync(envFilePath, "utf8") : ""

  for (const [key, value] of Object.entries(lines)) {
    const regex = new RegExp(`^${key}=.*$`, "m")
    const line = `${key}=${JSON.stringify(value)}`
    content = regex.test(content)
      ? content.replace(regex, line)
      : `${content}${content.endsWith("\n") || content.length === 0 ? "" : "\n"}${line}\n`
  }

  writeFileSync(envFilePath, content)
}

async function main() {
  const url = (process.env.OPENCLOUD_URL || "https://opencloud:9200").replace(/\/$/, "")
  const username = process.env.OPENCLOUD_USERNAME || "admin"
  const password =
    process.env.OPENCLOUD_PASSWORD ||
    process.env.OPENCLOUD_ADMIN_PASSWORD ||
    "zubee_opencloud_dev"
  const root = process.env.OPENCLOUD_ROOT || "Zubee"

  if (process.env.OPENCLOUD_WEBDAV_BASE) {
    console.log("OpenCloud WebDAV yolu zaten tanımlı, keşif atlanıyor.")
    return
  }

  console.log(`OpenCloud hazırlanıyor (${url})...`)
  const { webdavBase, webdavBaseEnv } = await bootstrapOpenCloud({
    url,
    username,
    password,
    root,
  })

  upsertEnvFile({
    OPENCLOUD_WEBDAV_BASE: webdavBaseEnv,
  })

  console.log(`OpenCloud hazır: ${webdavBase}`)
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
