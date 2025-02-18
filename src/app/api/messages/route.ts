import { NextResponse } from 'next/server';
import { sendSMS } from '@/lib/twilio';
import { appPrisma } from '@/lib/prisma';
import prisma from '@/lib/prisma';
import { serializeBigInt } from '@/lib/utils';

export async function POST(request: Request) {
  try {
    // Log the raw request body text first
    const rawBody = await request.text();
    console.log('API - Raw request body:', rawBody);
    
    // Parse it ourselves to see what we get
    const parsedBody = JSON.parse(rawBody);
    console.log('API - Parsed body:', parsedBody);
    
    const { patientId, body: messageBody, scheduledFor } = parsedBody;

    if (!patientId || !messageBody) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get patient info first to ensure we have the phone number
    const patientInfo = await prisma.patient.findFirst({
      where: { PatNum: BigInt(patientId) },
      select: {
        WirelessPhone: true,
        HmPhone: true,
        WkPhone: true,
      }
    });

    if (!patientInfo) {
      return NextResponse.json(
        { error: 'Patient not found' },
        { status: 404 }
      );
    }

    const phoneNumber = patientInfo.WirelessPhone || patientInfo.HmPhone || patientInfo.WkPhone;
    if (!phoneNumber) {
      return NextResponse.json(
        { error: 'No phone number found for patient' },
        { status: 400 }
      );
    }

    // Get or create patient reference
    let patientRef = await appPrisma.patientReference.findFirst({
      where: { patientId: BigInt(patientId) },
    });

    if (!patientRef) {
      patientRef = await appPrisma.patientReference.create({
        data: {
          patientId: BigInt(patientId),
          colorIndex: Math.floor(Math.random() * 8) + 1,
          phoneNumber,
        },
      });
    } else if (!patientRef.phoneNumber) {
      await appPrisma.patientReference.update({
        where: { id: patientRef.id },
        data: { phoneNumber },
      });
    }

    console.log('Scheduling message for:', scheduledFor);

    // Create the message in the database
    const message = await appPrisma.message.create({
      data: {
        direction: 'OUTBOUND',
        status: scheduledFor ? 'SCHEDULED' : 'PENDING',
        fromNumber: process.env.TWILIO_PHONE_NUMBER!,
        toNumber: phoneNumber,
        body: messageBody,
        patientId: BigInt(patientId),
        patientRefId: patientRef.id,
        isEncrypted: true,
        metadata: {},
        ...(scheduledFor ? { scheduledFor: new Date(scheduledFor) } : {}),
      },
      include: {
        patientRef: true,
      },
    });

    console.log('Created message:', {
      id: message.id,
      status: message.status,
      scheduledFor: message.scheduledFor,
      body: message.body
    });

    // Only send the message now if it's not scheduled
    if (!scheduledFor) {
      console.log('Sending message immediately...');
      const result = await sendSMS(phoneNumber, messageBody);

      if (!result.success) {
        await appPrisma.message.update({
          where: { id: message.id },
          data: { status: 'FAILED' },
        });

        return NextResponse.json(
          { error: result.error },
          { status: 500 }
        );
      }

      // Update message with success status and Twilio SID
      await appPrisma.message.update({
        where: { id: message.id },
        data: {
          status: 'SENT',
          twilioSid: result.messageId,
        },
      });
    }

    // Create audit log
    await appPrisma.messageAudit.create({
      data: {
        messageId: message.id,
        action: scheduledFor ? 'SCHEDULE' : 'SEND',
        userId: 'development',
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    });

    return NextResponse.json(serializeBigInt(message));
  } catch (error) {
    console.error('Error in messages API:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { messageId } = await request.json();

    if (!messageId) {
      return NextResponse.json(
        { error: 'Message ID is required' },
        { status: 400 }
      );
    }

    // Get the message to verify it's a scheduled message
    const message = await appPrisma.message.findUnique({
      where: { id: messageId },
      include: {
        patientRef: true,
      },
    });

    if (!message) {
      return NextResponse.json(
        { error: 'Message not found' },
        { status: 404 }
      );
    }

    // Only allow deletion of scheduled messages that haven't been sent yet
    if (message.status !== 'SCHEDULED' || !message.scheduledFor || message.scheduledFor <= new Date()) {
      return NextResponse.json(
        { error: 'Only future scheduled messages can be deleted' },
        { status: 400 }
      );
    }

    // Delete in a transaction to ensure both operations succeed or fail together
    await appPrisma.$transaction(async (tx) => {
      // First delete all audit records
      await tx.messageAudit.deleteMany({
        where: { messageId: message.id }
      });

      // Then delete the message itself
      await tx.message.delete({
        where: { id: messageId },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting message:', error);
    return NextResponse.json(
      { error: 'Failed to delete message' },
      { status: 500 }
    );
  }
} 