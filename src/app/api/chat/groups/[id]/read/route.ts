import { NextResponse } from "next/server"
import { markChatGroupAsRead } from "@/app/actions/chatActions"

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function POST(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params
    await markChatGroupAsRead(id)
    return NextResponse.json({ ok: true })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Okundu işaretlenemedi"
    const status = message === "Yetkisiz" ? 401 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
