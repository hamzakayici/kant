import { ImageResponse } from "next/og"
import { prisma } from "@/lib/prisma"
import {
  cardShareSelect,
  formatCardSharePreview,
  getCardShareCover,
} from "@/lib/card-share"
import { readStoredFile } from "@/lib/storage"

export const runtime = "nodejs"

function toDataUrl(buffer: Buffer, mimeType: string) {
  return `data:${mimeType};base64,${buffer.toString("base64")}`
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const boardId = searchParams.get("boardId")
  const cardId = searchParams.get("cardId")

  if (!boardId || !cardId) {
    return new Response("boardId and cardId required", { status: 400 })
  }

  const card = await prisma.card.findFirst({
    where: { id: cardId, column: { boardId } },
    select: cardShareSelect,
  })

  if (!card) {
    return new Response("Card not found", { status: 404 })
  }

  const preview = formatCardSharePreview(card)
  const cover = getCardShareCover(card)
  let coverSrc: string | null = null

  if (cover?.id) {
    try {
      const attachment = await prisma.attachment.findUnique({
        where: { id: cover.id },
      })
      if (attachment?.mimeType?.startsWith("image/")) {
        const buffer = await readStoredFile(attachment)
        coverSrc = toDataUrl(buffer, attachment.mimeType)
      }
    } catch {
      coverSrc = null
    }
  }

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          background: "#0f1115",
          color: "#f4f4f5",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {coverSrc ? (
          <div
            style={{
              display: "flex",
              height: 280,
              width: "100%",
              overflow: "hidden",
            }}
          >
            <img
              src={coverSrc}
              alt=""
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
          </div>
        ) : null}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            padding: 40,
            justifyContent: "center",
            gap: 16,
          }}
        >
          <div
            style={{
              fontSize: 22,
              color: "#a1a1aa",
              fontWeight: 600,
            }}
          >
            {preview.boardName}
          </div>
          <div
            style={{
              fontSize: 34,
              fontWeight: 700,
              lineHeight: 1.2,
            }}
          >
            {preview.identifier} · {preview.title}
          </div>
          <div style={{ fontSize: 22, color: "#d4d4d8" }}>
            {preview.columnName}
            {preview.assignees ? ` · ${preview.assignees}` : ""}
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    },
  )
}
