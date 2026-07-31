import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { readStoredFile, getAttachmentOpenCloudUrl } from "@/lib/storage"
import { getAttachmentUrl, isOpenCloudHttpUrl } from "@/lib/attachment-url"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await params

    const sharedLink = await prisma.sharedLink.findUnique({
      where: { token },
      include: { attachment: true },
    })

    if (!sharedLink) {
      return new NextResponse("Link bulunamadı veya süresi dolmuş", {
        status: 404,
      })
    }

    if (sharedLink.expiresAt && new Date() > sharedLink.expiresAt) {
      return new NextResponse("Bu bağlantının süresi dolmuş", { status: 410 })
    }

    const { attachment } = sharedLink
    const openCloudUrl = getAttachmentUrl(attachment)

    if (isOpenCloudHttpUrl(openCloudUrl)) {
      return NextResponse.redirect(openCloudUrl, 302)
    }

    const fileBuffer = await readStoredFile(attachment)

    const headers = new Headers()
    headers.set(
      "Content-Type",
      attachment.mimeType || "application/octet-stream",
    )
    headers.set(
      "Content-Disposition",
      `attachment; filename="${encodeURIComponent(attachment.filename)}"`,
    )
    headers.set("Content-Length", fileBuffer.length.toString())

    return new NextResponse(new Uint8Array(fileBuffer), { headers })
  } catch (error) {
    console.error("Download error:", error)

    try {
      const { token } = await params
      const sharedLink = await prisma.sharedLink.findUnique({
        where: { token },
        include: { attachment: true },
      })
      if (sharedLink?.attachment?.remotePath) {
        const url = await getAttachmentOpenCloudUrl(sharedLink.attachment)
        return NextResponse.redirect(url, 302)
      }
    } catch {
      // fall through
    }

    return new NextResponse("Sunucu hatası", { status: 500 })
  }
}
