/**
 * Yerel OpenCloud kurulumunu doğrular ve .env değerlerini yazdırır.
 * Kullanım: npm run opencloud:setup
 */
import { readFileSync, writeFileSync, existsSync } from "fs"
import { resolve } from "path"
import { bootstrapOpenCloud } from "./opencloud-bootstrap"

const OPENCLOUD_URL = (process.env.OPENCLOUD_URL || "https://localhost:9200").replace(
  /\/$/,
  "",
)
const USERNAME = process.env.OPENCLOUD_USERNAME || "admin"
const PASSWORD =
  process.env.OPENCLOUD_PASSWORD ||
  process.env.OPENCLOUD_ADMIN_PASSWORD ||
  "zubee_opencloud_dev"
const ROOT = process.env.OPENCLOUD_ROOT || "Zubee"

function upsertEnv(lines: Record<string, string>) {
  const envPath = resolve(process.cwd(), ".env")
  let content = existsSync(envPath) ? readFileSync(envPath, "utf8") : ""

  for (const [key, value] of Object.entries(lines)) {
    const regex = new RegExp(`^${key}=.*$`, "m")
    const line = `${key}="${value}"`
    if (regex.test(content)) {
      content = content.replace(regex, line)
    } else {
      content += content.endsWith("\n") || content.length === 0 ? "" : "\n"
      content += `${line}\n`
    }
  }

  writeFileSync(envPath, content)
  console.log(`✓ .env güncellendi (${envPath})`)
}

async function main() {
  console.log("OpenCloud kurulum doğrulaması...")
  console.log(`URL: ${OPENCLOUD_URL}`)
  console.log(`Kullanıcı: ${USERNAME}`)

  const { webdavBase, webdavBaseEnv } = await bootstrapOpenCloud({
    url: OPENCLOUD_URL,
    username: USERNAME,
    password: PASSWORD,
    root: ROOT,
  })

  console.log("✓ OpenCloud hazır")
  console.log(`✓ Space / WebDAV: ${webdavBase}`)
  console.log(`✓ WebDAV yazma testi başarılı`)

  upsertEnv({
    OPENCLOUD_ENABLED: "true",
    OPENCLOUD_URL: OPENCLOUD_URL,
    OPENCLOUD_USERNAME: USERNAME,
    OPENCLOUD_PASSWORD: PASSWORD,
    OPENCLOUD_ROOT: ROOT,
    OPENCLOUD_WEBDAV_BASE: webdavBaseEnv,
    STORAGE_MODE: "opencloud",
    OPENCLOUD_PUBLIC_SHARES: "true",
    OPENCLOUD_INSECURE: OPENCLOUD_URL.startsWith("https://") ? "true" : "false",
  })

  console.log("\nKurulum tamamlandı!")
  console.log("Sonraki adımlar:")
  console.log("  1. Dev sunucusunu yeniden başlatın (npm run dev)")
  console.log("  2. Mevcut dosyalar için: npm run opencloud:sync")
  console.log(`\nOpenCloud arayüzü: ${OPENCLOUD_URL}`)
  if (OPENCLOUD_URL.startsWith("https://")) {
    console.log(
      "  ⚠️  http:// kullanmayın — tarayıcıda https:// ile açın (self-signed sertifikayı kabul edin)",
    )
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
