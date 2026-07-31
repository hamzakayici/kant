"use client"

import { WifiOff } from "lucide-react"
import { useConnectionStatus } from "@/hooks/useConnectionStatus"

export function ConnectionStatusBanner() {
  const { online, serverReachable, isConnected } = useConnectionStatus()

  if (isConnected) return null

  const message = !online
    ? "İnternet bağlantısı yok — mesajlar gönderilemeyebilir."
    : !serverReachable
      ? "Sunucuya ulaşılamıyor — bağlantı yeniden kurulmaya çalışılıyor."
      : "Bağlantı sorunu"

  return (
    <div
      role="status"
      className="flex shrink-0 items-center justify-center gap-2 border-b border-amber-500/30 bg-amber-500/10 px-4 py-2 text-center text-xs font-medium text-amber-600 dark:text-amber-400"
    >
      <WifiOff className="size-3.5 shrink-0" />
      <span>{message}</span>
    </div>
  )
}
