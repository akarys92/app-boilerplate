import { NextResponse } from 'next/server';
import { sendChatMessage } from '@app/chat';

export async function POST(request: Request) {
  const body = await request.json();
  const { threadId, message } = body as { threadId?: string; message?: string };

  if (!threadId || !message) {
    return NextResponse.json({ error: 'threadId and message are required' }, { status: 400 });
  }

  try {
    const result = sendChatMessage(threadId, message);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ status: 'ok' });
}

