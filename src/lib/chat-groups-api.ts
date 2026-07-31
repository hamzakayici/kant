"use client"

import type { EnrichedChatGroup } from "@/lib/chat-types"

export async function fetchChatGroups(): Promise<EnrichedChatGroup[]> {
  const response = await fetch("/api/chat/groups", {
    method: "GET",
    cache: "no-store",
  })

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      error?: string
    } | null
    throw new Error(body?.error || "Sohbet grupları alınamadı")
  }

  return response.json()
}

export async function markChatGroupReadApi(chatGroupId: string): Promise<void> {
  const response = await fetch(`/api/chat/groups/${encodeURIComponent(chatGroupId)}/read`, {
    method: "POST",
    cache: "no-store",
  })

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      error?: string
    } | null
    throw new Error(body?.error || "Okundu işaretlenemedi")
  }
}
