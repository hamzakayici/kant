import { prisma } from "../src/lib/prisma"
import {
  ensureBoardOpenCloudStructure,
  getAttachmentOpenCloudUrl,
} from "../src/lib/storage"
import { isOpenCloudEnabled } from "../src/lib/storage/config"
import { readLocalFile } from "../src/lib/storage/local"
import {
  buildBoardCoverPath,
  buildCardPath,
  buildChatPath,
} from "../src/lib/storage/paths"
import { uploadToOpenCloud } from "../src/lib/storage/opencloud"
import { isOpenCloudHttpUrl } from "../src/lib/attachment-url"

async function main() {
  if (!isOpenCloudEnabled()) {
    console.error("OPENCLOUD_ENABLED=true olmalı")
    process.exit(1)
  }

  const boards = await prisma.board.findMany()
  console.log(`Syncing ${boards.length} boards...`)

  for (const board of boards) {
    const boardRoot = await ensureBoardOpenCloudStructure(board.id)
    console.log(`Board ${board.identifier}: ${boardRoot}`)
  }

  const attachments = await prisma.attachment.findMany({
    include: {
      card: {
        include: {
          column: {
            include: { board: true },
          },
        },
      },
      chatMessage: {
        include: {
          chatGroup: {
            include: { board: true },
          },
        },
      },
    },
  })

  console.log(`Syncing ${attachments.length} attachments...`)

  for (const attachment of attachments) {
    if (isOpenCloudHttpUrl(attachment.path) && attachment.remotePath) {
      continue
    }

    try {
      let remotePath = attachment.remotePath
      let content: Buffer | null = null

      if (!remotePath) {
        if (attachment.path.startsWith("opencloud://")) {
          remotePath = attachment.path.replace("opencloud://", "")
        } else if (!attachment.path.startsWith("http")) {
          content = await readLocalFile(attachment.path)
        }

        if (!remotePath && attachment.card) {
          const board = attachment.card.column.board
          const boardRoot =
            board.openCloudPath ||
            (await ensureBoardOpenCloudStructure(board.id))
          if (!boardRoot) continue
          remotePath = buildCardPath(
            boardRoot,
            attachment.card.sequenceId,
            attachment.card.title,
            attachment.filename,
          )
        } else if (!remotePath && attachment.chatMessage?.chatGroup) {
          const board = attachment.chatMessage.chatGroup.board
          const boardRoot =
            board.openCloudPath ||
            (await ensureBoardOpenCloudStructure(board.id))
          if (!boardRoot) continue
          remotePath = buildChatPath(
            boardRoot,
            attachment.chatMessage.chatGroup.name,
            attachment.filename,
          )
        } else if (!remotePath && !attachment.cardId && !attachment.chatMessageId) {
          const boardCover = await prisma.board.findFirst({
            where: {
              coverImage: { contains: attachment.id },
            },
          })
          if (boardCover) {
            const boardRoot =
              boardCover.openCloudPath ||
              (await ensureBoardOpenCloudStructure(boardCover.id))
            if (boardRoot) {
              remotePath = buildBoardCoverPath(boardRoot, attachment.filename)
            }
          }
        }

        if (!remotePath) {
          console.warn(`Skipped ${attachment.id} (no context)`)
          continue
        }

        if (content) {
          await uploadToOpenCloud(remotePath, content, attachment.mimeType)
        }
      }

      const url = await getAttachmentOpenCloudUrl({
        path: attachment.path,
        remotePath,
      })

      await prisma.attachment.update({
        where: { id: attachment.id },
        data: {
          path: url,
          remotePath,
          storageProvider: "OPENCLOUD",
        },
      })

      if (!attachment.cardId && !attachment.chatMessageId) {
        const board = await prisma.board.findFirst({
          where: { coverImage: { contains: attachment.id } },
        })
        if (board) {
          await prisma.board.update({
            where: { id: board.id },
            data: { coverImage: url },
          })
        }
      }

      console.log(`Synced ${attachment.filename} -> ${url}`)
    } catch (error) {
      console.error(`Failed ${attachment.id}:`, error)
    }
  }

  const boardsWithLegacyCovers = await prisma.board.findMany({
    where: {
      coverImage: { startsWith: "/api/attachments/" },
    },
  })

  for (const board of boardsWithLegacyCovers) {
    const attachmentId = board.coverImage?.split("/").pop()
    if (!attachmentId) continue

    const attachment = await prisma.attachment.findUnique({
      where: { id: attachmentId },
    })
    if (attachment && isOpenCloudHttpUrl(attachment.path)) {
      await prisma.board.update({
        where: { id: board.id },
        data: { coverImage: attachment.path },
      })
      console.log(`Updated board cover ${board.name} -> ${attachment.path}`)
    }
  }

  console.log("OpenCloud sync complete")
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error)
    await prisma.$disconnect()
    process.exit(1)
  })
