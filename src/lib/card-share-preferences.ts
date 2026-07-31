const LAST_SHARE_GROUP_KEY = "kant-last-share-chat-group"

function boardKey(boardId: string) {
  return `${LAST_SHARE_GROUP_KEY}:${boardId}`
}

export function getLastShareChatGroupId(boardId: string): string | null {
  if (typeof window === "undefined") return null
  return (
    localStorage.getItem(boardKey(boardId)) ??
    localStorage.getItem(LAST_SHARE_GROUP_KEY)
  )
}

export function rememberLastShareChatGroupId(
  boardId: string,
  groupId: string,
) {
  if (typeof window === "undefined") return
  localStorage.setItem(boardKey(boardId), groupId)
  localStorage.setItem(LAST_SHARE_GROUP_KEY, groupId)
}
