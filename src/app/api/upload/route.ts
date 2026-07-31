import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { storeFile, type UploadContext } from "@/lib/storage"
import { getAttachmentUrl } from "@/lib/attachment-url"
import { requireOpenCloudStorage } from "@/lib/storage/config"

export async function POST(request: Request) {
  const session = await auth()

  if (!session) {
    return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 })
  }

  try {
    if (process.env.OPENCLOUD_ENABLED === "true") {
      requireOpenCloudStorage()
    }

    const formData = await request.formData()
    const file = formData.get("file") as File
    const cardId = formData.get("cardId") as string | null
    const boardId = formData.get("boardId") as string | null
    const chatGroupId = formData.get("chatGroupId") as string | null

    if (!file) {
      return NextResponse.json({ error: "Dosya eksik" }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    let context: UploadContext = { type: "general" }
    if (cardId) {
      context = { type: "card", cardId }
    } else if (boardId) {
      context = { type: "board-cover", boardId }
    } else if (chatGroupId) {
      const membership = await prisma.chatGroupMember.findUnique({
        where: {
          chatGroupId_userId: {
            chatGroupId,
            userId: session.user.id,
          },
        },
      })

      if (!membership && session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Yetkisiz" }, { status: 403 })
      }

      context = { type: "chat", chatGroupId }
    }

    const stored = await storeFile(file.name, buffer, file.type, context)

    const width = formData.get("width")
      ? parseInt(formData.get("width") as string)
      : null
    const height = formData.get("height")
      ? parseInt(formData.get("height") as string)
      : null

    const attachment = await prisma.attachment.create({
      data: {
        filename: file.name,
        path: stored.path,
        remotePath: stored.remotePath,
        storageProvider: stored.storageProvider,
        mimeType: file.type,
        size: file.size,
        width,
        height,
        cardId: cardId || null,
        chatMessageId: null,
      },
    })

    const url = getAttachmentUrl(attachment)

    return NextResponse.json({
      success: true,
      attachment: { ...attachment, url },
      url,
    })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Dosya yüklenirken bir hata oluştu",
      },
      { status: 500 },
    )
  }
}
