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
      setMessage("Artık Zubee'den gönderdiğiniz mesajlar Telegram'da kendi adınızla görünür.")
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
      <div className="rounded-xl border border-border/40 bg-muted/50 p-6 shadow-sm">
        <p className="mb-2 text-sm font-semibold tracking-wide">Telegram yapılandırılmamış</p>
        <p className="text-sm text-muted-foreground leading-relaxed">
          <code className="rounded bg-muted/80 px-1.5 py-0.5 font-mono text-[11px] text-foreground">TELEGRAM_BOT_TOKEN</code> ve{" "}
          <code className="rounded bg-muted/80 px-1.5 py-0.5 font-mono text-[11px] text-foreground">TELEGRAM_BOT_USERNAME</code> değişkenlerini
          .env dosyanıza ekleyin, ardından sunucuyu yeniden başlatın.
        </p>
      </div>
    )
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border/40 bg-card/40 p-6 shadow-lg backdrop-blur-xl transition-all dark:bg-card/20">
      {/* Decorative gradient */}
      <div className="absolute -left-20 -top-20 z-0 size-48 rounded-full bg-primary/5 blur-[80px]" />

      <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex size-12 items-center justify-center rounded-xl bg-linear-to-br from-primary/20 to-primary/5 ring-1 ring-primary/20 shadow-inner">
            <Send className="size-6 text-primary -ml-0.5 mt-0.5" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight">Kişisel Telegram Bağlantısı</h2>
            <p className="text-sm font-medium text-muted-foreground/80">
              {linked
                ? "Hesabınız başarıyla bağlandı"
                : "Bildirimleri almak için hesabınızı bağlayın"}
            </p>
          </div>
        </div>

        {linked && (
          <Button
            variant="destructive"
            size="sm"
            onClick={handleUnlink}
            disabled={loading}
            className="rounded-lg shadow-sm font-medium transition-all"
          >
            {loading ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <Unlink className="mr-2 size-4" />
            )}
            Bağlantıyı Kaldır
          </Button>
        )}
      </div>

      <div className="relative z-10 mt-8">
        {linked ? (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
              <div className="mb-4 flex items-center gap-4 sm:mb-0">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="size-5" />
                </div>
                <div>
                  <p className="font-semibold text-emerald-700 dark:text-emerald-400">
                    Telegram'a Bağlısınız
                  </p>
                  {username ? (
                    <p className="text-sm font-medium text-emerald-600/80 dark:text-emerald-400/80">
                      @{username}
                    </p>
                  ) : null}
                </div>
              </div>
              
              {!mtprotoLinked && mtprotoConfigured ? (
                <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 sm:max-w-[280px]">
                  <p className="mb-2 text-[11px] font-medium leading-relaxed text-amber-600/90 dark:text-amber-400/90">
                    Kendi adınızla mesaj gönderebilmek (MTProto) için ek doğrulama gerekli.
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full border-amber-500/30 bg-background/50 hover:bg-amber-500/10 hover:text-amber-700 dark:hover:text-amber-300 transition-all"
                    onClick={handleStartMtproto}
                    disabled={loading}
                  >
                    <User className="mr-2 size-3.5" />
                    Gönderici Olarak Yetkilendir
                  </Button>
                </div>
              ) : mtprotoLinked ? (
                <div className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 shadow-sm">
                  <Send className="size-3.5" />
                  Gönderici Yetkisi Aktif
                </div>
              ) : null}
            </div>

            {mtprotoStep !== "idle" && (
              <div className="rounded-xl border border-border/50 bg-background/50 p-6 shadow-sm backdrop-blur-sm">
                <h3 className="mb-4 text-sm font-semibold tracking-tight">Kişisel Gönderim Doğrulaması</h3>
                {mtprotoStep === "phone" ? (
                  <div className="space-y-3">
                    <p className="text-xs font-medium text-muted-foreground">Telegram'a kayıtlı telefon numaranızı girin (örn: +905551234567)</p>
                    <Input
                      type="tel"
                      placeholder="+905551234567"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="max-w-[300px] bg-background font-mono text-sm shadow-sm"
                    />
                    <div className="flex gap-2">
                      <Button onClick={handleStartMtproto} disabled={loading || !phone} size="sm" className="shadow-sm">
                        {loading ? <Loader2 className="size-4 animate-spin" /> : null}
                        Kod Gönder
                      </Button>
                      <Button variant="outline" onClick={handleCancelMtproto} disabled={loading} size="sm">
                        İptal
                      </Button>
                    </div>
                  </div>
                ) : mtprotoStep === "code" || mtprotoStep === "password" ? (
                  <div className="space-y-3">
                    <p className="text-xs font-medium text-muted-foreground">
                      {codeViaApp
                        ? "Telegram uygulamasından gelen doğrulama kodunu girin"
                        : "SMS ile gelen doğrulama kodunu girin"}
                    </p>
                    <Input
                      placeholder="Kod"
                      value={smsCode}
                      onChange={(e) => setSmsCode(e.target.value)}
                      disabled={mtprotoStep === "password"}
                      className="max-w-[300px] bg-background font-mono text-sm tracking-widest shadow-sm"
                    />
                    {mtprotoStep === "password" ? (
                      <div className="space-y-2 mt-2">
                         <p className="text-xs font-medium text-muted-foreground">İki Adımlı Doğrulama (2FA) Şifrenizi Girin</p>
                        <Input
                          type="password"
                          placeholder="Şifre"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="max-w-[300px] bg-background font-mono text-sm shadow-sm"
                        />
                      </div>
                    ) : null}
                    <div className="flex gap-2">
                      <Button
                        onClick={handleCompleteMtproto}
                        disabled={loading || !smsCode.trim()}
                        size="sm"
                        className="shadow-sm"
                      >
                        {loading ? <Loader2 className="size-4 animate-spin" /> : null}
                        Doğrula
                      </Button>
                      <Button variant="outline" onClick={handleCancelMtproto} disabled={loading} size="sm">
                        İptal
                      </Button>
                    </div>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/50 bg-muted/20 p-8 text-center shadow-sm">
            {!code ? (
              <div className="space-y-6">
                <ol className="inline-block text-left text-sm font-medium text-muted-foreground">
                  <li className="mb-3 flex items-start gap-3">
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">1</span>
                    <span className="mt-0.5">Aşağıdaki butona tıklayarak tek kullanımlık bir bağlantı kodu oluşturun.</span>
                  </li>
                  <li className="mb-3 flex items-start gap-3">
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">2</span>
                    <span className="mt-0.5">
                      Telegram'da{" "}
                      {botUsername ? (
                        <a href={`https://t.me/${botUsername}`} target="_blank" rel="noopener noreferrer" className="font-semibold text-primary hover:underline">
                          @{botUsername}
                        </a>
                      ) : (
                        "ilgili botu"
                      )}{" "}
                      açın.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">3</span>
                    <span className="mt-0.5">
                      Oluşturulan kodu bota mesaj olarak gönderin.
                    </span>
                  </li>
                </ol>

                <Button onClick={handleGenerateCode} disabled={loading} size="lg" className="rounded-xl shadow-md transition-all hover:-translate-y-0.5">
                  {loading ? <Loader2 className="mr-2 size-5 animate-spin" /> : <Send className="mr-2 size-5" />}
                  Bağlantı Kodu Oluştur
                </Button>
              </div>
            ) : (
              <div className="flex w-full max-w-sm flex-col items-center justify-center space-y-4 rounded-xl border border-border/50 bg-card p-6 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Bağlantı Kodunuz
                </p>
                <div className="rounded-lg bg-primary/5 px-6 py-3 ring-1 ring-primary/20">
                  <p className="font-mono text-3xl font-bold tracking-widest text-primary">
                    {code}
                  </p>
                </div>
                {copyCommand && (
                  <Button
                    variant="outline"
                    className="w-full border-border/50 shadow-sm transition-all hover:bg-muted"
                    onClick={() => navigator.clipboard.writeText(copyCommand)}
                  >
                    <Copy className="mr-2 size-4" />
                    Komutu Kopyala
                  </Button>
                )}
                {expiresAt && (
                  <p className="text-[10px] font-medium text-muted-foreground/80 uppercase tracking-widest">
                    Geçerlilik süresi: 15 dakika
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {message ? (
        <div className="mt-6 rounded-lg border border-primary/20 bg-primary/10 p-4 text-center">
          <p className="text-sm font-medium text-primary">{message}</p>
        </div>
      ) : null}
    </div>
  )
}

