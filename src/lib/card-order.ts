import type { Prisma } from "@/generated/prisma/client/client"

type Tx = Prisma.TransactionClient

type CardRow = { id: string }

export function buildMovedCardIds(
  orderedIds: string[],
  cardId: string,
  targetIndex: number,
): string[] {
  const fromIndex = orderedIds.indexOf(cardId)
  if (fromIndex === -1) {
    throw new Error("Kart sütunda bulunamadı")
  }

  const next = orderedIds.filter((id) => id !== cardId)
  const insertAt = Math.max(0, Math.min(targetIndex, next.length))
  next.splice(insertAt, 0, cardId)
  return next
}

export async function persistColumnCardOrder(
  tx: Tx,
  columnId: string,
  orderedIds: string[],
) {
  await Promise.all(
    orderedIds.map((id, index) =>
      tx.card.update({
        where: { id },
        data: { order: index, columnId },
      }),
    ),
  )
}

export async function normalizeColumnCardOrders(tx: Tx, columnId: string) {
  const cards = await tx.card.findMany({
    where: { columnId },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    select: { id: true },
  })

  await persistColumnCardOrder(
    tx,
    columnId,
    cards.map((card) => card.id),
  )

  return cards.length
}

export async function normalizeBoardCardOrders(tx: Tx, boardId: string) {
  const columns = await tx.column.findMany({
    where: { boardId },
    select: { id: true },
    orderBy: { order: "asc" },
  })

  let total = 0
  for (const column of columns) {
    total += await normalizeColumnCardOrders(tx, column.id)
  }
  return total
}

export function sortCardsByOrder<T extends { order: number; createdAt?: Date | string }>(
  cards: T[],
): T[] {
  return [...cards].sort((a, b) => {
    if (a.order !== b.order) return a.order - b.order
    const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0
    const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0
    return aTime - bTime
  })
}
