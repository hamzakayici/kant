import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Send, Settings } from "lucide-react"

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await auth()
  if (!session) redirect("/login")

  const board = await prisma.board.findUnique({
    where: { id },
  })

  if (!board) redirect("/")

  return (
    <div className="flex min-h-screen flex-col bg-background font-sans text-foreground">
      <header className="flex items-center justify-between border-b border-border px-8 py-4">
        <div className="flex items-center gap-4">
          <Link
            href={`/b/${board.id}`}
            className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" /> Panoya Dön
          </Link>
          <div className="h-4 w-px bg-border" />
          <div className="flex items-center gap-2 text-sm font-medium">
            <span className="text-muted-foreground">{board.name}</span>
            <span className="text-muted-foreground">/</span>
            <span className="flex items-center gap-1 text-foreground">
              <Settings className="size-4" /> Ayarlar
            </span>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-auto p-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-10">
          {session.user.role === "ADMIN" ? (
            <section className="rounded-xl border border-border bg-card p-6">
              <div className="flex items-start gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                  <Send className="size-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">Telegram</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Telegram entegrasyonu artık pano bazlı değil; tüm Kant projesi için
                    merkezi olarak yönetilir.
                  </p>
                  <Link
                    href="/settings/telegram"
                    className="mt-3 inline-flex text-sm font-medium text-primary hover:underline"
                  >
                    Ayarlar → Telegram sayfasına git
                  </Link>
                </div>
              </div>
            </section>
          ) : null}
        </div>
      </main>
    </div>
  )
}
