import twilio from 'twilio';

const isDevelopment = process.env.NODE_ENV === 'development';

// Only throw if we're in production and missing credentials
if (!isDevelopment && (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH || !process.env.TWILIO_PHONE_NUMBER)) {
  throw new Error('Missing required Twilio environment variables');
}

export const twilioClient = !isDevelopment ? twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH!
) : null;

export const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER || '+15555555555';

export type MessageResponse = {
  success: boolean;
  messageId?: string;
  error?: string;
};

export async function sendSMS(to: string, body: string): Promise<MessageResponse> {
  // In development, simulate successful message sending
  if (isDevelopment) {
    console.log('Development mode: Simulating SMS send');
    console.log(`To: ${to}`);
    console.log(`Body: ${body}`);
    
    return {
      success: true,
      messageId: `DEV_${Date.now()}_${Math.random().toString(36).substring(7)}`,
    };
  }

  // In production, use actual Twilio
  try {
    const message = await twilioClient!.messages.create({
      body,
      to,
      from: twilioPhoneNumber,
    });

    return {
      success: true,
      messageId: message.sid,
    };
  } catch (error) {
    console.error('Error sending SMS:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
} 