export function getMessageAuthorId(message: {
  authorId?: string
  author?: { id?: string } | null
}) {
  return message.authorId ?? message.author?.id ?? ""
}

export function getMessageGroupFlags(
  messages: Array<{ authorId?: string; author?: { id?: string } | null }>,
  index: number,
) {
  const currentId = getMessageAuthorId(messages[index])
  const prevId =
    index > 0 ? getMessageAuthorId(messages[index - 1]) : null
  const nextId =
    index < messages.length - 1
      ? getMessageAuthorId(messages[index + 1])
      : null

  return {
    isGroupStart: currentId !== prevId,
    isGroupEnd: currentId !== nextId,
  }
}
