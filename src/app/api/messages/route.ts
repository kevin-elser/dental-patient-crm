import { NextResponse } from 'next/server';
import { sendSMS } from '@/lib/twilio';
import { appPrisma } from '@/lib/prisma';
import prisma from '@/lib/prisma';
import { serializeBigInt } from '@/lib/utils';

export async function POST(request: Request) {
  try {
    // TODO: Add authentication check here before production
    
    const { patientId, body } = await request.json();

    if (!patientId || !body) {
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
          phoneNumber, // Store the phone number in the reference
        },
      });
    } else if (!patientRef.phoneNumber) {
      // Update phone number if it's missing
      await appPrisma.patientReference.update({
        where: { id: patientRef.id },
        data: { phoneNumber },
      });
    }

    // Send the message via Twilio
    const result = await sendSMS(phoneNumber, body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    // Store the message in our database
    const message = await appPrisma.message.create({
      data: {
        direction: 'OUTBOUND',
        status: 'SENT',
        fromNumber: process.env.TWILIO_PHONE_NUMBER!,
        toNumber: phoneNumber,
        body,
        twilioSid: result.messageId,
        patientId: BigInt(patientId),
        patientRefId: patientRef.id,
        isEncrypted: true, // TODO: Implement proper encryption before production
        metadata: {},
      },
      include: {
        patientRef: true,
      },
    });

    // Create audit log with minimal info for now
    await appPrisma.messageAudit.create({
      data: {
        messageId: message.id,
        action: 'SEND',
        userId: 'development', // TODO: Add proper user tracking before production
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