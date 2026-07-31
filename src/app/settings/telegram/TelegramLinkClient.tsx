"use client"

import { useState, useEffect } from "react"
import { Send, Copy, Unlink, Loader2, CheckCircle2, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  generateTelegramLinkCode,
  unlinkTelegramAccount,
  getTelegramIntegrationStatus,
  startMtprotoSenderSetup,
  completeMtprotoSenderSetup,
  cancelMtprotoSenderSetup,
} from "@/app/actions/telegramActions"

export default function TelegramLinkClient({
  initialLinked,
  initialMtprotoLinked,
  initialUsername,
  botUsername,
  telegramEnabled,
  mtprotoConfigured,
}: {
  initialLinked: boolean
  initialMtprotoLinked: boolean
  initialUsername: string | null
  botUsername: string | null
  telegramEnabled: boolean
  mtprotoConfigured: boolean
}) {
  const [linked, setLinked] = useState(initialLinked)
  const [mtprotoLinked, setMtprotoLinked] = useState(initialMtprotoLinked)
  const [username, setUsername] = useState(initialUsername)
  const [code, setCode] = useState<string | null>(null)
  const [expiresAt, setExpiresAt] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const [mtprotoStep, setMtprotoStep] = useState<"idle" | "phone" | "code" | "password">(
    "idle",
  )
  const [phone, setPhone] = useState("")
  const [smsCode, setSmsCode] = useState("")
  const [password, setPassword] = useState("")
  const [codeViaApp, setCodeViaApp] = useState(false)

  useEffect(() => {
    if (!code || linked) return

    const checkStatus = async () => {
      try {
        const status = await getTelegramIntegrationStatus()
        if (status.linked) {
          setLinked(true)
          setMtprotoLinked(Boolean(status.mtprotoLinked))
          setUsername(status.username ?? null)
          setCode(null)
          setMessage("Telegram hesabınız başarıyla bağlandı!")
        }
      } catch {
        // Sessizce devam et
      }
    }

    const intervalId = setInterval(checkStatus, 2000)
    return () => clearInterval(intervalId)
  }, [code, linked])

  const handleGenerateCode = async () => {
    setLoading(true)
    setMessage(null)
    try {
      const result = await generateTelegramLinkCode()
      setCode(result.code)
      setExpiresAt(result.expiresAt)
    } catch (e: unknown) {
      setMessage(e instanceof Error ? e.message : "Kod oluşturulamadı")
    } finally {
      setLoading(false)
    }
  }

  const handleUnlink = async () => {
    setLoading(true)
    try {
      await unlinkTelegramAccount()
      setLinked(false)
      setMtprotoLinked(false)
      setUsername(null)
      setCode(null)
      setMtprotoStep("idle")
      setMessage("Telegram hesabı bağlantısı kaldırıldı.")
    } catch (e: unknown) {
      setMessage(e instanceof Error ? e.message : "Bağlantı kaldırılamadı")
    } finally {
      setLoading(false)
    }
  }

  const handleStartMtproto = async () => {
    setLoading(true)
    setMessage(null)
    try {
      const result = await startMtprotoSenderSetup(phone)
      setCodeViaApp(result.isCodeViaApp)
      setMtprotoStep("code")
      setMessage(
        result.isCodeViaApp
          ? "Telegram uygulamanıza gelen kodu girin."
          : "SMS ile gelen kodu girin.",
      )
    } catch (e: unknown) {
      setMessage(e instanceof Error ? e.message : "Kod gönderilemedi")
    } finally {
      setLoading(false)
    }
  }

  const handleCompleteMtproto = async () => {
    setLoading(true)
    setMessage(null)
    try {
      const result = await completeMtprotoSenderSetup(
        smsCode,
        mtprotoStep === "password" ? password : undefined,
      )

      if (result.needsPassword) {
        setMtprotoStep("password")
        setMessage("İki adımlı doğrulama şifrenizi girin.")
        return
      }

      setMtprotoLinked(true)
      setMtprotoStep("idle")
      setSmsCode("")
      setPassword("")
      setMessage("Artık Kant'tan gönderdiğiniz mesajlar Telegram'da kendi adınızla görünür.")
    } catch (e: unknown) {
      setMessage(e instanceof Error ? e.message : "Doğrulama başarısız")
    } finally {
      setLoading(false)
    }
  }

  const handleCancelMtproto = async () => {
    setLoading(true)
    try {
      await cancelMtprotoSenderSetup()
      setMtprotoStep("idle")
      setSmsCode("")
      setPassword("")
    } catch {
      setMtprotoStep("idle")
    } finally {
      setLoading(false)
    }
  }

  const copyCommand = code ? `/start ${code}` : ""

  if (!telegramEnabled) {
    return (
      <div className="rounded-xl border border-border bg-muted/50 p-6">
        <p className="mb-2 text-sm font-medium">Telegram yapılandırılmamış</p>
        <p className="text-sm text-muted-foreground">
          <code className="text-xs">TELEGRAM_BOT_TOKEN</code> ve{" "}
          <code className="text-xs">TELEGRAM_BOT_USERNAME</code> değişkenlerini
          .env dosyanıza ekleyin, ardından sunucuyu yeniden başlatın.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border bg-card p-8">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10">
          <Send className="size-6 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Telegram Bağlantısı</h2>
          <p className="text-sm text-muted-foreground">
            Site sohbetlerinizi Telegram ile eşzamanlı kullanın
          </p>
        </div>
      </div>

      {linked ? (
        <div className="space-y-4">
          <div className="flex items-center gap-3 rounded-lg border border-green-500/20 bg-green-500/10 p-4">
            <CheckCircle2 className="size-5 shrink-0 text-green-400" />
            <div>
              <p className="text-sm font-medium text-green-400">
                Hesabınız bağlı
              </p>
              {username ? (
                <p className="text-sm text-muted-foreground">@{username}</p>
              ) : null}
            </div>
          </div>

          {mtprotoLinked ? (
            <div className="flex items-center gap-3 rounded-lg border border-green-500/20 bg-green-500/10 p-4">
              <User className="size-5 shrink-0 text-green-400" />
              <p className="text-sm text-green-400">
                Kant&apos;tan gönderilen mesajlar Telegram&apos;da kendi adınızla
                görünür.
              </p>
            </div>
          ) : (
            <div className="space-y-3 rounded-lg border border-amber-500/20 bg-amber-500/10 p-4 text-sm">
              <p className="font-medium text-amber-600 dark:text-amber-400">
                Kant → Telegram: kendi adınızla gönderin
              </p>
              <p className="text-muted-foreground">
                Bot API mesajları her zaman &quot;{botUsername ? `@${botUsername}` : "bot"}&quot;
                adıyla görünür. Kendi adınızla göndermek için Telegram hesabınızı
                bir kez doğrulayın.
              </p>

              {!mtprotoConfigured ? (
                <p className="text-xs text-muted-foreground">
                  Yönetici:{" "}
                  <a
                    href="https://my.telegram.org/apps"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    my.telegram.org
                  </a>
                  üzerinden API kimliği alın ve{" "}
                  <code className="text-xs">TELEGRAM_API_ID</code> /{" "}
                  <code className="text-xs">TELEGRAM_API_HASH</code> değerlerini
                  .env dosyasına ekleyip sunucuyu yeniden başlatın.
                </p>
              ) : mtprotoStep === "idle" ? (
                <Button
                  variant="secondary"
                  onClick={() => setMtprotoStep("phone")}
                  disabled={loading}
                >
                  <User className="size-4" />
                  Kendi adımla göndermeyi etkinleştir
                </Button>
              ) : mtprotoStep === "phone" ? (
                <div className="space-y-2">
                  <Input
                    type="tel"
                    placeholder="+905551234567"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <Button onClick={handleStartMtproto} disabled={loading || !phone}>
                      {loading ? <Loader2 className="size-4 animate-spin" /> : null}
                      Kod gönder
                    </Button>
                    <Button variant="outline" onClick={handleCancelMtproto} disabled={loading}>
                      İptal
                    </Button>
                  </div>
                </div>
              ) : mtprotoStep === "code" || mtprotoStep === "password" ? (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">
                    {codeViaApp
                      ? "Telegram uygulamasındaki kodu girin"
                      : "SMS kodunu girin"}
                  </p>
                  <Input
                    placeholder="12345"
                    value={smsCode}
                    onChange={(e) => setSmsCode(e.target.value)}
                    disabled={mtprotoStep === "password"}
                  />
                  {mtprotoStep === "password" ? (
                    <Input
                      type="password"
                      placeholder="2FA şifresi"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  ) : null}
                  <div className="flex gap-2">
                    <Button
                      onClick={handleCompleteMtproto}
                      disabled={loading || !smsCode.trim()}
                    >
                      {loading ? <Loader2 className="size-4 animate-spin" /> : null}
                      Doğrula
                    </Button>
                    <Button variant="outline" onClick={handleCancelMtproto} disabled={loading}>
                      İptal
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>
          )}

          <Button variant="outline" onClick={handleUnlink} disabled={loading}>
            <Unlink className="size-4" />
            Bağlantıyı Kaldır
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <ol className="list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
            <li>Aşağıdan bağlantı kodu oluşturun</li>
            <li>
              Telegram&apos;da{" "}
              {botUsername ? (
                <a
                  href={`https://t.me/${botUsername}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  @{botUsername}
                </a>
              ) : (
                "botu"
              )}{" "}
              açın
            </li>
            <li>
              Kodu bot&apos;a gönderin:{" "}
              <code className="rounded bg-muted px-1 text-xs">/start KOD</code>
            </li>
          </ol>

          <Button onClick={handleGenerateCode} disabled={loading}>
            {loading ? <Loader2 className="size-4 animate-spin" /> : null}
            Bağlantı Kodu Oluştur
          </Button>

          {code ? (
            <div className="space-y-2 rounded-lg border border-border bg-muted p-4">
              <p className="text-xs text-muted-foreground">
                Kodunuz (15 dk geçerli) — bağlandığında otomatik güncellenir:
              </p>
              <p className="font-mono text-2xl font-bold tracking-widest text-primary">
                {code}
              </p>
              {copyCommand ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigator.clipboard.writeText(copyCommand)}
                >
                  <Copy className="size-4" />
                  Komutu Kopyala
                </Button>
              ) : null}
              {expiresAt ? (
                <p className="text-xs text-muted-foreground">
                  Geçerlilik: {new Date(expiresAt).toLocaleString("tr-TR")}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      )}

      {message ? (
        <p className="mt-4 text-sm text-muted-foreground">{message}</p>
      ) : null}
    </div>
  )
}
