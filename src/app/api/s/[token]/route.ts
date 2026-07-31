import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { readStoredFile, getAttachmentOpenCloudUrl } from "@/lib/storage"
import { getAttachmentUrl, isOpenCloudHttpUrl } from "@/lib/attachment-url"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params

  const link = await prisma.sharedLink.findUnique({
    where: { token },
    include: { attachment: true },
  })

  if (!link || !link.attachment) {
    return NextResponse.json(
      { error: "Bağlantı bulunamadı veya süresi doldu" },
      { status: 404 },
    )
  }

  const openCloudUrl = getAttachmentUrl(link.attachment)
  if (isOpenCloudHttpUrl(openCloudUrl)) {
    return NextResponse.redirect(openCloudUrl, 302)
  }

  try {
    const fileBuffer = await readStoredFile(link.attachment)

    return new NextResponse(new Uint8Array(fileBuffer), {
      headers: {
        "Content-Type": link.attachment.mimeType,
        "Content-Length": fileBuffer.length.toString(),
        "Content-Disposition": `inline; filename="${encodeURIComponent(link.attachment.filename)}"`,
        "Cache-Control": "public, max-age=86400",
      },
    })
  } catch (error) {
    console.error("Shared file read error:", error)

    if (link.attachment.remotePath) {
      try {
        const url = await getAttachmentOpenCloudUrl(link.attachment)
        return NextResponse.redirect(url, 302)
      } catch {
        // fall through
      }
    }

    return NextResponse.json({ error: "Dosya bulunamadı" }, { status: 404 })
  }
}
