export const CHAT_LIVE_POLL_MS = 800
export const CHAT_GROUPS_POLL_MS = 2000
export const CHAT_HIDDEN_POLL_MULTIPLIER = 3

export const KANT_OPEN_MINI_CHAT_EVENT = "kant:open-mini-chat"
export const KANT_OPEN_MINI_CHAT_KEY = "kant-open-mini-chat"

export function getVisibilityAwarePollMs(baseMs: number) {
  if (typeof document === "undefined") return baseMs
  return document.hidden ? baseMs * CHAT_HIDDEN_POLL_MULTIPLIER : baseMs
}

export function shouldReplaceChatMessages<T extends { id?: string }>(
  prev: T[],
  next: T[],
): boolean {
  if (prev.length !== next.length) return true
  const prevLast = prev[prev.length - 1]?.id
  const nextLast = next[next.length - 1]?.id
  return prevLast !== nextLast
}
