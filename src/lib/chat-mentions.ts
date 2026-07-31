import type { UserNameFields } from "@/lib/user"
import { getUserDisplayName } from "@/lib/user"

/** Stored token: @[Display Name](user:userId) */
export const MENTION_TOKEN_REGEX =
  /@\[([^\]]+)\]\(user:([a-f0-9-]{36})\)/gi

export type MentionMember = UserNameFields & { id: string }

export function buildMentionToken(user: MentionMember) {
  const label = getUserDisplayName(user)
  return `@[${label}](user:${user.id})`
}

export function extractMentionedUserIds(content: string): string[] {
  const ids = new Set<string>()
  for (const match of content.matchAll(MENTION_TOKEN_REGEX)) {
    if (match[2]) ids.add(match[2])
  }
  return [...ids]
}

export function stripMentionTokens(content: string): string {
  return content.replace(MENTION_TOKEN_REGEX, (_, label: string) => `@${label}`)
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

/** Composer'daki @İsim ifadelerini kayıt formatına çevirir. */
export function normalizeMentionsInContent(
  content: string,
  members: MentionMember[],
): { content: string; mentionedUserIds: string[] } {
  const mentionedUserIds = new Set(extractMentionedUserIds(content))
  let result = content

  const sortedMembers = [...members].sort(
    (a, b) => getUserDisplayName(b).length - getUserDisplayName(a).length,
  )

  for (const member of sortedMembers) {
    const label = getUserDisplayName(member)
    const token = buildMentionToken(member)

    if (result.includes(token)) {
      mentionedUserIds.add(member.id)
      continue
    }

    const pattern = new RegExp(
      `(?<!\\[)@${escapeRegExp(label)}(?=\\s|$|[.,!?;:])`,
      "gi",
    )

    if (pattern.test(result)) {
      result = result.replace(pattern, token)
      mentionedUserIds.add(member.id)
    }
  }

  return {
    content: result,
    mentionedUserIds: [...mentionedUserIds],
  }
}

export function filterMentionMembers(
  members: MentionMember[],
  query: string,
  currentUserId?: string,
) {
  const normalized = query.trim().toLowerCase()
  return members
    .filter((member) => member.id !== currentUserId)
    .filter((member) => {
      if (!normalized) return true
      const name = getUserDisplayName(member).toLowerCase()
      const email = member.email?.toLowerCase() ?? ""
      const emailLocal = email.split("@")[0] ?? ""
      return (
        name.includes(normalized) ||
        email.includes(normalized) ||
        emailLocal.includes(normalized)
      )
    })
    .slice(0, 8)
}

export type MentionTextPart =
  | { type: "text"; value: string }
  | { type: "mention"; userId: string; label: string }

export function parseMentionParts(content: string): MentionTextPart[] {
  const parts: MentionTextPart[] = []
  let lastIndex = 0

  for (const match of content.matchAll(MENTION_TOKEN_REGEX)) {
    const index = match.index ?? 0
    if (index > lastIndex) {
      parts.push({ type: "text", value: content.slice(lastIndex, index) })
    }
    parts.push({
      type: "mention",
      userId: match[2],
      label: match[1],
    })
    lastIndex = index + match[0].length
  }

  if (lastIndex < content.length) {
    parts.push({ type: "text", value: content.slice(lastIndex) })
  }

  return parts.length ? parts : [{ type: "text", value: content }]
}

export function getMentionQueryAtCursor(value: string, cursor: number) {
  const before = value.slice(0, cursor)
  const match = /(?:^|\s)@([^\s@[\]()]{0,40})$/.exec(before)
  if (!match) return null
  return {
    query: match[1],
    start: before.length - match[1].length - 1,
    end: cursor,
  }
}
