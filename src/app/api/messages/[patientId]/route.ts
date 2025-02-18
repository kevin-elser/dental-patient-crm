import { NextResponse } from "next/server";
import { appPrisma } from "@/lib/prisma";
import { serializeBigInt } from '@/lib/utils';

export async function GET(
  request: Request,
  context: { params: Promise<{ patientId: string }> }
) {
  try {
    const { patientId } = await context.params;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '0');
    const isScheduled = searchParams.get('scheduled') === 'true';
    const pageSize = 20;

    const messages = await appPrisma.message.findMany({
      where: {
        patientId: BigInt(patientId),
        OR: isScheduled 
          ? [
              {
                status: 'SCHEDULED',
                scheduledFor: {
                  gt: new Date(),
                },
              },
            ]
          : [
              { status: 'SENT' },
              { status: 'PENDING' },
              { status: 'FAILED' },
              { status: 'SCHEDULED' },
            ],
      },
      orderBy: [
        {
          scheduledFor: 'desc',
        },
        {
          createdAt: 'desc',
        }
      ],
      skip: page * pageSize,
      take: pageSize + 1,
      include: {
        patientRef: true,
      },
    });

    // Sort messages by effective date (scheduledFor if exists, otherwise createdAt)
    const sortedMessages = messages.sort((a, b) => {
      const dateA = a.scheduledFor || a.createdAt;
      const dateB = b.scheduledFor || b.createdAt;
      return dateB.getTime() - dateA.getTime();
    });

    const hasMore = sortedMessages.length > pageSize;
    if (hasMore) {
      sortedMessages.pop();
    }

    return NextResponse.json(serializeBigInt({
      messages: sortedMessages,
      hasMore,
    }));
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
} 