export function sanitizeSegment(value: string, fallback = "item"): string {
  const cleaned = value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80)

  return cleaned || fallback
}

export function getBoardFolderName(identifier: string, name: string): string {
  return `${sanitizeSegment(identifier, "board")}-${sanitizeSegment(name, "board")}`
}

export function getCardFolderName(sequenceId: number, title: string): string {
  return `${sequenceId}-${sanitizeSegment(title, "card")}`
}

export function getChatFolderName(name: string): string {
  return sanitizeSegment(name, "chat")
}

export function buildBoardRootPath(root: string, identifier: string, name: string): string {
  return `${root}/boards/${getBoardFolderName(identifier, name)}`
}

export function buildCardPath(boardRoot: string, sequenceId: number, title: string, filename: string): string {
  const uniqueName = `${Date.now()}-${sanitizeSegment(filename, "file")}`
  return `${boardRoot}/cards/${getCardFolderName(sequenceId, title)}/${uniqueName}`
}

export function buildBoardCoverPath(boardRoot: string, filename: string): string {
  const uniqueName = `${Date.now()}-${sanitizeSegment(filename, "file")}`
  return `${boardRoot}/covers/${uniqueName}`
}

export function buildChatPath(boardRoot: string, groupName: string, filename: string): string {
  const uniqueName = `${Date.now()}-${sanitizeSegment(filename, "file")}`
  return `${boardRoot}/chat/${getChatFolderName(groupName)}/${uniqueName}`
}

export function joinDavPath(...segments: string[]): string {
  return segments
    .map((segment) => segment.replace(/^\/+|\/+$/g, ""))
    .filter(Boolean)
    .join("/")
}
