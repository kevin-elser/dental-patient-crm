import { NextResponse } from 'next/server';
import { appPrisma } from '@/lib/prisma';

export async function DELETE(
  request: Request,
  { params }: { params: { messageId: string } }
) {
  try {
    const messageId = params.messageId;

    // Find the message first to ensure it exists and is scheduled
    const message = await appPrisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      return NextResponse.json(
        { error: 'Message not found' },
        { status: 404 }
      );
    }

    if (message.status !== 'SCHEDULED') {
      return NextResponse.json(
        { error: 'Only scheduled messages can be cancelled' },
        { status: 400 }
      );
    }

    // Delete the message
    await appPrisma.message.delete({
      where: { id: messageId },
    });

    // Create an audit log for the cancellation
    await appPrisma.messageAudit.create({
      data: {
        messageId: messageId,
        action: 'CANCELLED',
        userId: 'user',
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error cancelling message:', error);
    return NextResponse.json(
      { error: 'Failed to cancel message' },
      { status: 500 }
    );
  }
} 