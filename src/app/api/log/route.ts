import { NextResponse } from 'next/server';
import { appendFileSync } from 'fs';
export async function POST(req: Request) {
  const body = await req.json();
  appendFileSync('/tmp/kanban_debug.log', JSON.stringify(body) + '\n');
  return NextResponse.json({ success: true });
}
