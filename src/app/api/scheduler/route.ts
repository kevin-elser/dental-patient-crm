import { NextResponse } from 'next/server';
import { processScheduledMessages } from '@/lib/scheduler';

export async function GET() {
  try {
    await processScheduledMessages();
    return NextResponse.json({ status: 'ok' });
  } catch (error) {
    console.error('Scheduler error:', error);
    return NextResponse.json({ status: 'error' }, { status: 500 });
  }
} 