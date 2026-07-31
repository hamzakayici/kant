import "dotenv/config"
import { prisma } from "../src/lib/prisma"
import { normalizeBoardCardOrders } from "../src/lib/card-order"

async function main() {
  const boardId = process.argv[2]

  const total = await prisma.$transaction(async (tx) => {
    if (boardId) {
      const board = await tx.board.findUnique({
        where: { id: boardId },
        select: { id: true, name: true },
      })
      if (!board) {
        throw new Error(`Pano bulunamadı: ${boardId}`)
      }
      const count = await normalizeBoardCardOrders(tx, board.id)
      console.log(`✓ ${board.name}: ${count} kart sırası düzeltildi`)
      return count
    }

    const boards = await tx.board.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    })

    let totalCards = 0
    for (const board of boards) {
      const count = await normalizeBoardCardOrders(tx, board.id)
      totalCards += count
      console.log(`✓ ${board.name}: ${count} kart`)
    }

    console.log(`\nToplam ${totalCards} kart yeniden numaralandırıldı.`)
    return totalCards
  })

  if (!boardId) {
    void total
  }
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
