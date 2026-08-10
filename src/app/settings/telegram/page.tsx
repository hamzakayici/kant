import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { PageHeader } from "@/components/layout/page-header"
import TelegramLinkClient from "./TelegramLinkClient"
import TelegramAdminPanel from "./TelegramAdminPanel"
import TelegramUserMappingPanel from "./TelegramUserMappingPanel"
import { getTelegramIntegrationStatus } from "@/app/actions/telegramActions"

export default async function TelegramSettingsPage() {
  const session = await auth()
  if (!session) redirect("/login")

  const status = await getTelegramIntegrationStatus()

  return (
    <div className="min-h-screen bg-background p-6 text-foreground md:p-8">
      <PageHeader
        title="Telegram"
        description="Tüm Zubee sohbetlerinizi tek Telegram grubuyla senkronize edin"
        className="mb-8"
      />

      <div className="mx-auto flex max-w-4xl flex-col gap-6">
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
