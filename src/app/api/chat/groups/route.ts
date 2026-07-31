import { NextResponse } from "next/server"
import { getUserChatGroups } from "@/app/actions/chatActions"

export async function GET() {
  try {
    const groups = await getUserChatGroups()
    return NextResponse.json(groups)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Sohbet grupları alınamadı"
    const status = message === "Yetkisiz" ? 401 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
