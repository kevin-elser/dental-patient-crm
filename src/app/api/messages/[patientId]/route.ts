import { NextResponse } from "next/server";
import { appPrisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  context: { params: Promise<{ patientId: string }> }
) {
  try {
    const { patientId } = await context.params;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '0');
    const pageSize = 25;
    
    // Validate patientId is a number
    const patientIdNum = parseInt(patientId, 10);
    if (isNaN(patientIdNum)) {
      return NextResponse.json(
        { error: "Invalid patient ID" },
        { status: 400 }
      );
    }

    // Get total count for pagination
    const totalCount = await appPrisma.message.count({
      where: {
        patientId: BigInt(patientIdNum),
      },
    });

    // Get messages in descending order (newest first)
    const messages = await appPrisma.message.findMany({
      where: {
        patientId: BigInt(patientIdNum),
      },
      orderBy: {
        createdAt: "desc", // This ensures newest messages come first
      },
      take: pageSize,
      skip: page * pageSize,
    });

    // Create audit logs for message views
    await Promise.all(
      messages.map((message) =>
        appPrisma.messageAudit.create({
          data: {
            messageId: message.id,
            action: "VIEW",
            userId: "development",
            ipAddress: request.headers.get("x-forwarded-for") || "unknown",
            userAgent: request.headers.get("user-agent") || "unknown",
          },
        })
      )
    );

    // Convert BigInt to string for JSON serialization and ensure dates are properly formatted
    const serializedMessages = messages.map(message => ({
      ...message,
      patientId: message.patientId.toString(),
      createdAt: new Date(message.createdAt).toISOString(),
      updatedAt: new Date(message.updatedAt).toISOString(),
    }));

    return NextResponse.json({
      messages: serializedMessages,
      hasMore: (page + 1) * pageSize < totalCount,
      totalCount,
    });
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
} 