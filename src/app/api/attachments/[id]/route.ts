import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { readStoredFile, getAttachmentOpenCloudUrl } from "@/lib/storage"
import { canUserAccessAttachment } from "@/lib/attachment-access"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 })
  }

  const { id: attachmentId } = await params

  const attachment = await prisma.attachment.findUnique({
    where: { id: attachmentId },
    include: {
      chatMessage: {
        include: {
          chatGroup: {
            include: {
              members: { select: { userId: true } },
            },
          },
        },
      },
      card: {
        include: {
          column: { include: { board: { include: { members: true } } } },
        },
      },
    },
  })

  if (!attachment) {
    return NextResponse.json({ error: "Bulunamadı" }, { status: 404 })
  }

  const allowed = await canUserAccessAttachment(
    session.user.id,
    session.user.role,
    attachment,
  )

  if (!allowed) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 403 })
  }

  try {
    const fileBuffer = await readStoredFile(attachment)

    return new NextResponse(new Uint8Array(fileBuffer), {
      headers: {
        "Content-Type": attachment.mimeType,
        "Content-Length": fileBuffer.length.toString(),
        "Content-Disposition": `inline; filename="${encodeURIComponent(attachment.filename)}"`,
        "Cache-Control": "public, max-age=86400",
      },
    })
  } catch (error) {
    console.error("Attachment read error:", error)

    if (attachment.remotePath) {
      try {
        const fallbackUrl = await getAttachmentOpenCloudUrl(attachment)
        if (!fallbackUrl.includes("/s/")) {
          return NextResponse.redirect(fallbackUrl, 302)
        }
      } catch {
        // fall through
      }
    } else if (
      attachment.path.startsWith("http://") ||
      attachment.path.startsWith("https://")
    ) {
      // Mock data from seed script (like Unsplash images) which are external URLs
      return NextResponse.redirect(attachment.path, 302)
    }

    return NextResponse.json({ error: "Dosya bulunamadı" }, { status: 404 })
  }
}
