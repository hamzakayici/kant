"use client"

import { useEffect, useState } from "react"

export function useConnectionStatus() {
  const [online, setOnline] = useState(true)
  const [serverReachable, setServerReachable] = useState(true)

  useEffect(() => {
    const updateOnline = () => setOnline(navigator.onLine)
    updateOnline()
    window.addEventListener("online", updateOnline)
    window.addEventListener("offline", updateOnline)
    return () => {
      window.removeEventListener("online", updateOnline)
      window.removeEventListener("offline", updateOnline)
    }
  }, [])

  useEffect(() => {
    if (!online) {
      setServerReachable(false)
      return
    }

    let cancelled = false
    let intervalId: ReturnType<typeof setInterval> | undefined

    const ping = async () => {
      try {
        const response = await fetch("/api/health", {
          method: "GET",
          cache: "no-store",
        })
        if (!cancelled) setServerReachable(response.ok)
      } catch {
        if (!cancelled) setServerReachable(false)
      }
    }

    const schedule = () => {
      if (intervalId) clearInterval(intervalId)
      const intervalMs = document.hidden ? 30000 : 15000
      intervalId = setInterval(() => void ping(), intervalMs)
    }

    void ping()
    schedule()

    const onVisible = () => {
      schedule()
      if (document.visibilityState === "visible") void ping()
    }
    document.addEventListener("visibilitychange", onVisible)

    return () => {
      cancelled = true
      if (intervalId) clearInterval(intervalId)
      document.removeEventListener("visibilitychange", onVisible)
    }
  }, [online])

  return {
    online,
    serverReachable,
    isConnected: online && serverReachable,
  }
}
