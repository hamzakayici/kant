"use client"

import { useState } from "react"
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Search,
  Send,
  Unplug,
  Webhook,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  registerTelegramWebhook,
  clearTelegramWebhook,
  syncAllChatGroupsToTelegram,
  discoverTelegramTopics,
  ensureTelegramMembershipForLinkedUsers,
  importTelegramTopicsToKant,
} from "@/app/actions/telegramActions"

type ChatGroupStatus = {
  id: string
  name: string
  boardName: string
  boardIdentifier: string
  telegramTopicId: number | null
}

type WebhookStatus = {
  url: string | null
  pendingUpdates: number
  lastError: string | null
  isActive: boolean
} | null

type BotHealth = {
  canReadGroupMessages: boolean
  privacyModeEnabled: boolean
  webhookActive: boolean
  webhookUrl: string | null
  webhookLastError: string | null
  pendingUpdates: number
  hasAuthUrl: boolean
  publicAppUrlConfigured?: boolean
  telegramPublicAppUrl?: string | null
  warnings: string[]
} | null

type PublicAppUrlStatus = {
  configured: boolean
  resolved: string | null
  mobileReady: boolean
}

export default function TelegramAdminPanel({
  webhook,
  expectedWebhookUrl,
  supergroupConfigured,
  defaultTopicConfigured,
  publicAppUrlStatus,
  chatGroups: initialChatGroups,
  botHealth,
}: {
  webhook: WebhookStatus
  expectedWebhookUrl: string | null
  supergroupConfigured: boolean
  defaultTopicConfigured: boolean
  publicAppUrlStatus?: PublicAppUrlStatus
  chatGroups: ChatGroupStatus[]
  botHealth: BotHealth
}) {
  const [chatGroups] = useState(initialChatGroups)
  const [registering, setRegistering] = useState(false)
  const [clearing, setClearing] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [importing, setImporting] = useState(false)
  const [discoveringTopics, setDiscoveringTopics] = useState(false)
  const [discoveredTopics, setDiscoveredTopics] = useState<
    { topicId: number; preview: string }[]
  >([])
  const [ensuringMembers, setEnsuringMembers] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const syncedCount = chatGroups.filter((g) => g.telegramTopicId).length
  const canSync = supergroupConfigured

  const handleImportTopics = async () => {
    setImporting(true)
    setMessage(null)
    try {
      const result = await importTelegramTopicsToKant()
      setMessage(
        `${result.imported} konu içe aktarıldı, ${result.updated} güncellendi.${result.pruned ? ` ${result.pruned} eski grup temizlendi.` : ""}`,
      )
      window.location.reload()
    } catch (e: unknown) {
      setMessage(e instanceof Error ? e.message : "İçe aktarma başarısız")
    } finally {
      setImporting(false)
    }
  }

  const handleDiscoverTopics = async () => {
    setDiscoveringTopics(true)
    setMessage(null)
    try {
      const topics = await discoverTelegramTopics()
      setDiscoveredTopics(topics)
      if (topics.length === 0) {
        setMessage(
          "Keşfedilen konu yok. Her Telegram konusuna bir mesaj yazın ve tekrar deneyin.",
        )
      } else {
        setMessage(`${topics.length} konu bulundu.`)
      }
    } catch (e: unknown) {
      setMessage(e instanceof Error ? e.message : "Konu keşfi başarısız")
    } finally {
      setDiscoveringTopics(false)
    }
  }

  const handleEnsureMembers = async () => {
    setEnsuringMembers(true)
    setMessage(null)
    try {
      const result = await ensureTelegramMembershipForLinkedUsers()
      setMessage(`${result.count} bağlı kullanıcı tüm sohbet gruplarına eklendi.`)
    } catch (e: unknown) {
      setMessage(e instanceof Error ? e.message : "Üyelik güncellenemedi")
    } finally {
      setEnsuringMembers(false)
    }
  }

  const handleRegisterWebhook = async () => {
    setRegistering(true)
    setMessage(null)
    try {
      const result = await registerTelegramWebhook()
      setMessage(`Webhook kaydedildi: ${result.webhookUrl}`)
    } catch (e: unknown) {
      setMessage(e instanceof Error ? e.message : "Webhook kaydı başarısız")
    } finally {
      setRegistering(false)
    }
  }

  const handleClearWebhook = async () => {
    setClearing(true)
    setMessage(null)
    try {
      await clearTelegramWebhook()
      setMessage(
        "Webhook kaldırıldı. Geliştirme için: npm run telegram:poll",
      )
    } catch (e: unknown) {
      setMessage(e instanceof Error ? e.message : "Webhook kaldırılamadı")
    } finally {
      setClearing(false)
    }
  }

  const handleSyncAll = async () => {
    setSyncing(true)
    setMessage(null)
    try {
      const result = await syncAllChatGroupsToTelegram()
      setMessage(
        `${result.synced} Telegram konusu Zubee'de görünüyor (${result.imported ?? 0} yeni, ${result.updated ?? 0} güncellendi).`,
      )
    } catch (e: unknown) {
      setMessage(e instanceof Error ? e.message : "Senkronizasyon başarısız")
    } finally {
      setSyncing(false)
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
          <Send className="size-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">Zubee Telegram Ayarları</h2>
          <p className="text-sm text-muted-foreground">
            Telegram konuları Zubee&apos;de birebir görünür — kaynak Telegram&apos;dır
          </p>
        </div>
      </div>

      <div className="mb-6 rounded-lg border border-blue-500/20 bg-blue-500/5 p-4 text-sm text-muted-foreground">
        <p className="font-medium text-foreground">Yapılandırma (.env)</p>
        <ul className="mt-2 list-inside list-disc space-y-1 text-xs">
          <li>
            Süper grup:{" "}
            {supergroupConfigured ? (
              <span className="text-green-500">tanımlı</span>
            ) : (
              <span className="text-destructive">TELEGRAM_SUPERGROUP_ID eksik</span>
            )}
          </li>
          <li>
            Varsayılan sohbet:{" "}
            {defaultTopicConfigured ? (
              <span className="text-green-500">TELEGRAM_DEFAULT_TOPIC_ID tanımlı</span>
            ) : (
              <span className="text-amber-500">TELEGRAM_DEFAULT_TOPIC_ID eksik</span>
            )}
          </li>
          <li>
            Mobil kart linkleri:{" "}
            {publicAppUrlStatus?.mobileReady ? (
              <span className="text-green-500">TELEGRAM_PUBLIC_APP_URL hazır</span>
            ) : publicAppUrlStatus?.configured ? (
              <span className="text-amber-500">
                TELEGRAM_PUBLIC_APP_URL geçersiz (HTTPS gerekli)
              </span>
            ) : (
              <span className="text-amber-500">TELEGRAM_PUBLIC_APP_URL eksik</span>
            )}
          </li>
          {publicAppUrlStatus?.resolved ? (
            <li className="break-all font-mono text-[11px] text-muted-foreground">
              {publicAppUrlStatus.resolved}
            </li>
          ) : null}
          <li>Zubee&apos;deki liste = Telegram forum konuları</li>
          <li>Geliştirmede <code className="rounded bg-muted px-1">npm run telegram:poll</code> çalışmalı</li>
        </ul>
      </div>

      {botHealth?.warnings && botHealth.warnings.length > 0 ? (
        <div className="mb-6 space-y-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-amber-500">
            <AlertTriangle className="size-4" />
            Yapılandırma uyarıları
          </div>
          <ul className="space-y-1.5 text-xs text-muted-foreground">
            {botHealth.warnings.map((warning) => (
              <li key={warning}>• {warning}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="mb-6 space-y-3 rounded-lg border border-border/60 bg-muted/20 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-sm font-medium">Bot durumu</span>
          {botHealth?.privacyModeEnabled ? (
            <Badge variant="destructive">Gizlilik modu açık</Badge>
          ) : (
            <Badge className="bg-green-500/15 text-green-400 hover:bg-green-500/15">
              Grup mesajları okunabilir
            </Badge>
          )}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-sm font-medium">Webhook durumu</span>
          {webhook?.isActive ? (
            <Badge className="bg-green-500/15 text-green-400 hover:bg-green-500/15">
              Aktif
            </Badge>
          ) : (
            <Badge variant="secondary">Kayıtlı değil — polling kullanın</Badge>
          )}
        </div>
        {webhook?.url ? (
          <p className="break-all font-mono text-xs text-muted-foreground">
            {webhook.url}
          </p>
        ) : expectedWebhookUrl ? (
          <p className="text-xs text-muted-foreground">
            Beklenen URL:{" "}
            <span className="font-mono">{expectedWebhookUrl}</span>
          </p>
        ) : null}
        {webhook?.lastError ? (
          <p className="text-xs text-destructive">{webhook.lastError}</p>
        ) : null}
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        <Button
          variant="outline"
          onClick={handleImportTopics}
          disabled={importing || !canSync}
        >
          {importing ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <RefreshCw className="size-4" />
          )}
          Telegram&apos;dan İçe Aktar
        </Button>
        <Button
          variant="outline"
          onClick={handleSyncAll}
          disabled={syncing || !canSync}
        >
          {syncing ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <RefreshCw className="size-4" />
          )}
          Senkronize Et
        </Button>
        <Button onClick={handleRegisterWebhook} disabled={registering}>
          {registering ? <Loader2 className="size-4 animate-spin" /> : <Webhook className="size-4" />}
          Webhook Kaydet
        </Button>
        <Button
          variant="outline"
          onClick={handleClearWebhook}
          disabled={clearing}
        >
          {clearing ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Unplug className="size-4" />
          )}
          Webhook Kaldır
        </Button>
      </div>

      {chatGroups.length > 0 ? (
        <div className="border-t border-border pt-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold">Telegram Konuları</h3>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">
                {syncedCount}/{chatGroups.length} eşli
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDiscoverTopics}
                disabled={discoveringTopics || !canSync}
              >
                {discoveringTopics ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Search className="size-4" />
                )}
                Konuları Keşfet
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleEnsureMembers}
                disabled={ensuringMembers}
              >
                {ensuringMembers ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : null}
                Üyelikleri Güncelle
              </Button>
            </div>
          </div>

          {discoveredTopics.length > 0 ? (
            <div className="mb-3 rounded-lg border border-border/60 bg-muted/20 p-3 text-xs">
              <p className="mb-2 font-medium">Keşfedilen konular</p>
              <div className="space-y-1">
                {discoveredTopics.map((topic) => (
                  <p key={topic.topicId} className="font-mono text-muted-foreground">
                    #{topic.topicId}
                    {topic.preview ? ` — ${topic.preview}` : ""}
                  </p>
                ))}
              </div>
            </div>
          ) : null}

          <div className="space-y-2">
            {chatGroups.map((group) => (
              <div
                key={group.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-muted/40 px-3 py-2.5 text-sm"
              >
                <div className="min-w-0">
                  <p className="font-medium">{group.name}</p>
                </div>
                {group.telegramTopicId ? (
                  <span className="flex items-center gap-1 text-xs text-green-500">
                    <CheckCircle2 className="size-3.5" />
                    Bağlı
                  </span>
                ) : (
                  <span className="text-xs text-amber-500">Eşlenmedi</span>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <p className="mt-4 text-xs text-muted-foreground">
        Geliştirme ortamında webhook yerine{" "}
        <code className="rounded bg-muted px-1">npm run telegram:poll</code>{" "}
        komutunu ayrı bir terminalde çalıştırın. Kurulum kontrolü için{" "}
        <code className="rounded bg-muted px-1">npm run telegram:setup</code>.
      </p>

      {message ? (
        <p className="mt-4 text-sm text-muted-foreground">{message}</p>
      ) : null}
    </div>
  )
}
