import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import crypto from "crypto"
import bcrypt from "bcryptjs"
import { getAttachmentCopyUrl, getAttachmentOpenCloudUrl } from "@/lib/storage"
import { isOpenCloudEnabled } from "@/lib/storage/config"
import {
  getAttachmentUrl,
  isZubeeShareOrProxyUrl,
  isOpenCloudHttpUrl,
} from "@/lib/attachment-url"

export async function POST(request: Request) {
  const session = await auth()

  if (!session) {
    return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 })
  }

  try {
    const { attachmentId, expiresInDays, password } = await request.json()

    if (!attachmentId) {
      return NextResponse.json({ error: "Dosya ID'si eksik" }, { status: 400 })
    }

    const attachment = await prisma.attachment.findUnique({
      where: { id: attachmentId },
    })

    if (!attachment) {
      return NextResponse.json({ error: "Dosya bulunamadı" }, { status: 404 })
    }

    const openCloudUrl = await getAttachmentCopyUrl(attachment)
    if (openCloudUrl) {
      await prisma.attachment.update({
        where: { id: attachmentId },
        data: { path: openCloudUrl },
      })

      return NextResponse.json({
        success: true,
        link: openCloudUrl,
        openCloud: true,
      })
    }

    if (isOpenCloudEnabled() && attachment.remotePath) {
      const url = await getAttachmentOpenCloudUrl(attachment)
      await prisma.attachment.update({
        where: { id: attachmentId },
        data: { path: url },
      })

      return NextResponse.json({
        success: true,
        link: url,
        openCloud: true,
      })
    }

    const existingUrl = getAttachmentUrl(attachment)
    if (isOpenCloudHttpUrl(existingUrl) && !isZubeeShareOrProxyUrl(existingUrl)) {
      return NextResponse.json({
        success: true,
        link: existingUrl,
        openCloud: true,
      })
    }

    await prisma.sharedLink.deleteMany({
      where: { attachmentId },
    })

    const token = crypto.randomBytes(16).toString("hex")

    let expiresAt = null
    if (expiresInDays) {
      expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + Number(expiresInDays))
    }

    let hashedPassword = null
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10)
    }

    await prisma.sharedLink.create({
      data: {
        token,
        attachmentId,
        expiresAt,
        password: hashedPassword,
      },
    })

    return NextResponse.json({
      success: true,
      link: `/public/share/${token}`,
      openCloud: false,
    })
  } catch (error) {
    console.error("Share error:", error)
    return NextResponse.json(
      { error: "Paylaşım linki oluşturulurken bir hata oluştu" },
      { status: 500 },
    )
  }
}
