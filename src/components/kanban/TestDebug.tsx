"use client"
import { useEffect } from "react"
export function TestDebug({ virtualizer, isPreviewActive }: { virtualizer: any, isPreviewActive: boolean }) {
  useEffect(() => {
    const interval = setInterval(() => {
      const payload = {
        sizes: virtualizer.getVirtualItems().map((i: any) => ({ index: i.index, size: i.size, start: i.start })),
        isPreviewActive
      };
      fetch('/api/log', { method: 'POST', body: JSON.stringify(payload) }).catch(() => {});
    }, 2000)
    return () => clearInterval(interval)
  }, [virtualizer, isPreviewActive])
  return null
}
