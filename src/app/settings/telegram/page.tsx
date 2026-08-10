import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { Send } from "lucide-react"
import TelegramLinkClient from "./TelegramLinkClient"
import TelegramAdminPanel from "./TelegramAdminPanel"
import TelegramUserMappingPanel from "./TelegramUserMappingPanel"
import { getTelegramIntegrationStatus } from "@/app/actions/telegramActions"

export default async function TelegramSettingsPage() {
  const session = await auth()
  if (!session) redirect("/login")

  const status = await getTelegramIntegrationStatus()
  
  // Sadece süper admin görebilir
  if (!status.isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-8 text-foreground">
        Bu sayfayı görüntüleme yetkiniz yok. (Sadece Süper Admin)
      </div>
    )
  }
  return (
    <div className="h-full overflow-y-auto bg-background/50 text-foreground">
      {/* Premium Hero Section */}
      <div className="relative overflow-hidden border-b border-border/40 bg-card/30 px-6 py-12 backdrop-blur-xl md:px-8 lg:py-16">
        <div className="absolute inset-0 z-0">
          <div className="absolute -left-20 -top-20 size-64 rounded-full bg-blue-500/10 blur-[100px]" />
          <div className="absolute right-0 top-10 size-64 rounded-full bg-indigo-500/10 blur-[100px]" />
        </div>
        
        <div className="relative z-10 mx-auto max-w-4xl">
          <div className="mb-4 inline-flex size-14 items-center justify-center rounded-2xl bg-linear-to-br from-blue-500/20 to-blue-500/5 ring-1 ring-blue-500/20 shadow-lg shadow-blue-500/10">
            <Send className="size-7 text-blue-500 -ml-1 mt-1" />
          </div>
          <h1 className="mb-2 text-3xl font-bold tracking-tight md:text-4xl">
            Telegram Entegrasyonu
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Tüm Zubee sohbetlerinizi tek bir Telegram grubuyla senkronize edin. Bildirimleri yönetin ve dışarıdan kopmadan ekibinizle bağlantıda kalın.
          </p>
        </div>
      </div>

      <div className="mx-auto flex max-w-4xl flex-col gap-8 p-6 md:p-8">
        <TelegramLinkClient
          initialLinked={status.linked}
          initialMtprotoLinked={status.mtprotoLinked}
          initialUsername={status.username ?? null}
          botUsername={status.botUsername ?? null}
          telegramEnabled={status.enabled}
          mtprotoConfigured={status.mtprotoConfigured}
        />

        {status.isAdmin && status.enabled ? (
          <TelegramUserMappingPanel
            users={status.userMappings}
            botUsername={status.botUsername ?? null}
          />
        ) : null}

        {status.isAdmin && status.enabled ? (
          <TelegramAdminPanel
            webhook={status.webhook}
            expectedWebhookUrl={status.expectedWebhookUrl}
            supergroupConfigured={status.supergroupConfigured}
            defaultTopicConfigured={status.defaultTopicConfigured}
            publicAppUrlStatus={status.publicAppUrlStatus}
            chatGroups={status.chatGroups}
            botHealth={status.botHealth}
          />
        ) : null}
      </div>
    </div>
  )
}
