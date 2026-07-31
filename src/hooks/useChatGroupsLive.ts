"use client"

import { useEffect, useRef, useState } from "react"
import { CHAT_GROUPS_POLL_MS, getVisibilityAwarePollMs } from "@/lib/chat-live"
import type { EnrichedChatGroup } from "@/lib/chat-types"
import { fetchChatGroups, markChatGroupReadApi } from "@/lib/chat-groups-api"
import { recoverFromStaleServerAction } from "@/lib/server-action-error"

const EMPTY_GROUPS: EnrichedChatGroup[] = []

function getGroupsSignature(groups: EnrichedChatGroup[] | undefined) {
  if (!groups?.length) return ""
  return groups.map((group) => group.id).join(",")
}

export function useChatGroupsLive(initialGroups?: EnrichedChatGroup[]) {
  const [chatGroups, setChatGroups] = useState<EnrichedChatGroup[]>(
    () => initialGroups ?? EMPTY_GROUPS,
  )
  const syncedSignatureRef = useRef(getGroupsSignature(initialGroups))

  useEffect(() => {
    const nextSignature = getGroupsSignature(initialGroups)
    if (!nextSignature || nextSignature === syncedSignatureRef.current) return

    syncedSignatureRef.current = nextSignature
    setChatGroups(initialGroups ?? EMPTY_GROUPS)
  }, [initialGroups])

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval> | undefined
    let cancelled = false

    const refreshGroups = async () => {
      try {
        const groups = await fetchChatGroups()
        if (cancelled) return
        setChatGroups(groups)
      } catch (error) {
        if (recoverFromStaleServerAction(error)) return
        console.error(error)
      }
    }

    const schedulePolling = () => {
      if (intervalId) clearInterval(intervalId)
      const intervalMs = getVisibilityAwarePollMs(CHAT_GROUPS_POLL_MS)
      intervalId = setInterval(() => void refreshGroups(), intervalMs)
    }

    void refreshGroups()
    schedulePolling()

    const onVisible = () => {
      schedulePolling()
      if (document.visibilityState === "visible") void refreshGroups()
    }
    document.addEventListener("visibilitychange", onVisible)

    return () => {
      cancelled = true
      if (intervalId) clearInterval(intervalId)
      document.removeEventListener("visibilitychange", onVisible)
    }
  }, [])

  return { chatGroups, setChatGroups }
}

export function useMarkChatGroupRead(
  chatGroupId: string | null | undefined,
  enabled = true,
  activityKey?: number | string,
) {
  useEffect(() => {
    if (!enabled || !chatGroupId) return

    void markChatGroupReadApi(chatGroupId).catch((error) => {
      if (recoverFromStaleServerAction(error)) return
      console.error(error)
    })
  }, [chatGroupId, enabled, activityKey])
}
