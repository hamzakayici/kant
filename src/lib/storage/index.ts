import { prisma } from "@/lib/prisma"
import {
  getOpenCloudConfig,
  getStorageProvider,
  isOpenCloudEnabled,
  requireOpenCloudStorage,
  type StorageProvider,
} from "./config"
import {
  buildBoardCoverPath,
  buildBoardRootPath,
  buildCardPath,
  buildChatPath,
} from "./paths"
import {
  deleteFromOpenCloud,
  downloadFromOpenCloud,
  ensureOpenCloudDirectory,
  getOrCreateOpenCloudPublicShare,
  initializeOpenCloudRoot,
  uploadToOpenCloud,
} from "./opencloud"
import { deleteLocalFile, readLocalFile, saveLocalFile } from "./local"
import { isZubeeShareOrProxyUrl } from "@/lib/attachment-url"
import { buildOpenCloudFileUrl, resolveRemotePath } from "./urls"

export type UploadContext =
  | { type: "card"; cardId: string }
  | { type: "board-cover"; boardId: string }
  | { type: "chat"; chatGroupId: string }
  | { type: "general" }

export type StoredFile = {
  path: string
  remotePath: string | null
  storageProvider: StorageProvider
  url: string
}

async function resolveBoard(boardId: string) {
  const board = await prisma.board.findUnique({ where: { id: boardId } })
  if (!board) {
    throw new Error("Pano bulunamadı")
  }
  return board
}

async function resolveCard(cardId: string) {
  const card = await prisma.card.findUnique({
    where: { id: cardId },
    include: {
      column: {
        include: { board: true },
      },
    },
  })

  if (!card) {
    throw new Error("Kart bulunamadı")
  }

  return card
}

async function resolveChatGroup(chatGroupId: string) {
  const group = await prisma.chatGroup.findUnique({
    where: { id: chatGroupId },
    include: { board: true },
  })

  if (!group) {
    throw new Error("Sohbet grubu bulunamadı")
  }

  return group
}

export async function ensureBoardOpenCloudStructure(
  boardId: string,
): Promise<string | null> {
  const config = getOpenCloudConfig()
  if (!config) return null

  const board = await resolveBoard(boardId)
  const boardRoot = buildBoardRootPath(config.root, board.identifier, board.name)

  await initializeOpenCloudRoot()
  await ensureOpenCloudDirectory(boardRoot)
  await ensureOpenCloudDirectory(`${boardRoot}/cards`)
  await ensureOpenCloudDirectory(`${boardRoot}/covers`)
  await ensureOpenCloudDirectory(`${boardRoot}/chat`)

  if (board.openCloudPath !== boardRoot) {
    await prisma.board.update({
      where: { id: board.id },
      data: { openCloudPath: boardRoot },
    })
  }

  return boardRoot
}

async function getBoardRoot(boardId: string): Promise<string> {
  const board = await resolveBoard(boardId)
  if (board.openCloudPath) {
    return board.openCloudPath
  }

  const created = await ensureBoardOpenCloudStructure(boardId)
  if (!created) {
    throw new Error("OpenCloud yapılandırması eksik")
  }

  return created
}

async function buildRemotePath(
  context: UploadContext,
  filename: string,
): Promise<string | null> {
  const config = getOpenCloudConfig()
  if (!config) return null

  if (context.type === "card") {
    const card = await resolveCard(context.cardId)
    const boardRoot = await getBoardRoot(card.column.board.id)
    return buildCardPath(boardRoot, card.sequenceId, card.title, filename)
  }

  if (context.type === "board-cover") {
    const board = await resolveBoard(context.boardId)
    const boardRoot = await getBoardRoot(board.id)
    return buildBoardCoverPath(boardRoot, filename)
  }

  if (context.type === "chat") {
    const group = await resolveChatGroup(context.chatGroupId)
    const boardRoot = await getBoardRoot(group.boardId)
    return buildChatPath(boardRoot, group.name, filename)
  }

  return `${config.root}/general/${Date.now()}-${filename}`
}

async function resolvePublicUrl(remotePath: string): Promise<string> {
  const publicShare = await getOrCreateOpenCloudPublicShare(remotePath)
  if (publicShare) return publicShare

  return buildOpenCloudFileUrl(remotePath)
}

export async function storeFile(
  filename: string,
  content: Buffer,
  mimeType: string,
  context: UploadContext,
): Promise<StoredFile> {
  const provider = getStorageProvider()
  const remotePath = await buildRemotePath(context, filename)

  if (provider === "OPENCLOUD") {
    requireOpenCloudStorage()
    if (!remotePath) {
      throw new Error("OpenCloud remote path oluşturulamadı")
    }

    await uploadToOpenCloud(remotePath, content, mimeType)
    const url = await resolvePublicUrl(remotePath)

    return {
      path: url,
      remotePath,
      storageProvider: "OPENCLOUD",
      url,
    }
  }

  const localPath = await saveLocalFile(filename, content)

  if (provider === "DUAL" && remotePath) {
    try {
      await uploadToOpenCloud(remotePath, content, mimeType)
      const url = await resolvePublicUrl(remotePath)
      return {
        path: url,
        remotePath,
        storageProvider: "DUAL",
        url,
      }
    } catch (error) {
      console.error("OpenCloud mirror upload failed:", error)
    }
  }

  return {
    path: localPath,
    remotePath: provider === "DUAL" ? remotePath : null,
    storageProvider: provider,
    url: localPath,
  }
}

export async function readStoredFile(attachment: {
  path: string
  remotePath?: string | null
}): Promise<Buffer> {
  const remote =
    attachment.remotePath ||
    (attachment.path.startsWith("opencloud://")
      ? attachment.path.replace("opencloud://", "")
      : null)

  if (remote) {
    return downloadFromOpenCloud(remote)
  }

  if (
    attachment.path.startsWith("http://") ||
    attachment.path.startsWith("https://")
  ) {
    throw new Error(
      "OpenCloud URL'sinden doğrudan okuma yapılamıyor; remotePath eksik",
    )
  }

  try {
    return await readLocalFile(attachment.path)
  } catch (error) {
    throw error
  }
}

export async function deleteStoredFile(attachment: {
  path: string
  remotePath?: string | null
}): Promise<void> {
  const isHttp =
    attachment.path.startsWith("http://") ||
    attachment.path.startsWith("https://")
  const isOpenCloudProtocol = attachment.path.startsWith("opencloud://")

  if (!isHttp && !isOpenCloudProtocol) {
    try {
      await deleteLocalFile(attachment.path)
    } catch (error) {
      console.error("Local file delete failed:", error)
    }
  }

  const remote =
    attachment.remotePath ||
    (isOpenCloudProtocol ? attachment.path.replace("opencloud://", "") : null)

  if (remote) {
    try {
      await deleteFromOpenCloud(remote)
    } catch (error) {
      console.error("OpenCloud delete failed:", error)
    }
  }
}

export async function getAttachmentOpenCloudUrl(attachment: {
  path: string
  remotePath?: string | null
}): Promise<string> {
  const remote = resolveRemotePath(attachment)

  if (
    attachment.path.startsWith("http://") ||
    attachment.path.startsWith("https://")
  ) {
    if (!isZubeeShareOrProxyUrl(attachment.path)) {
      return attachment.path
    }
  }

  if (!remote) {
    throw new Error("OpenCloud remote path bulunamadı")
  }

  const publicShare = await getOrCreateOpenCloudPublicShare(remote)
  return publicShare || buildOpenCloudFileUrl(remote)
}

/** Panoya kopyalama için OpenCloud bağlantısı — public share veya WebDAV/Files URL. */
export async function getAttachmentCopyUrl(attachment: {
  id: string
  path: string
  remotePath?: string | null
}): Promise<string | null> {
  if (!isOpenCloudEnabled() || !getOpenCloudConfig()) {
    return null
  }

  const remote = resolveRemotePath(attachment)
  if (!remote) return null

  return getAttachmentOpenCloudUrl({
    path: attachment.path,
    remotePath: remote,
  })
}

export async function syncBoardToOpenCloud(
  boardId: string,
): Promise<string | null> {
  return ensureBoardOpenCloudStructure(boardId)
}

export { buildOpenCloudFileUrl } from "./urls"
